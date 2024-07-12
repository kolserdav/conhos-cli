import CacheChanged from 'cache-changed';
import WS from '../connectors/ws.js';
import { console, getPackagePath, stdoutWriteStart } from '../utils/lib.js';
import { createReadStream, existsSync, mkdirSync, rmSync, stat } from 'fs';
import {
  CACHE_FILE_NAME,
  CONFIG_FILE_NAME,
  CONFIG_FILE_NAME_A,
  CWD,
  PACKAGE_NAME,
  UPLOAD_CHUNK_SIZE,
  UPLOAD_PERCENT_DIFF,
  UPLOAD_SPEED_INTERVAL,
} from '../utils/constants.js';
import {
  as,
  HEADER_CONN_ID,
  isCustomService,
  parseMessageCli,
  UPLOAD_CHUNK_DELIMITER,
  UPLOAD_REQUEST_TIMEOUT,
  UPLOADED_FILE_MESSAGE,
} from '../types/interfaces.js';
import Inquirer from '../utils/inquirer.js';
import { normalize, resolve } from 'path';
import { filesize } from 'filesize';

/**
 * @typedef {import('../types/interfaces.js').ConfigFile} ConfigFile
 * @typedef {import('../connectors/ws.js').Options} Options
 * @typedef {import('../connectors/ws.js').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('cache-changed').CacheItem} CacheItem
 * @typedef {import('../types/interfaces.js').Status} Status
 * @typedef {import('http').request} HttpRequest
 * @typedef {import('https').request} HttpsRequest
 */

/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {import('../connectors/ws.js').WSMessageCli<T>} WSMessageCli<T>
 */

const inquirer = new Inquirer();

export default class Deploy extends WS {
  /**
   * @private
   * @type {boolean}
   */
  cacheWorked = false;

  /**
   * @private
   * @type {ConfigFile | null}
   */
  config = null;

  /**
   * @private
   * @type {Record<string, string>}
   */
  cacheFilePath = {};

  /**
   * @private
   * @type {string[]}
   */
  fileList = [];

  /**
   * @private
   * @type {string[]}
   */
  uploadedServices = [];

  /**
   * @private
   * @type {HttpRequest | null}
   */
  request = null;

  /**
   * @private
   * @type {HttpsRequest | null}
   */
  requestHttps = null;

  /**
   * @public
   * @param {Options} options
   */
  constructor(options) {
    super(options);
  }

  /**
   * @public
   * @type {WS['listener']}
   */
  listener() {
    if (!this.conn) {
      return;
    }

    const ws = this;
    this.conn.on('message', async (d) => {
      const rawMessage = /** @type {typeof parseMessageCli<any>} */ (parseMessageCli)(d.toString());
      if (rawMessage === null) {
        return;
      }
      const { type } = rawMessage;
      /**
       * @type {keyof WSMessageDataCli}
       */
      const _type = type;
      switch (_type) {
        case 'setDomains':
          this.setDomainsHandler(rawMessage);
          break;
        case 'acceptDeleteCli':
          this.acceptDelete(rawMessage);
          break;
        case 'prepareDeployCli':
          this.prepareUpload(rawMessage);
          break;
        case 'deployDeleteFilesCli':
          this.deleteFiles(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
  }

  /**
   * @private
   * @param {WSMessageCli<'deployDeleteFilesCli'>} param0
   */
  async deleteFiles({ data: { service, files, cwd, last, url }, status }) {
    if (files.length !== 0) {
      console[status](`Files deleted "${service}":\n`, files.map((item) => item).join('\n'));
    }
    for (let i = 0; this.fileList[i]; i++) {
      const file = this.fileList[i];
      const latest = this.fileList[i + 1] === undefined;
      await this.uploadFile({ service, file, cwd, last, latest, url });
    }

    if (this.fileList.length === 0) {
      /** @type {typeof this.sendMessage<'deployEndServer'>} */ (this.sendMessage)({
        token: this.token,
        message: '',
        type: 'deployEndServer',
        userId: this.userId,
        packageName: PACKAGE_NAME,
        data: {
          service,
          skip: true,
          last,
          file: '',
          latest: true,
          num: 0,
        },
        status: 'info',
        connId: this.connId,
      });
    }
  }

  /**
   * @private
   * @param {WSMessageCli<'acceptDeleteCli'>} param0
   */
  async acceptDelete({ data: { serviceName, serviceType, containerName } }) {
    console.warn(
      `You want to delete service "${serviceName}" with type "${serviceType}"`,
      'If you have a needed data of it save it before'
    );
    const accDel = await inquirer.confirm(
      `Do you want to delete service "${serviceName}" with all data?`,
      false
    );
    if (accDel) {
      this
        /** @type {typeof this.sendMessage<'acceptDeleteServer'>} */ .sendMessage({
          token: this.token,
          message: '',
          type: 'acceptDeleteServer',
          userId: this.userId,
          packageName: PACKAGE_NAME,
          data: {
            containerName,
            accept: true,
          },
          status: 'info',
          connId: this.connId,
        });
    } else {
      console.info('Operation exited', 'Deletion canceled by user');
      process.exit(2);
    }
  }

  /**
   * @private
   * @param {WSMessageCli<'setDomains'>} param0
   */
  setDomainsHandler({ data }) {
    if (!this.config) {
      return;
    }
    const _configFile = structuredClone(this.config);
    Object.keys(this.config.services).forEach((item) => {
      if (!this.config) {
        return;
      }
      if (!this.config.services[item].active) {
        return;
      }
      const dataDomains = data.find((_item) => _item.serviceName === item);
      if (!dataDomains) {
        console.warn(`Failed to find domains for service "${item}"`, data);
        return;
      }
      const { domains } = dataDomains;
      _configFile.services[item].domains = domains;

      console.info(
        `Service "${item}" links:\n`,
        Object.keys(domains)
          .map((dK) => {
            const domain = domains[parseInt(dK, 10)];
            return `${dK}: ${/\./.test(domain) ? 'http://' : ''}${domain}`;
          })
          .join('\n ')
      );
    });
    this.writeConfigFile(_configFile);
  }

  /**
   * @private
   * @param {{service: string; project: string;}} param0
   */
  setCacheFilePath({ service, project }) {
    const packagePath = getPackagePath(`${project}/${service}`);
    if (!existsSync(packagePath)) {
      mkdirSync(packagePath, { recursive: true });
    }

    this.cacheFilePath[service] = resolve(packagePath, CACHE_FILE_NAME);
  }

  /**
   * @private
   * @param {ConfigFile['services']} services
   */
  getActiveServices(services) {
    return Object.keys(services)
      .map((item) => {
        const { active, type } = services[item];
        return active && isCustomService(type);
      })
      .filter((item) => item);
  }

  /**
   * @public
   * @param {WSMessageCli<'prepareDeployCli'>} param0
   */
  async prepareUpload({ data: { service, exclude, pwd, active, cache, pwdServer } }) {
    if (!this.config) {
      return;
    }

    this.uploadedServices.push(service);

    const { services } = this.config;
    const activeServices = this.getActiveServices(services);
    const last = activeServices.length === this.uploadedServices.length;

    this.setCacheFilePath({ project: this.project, service });

    if (!active) {
      console.info('Skipping to upload deleted service files', pwd);
      /** @type {typeof this.sendMessage<'deployEndServer'>} */ (this.sendMessage)({
        token: this.token,
        message: '',
        type: 'deployEndServer',
        userId: this.userId,
        packageName: PACKAGE_NAME,
        data: {
          service,
          skip: true,
          last,
          file: '',
          latest: true,
          num: 0,
        },
        status: 'info',
        connId: this.connId,
      });
      if (existsSync(this.cacheFilePath[service])) {
        console.info('Remove cache file', this.cacheFilePath[service]);
        rmSync(this.cacheFilePath[service]);
      }
      return;
    }

    const cached = this.changePWD({ cache, pwd, pwdServer });
    const { files, needUpload, deleted } =
      (await this.checkCache({ exclude, pwd, service, cached })) || [];

    if (!needUpload) {
      console.info('Skipping to upload service files', pwd);
      /** @type {typeof this.sendMessage<'deployEndServer'>} */ (this.sendMessage)({
        token: this.token,
        message: '',
        type: 'deployEndServer',
        userId: this.userId,
        packageName: PACKAGE_NAME,
        data: {
          service,
          skip: true,
          last,
          file: '',
          latest: true,
          num: 0,
        },
        status: 'info',
        connId: this.connId,
      });
      return;
    }

    const cwd = `${resolve(CWD, pwd)}/`;
    /** @type {typeof this.sendMessage<'deployDeleteFilesServer'>} */ (this.sendMessage)({
      token: this.token,
      message: '',
      type: 'deployDeleteFilesServer',
      userId: this.userId,
      packageName: PACKAGE_NAME,
      data: {
        service,
        files: deleted.map(({ pathAbs }) => pathAbs.replace(cwd, '')),
        cwd,
        last,
      },
      status: 'info',
      connId: this.connId,
    });

    this.fileList = files
      .filter((item) => !item.isDir)
      .map((item) => normalize(item.pathAbs).replace(cwd, ''));
  }

  /**
   * @private
   * @param {{
   *  cache: CacheItem[];
   *  pwd: string;
   *  pwdServer: string;
   * }} param0
   */
  changePWD({ cache, pwd, pwdServer }) {
    const cwd = resolve(CWD, pwd);
    return cache.map((item) => {
      const _item = structuredClone(item);
      _item.pathAbs = item.pathAbs.replace(pwdServer, cwd);
      return _item;
    });
  }

  /**
   * @private
   * @param {{
   *  service: string;
   *  file: string;
   *  cwd: string;
   *  last: boolean;
   *  latest: boolean;
   *  url: string;
   * }} param0
   */
  async uploadFile({ service, file, cwd, last, latest, url }) {
    let num = 0;
    const filePath = resolve(cwd, file);

    const { message, status } = await this.uploadFileRequest({
      filePath,
      url: `${url}/${file}`,
      service,
      fileName: file,
      connId: this.connId,
    });
    stdoutWriteStart('');
    console[status](`${message}: ${service}|${file}`, filePath);
    if (status === 'error') {
      process.exit(1);
    }

    /** @type {typeof this.sendMessage<'deployEndServer'>} */ (this.sendMessage)({
      token: this.token,
      message: '',
      type: 'deployEndServer',
      userId: this.userId,
      packageName: PACKAGE_NAME,
      data: {
        service,
        skip: false,
        last,
        file,
        latest,
        num,
      },
      status: 'info',
      connId: this.connId,
    });
  }

  /**
   * @public
   * @type {WS['handler']}
   */
  async handler(_, msg) {
    this.config = this.getConfig({ withoutWarns: true });
    if (!this.config) {
      return;
    }

    const { project, services } = this.config;

    const packageProjectPath = getPackagePath(project);
    if (!existsSync(packageProjectPath)) {
      mkdirSync(packageProjectPath, { recursive: true });
    }

    const needToRemoveProject =
      typeof Object.keys(services).find((item) => services[item].active) === 'undefined';
    if (needToRemoveProject) {
      console.info('Starting remove project ', project);
    } else {
      console.info('Starting deploy project', project);
    }

    this
      /** @type {typeof this.sendMessage<'deployServer'>} */ .sendMessage({
        token: this.token,
        message: '',
        type: 'prepareDeployServer',
        userId: this.userId,
        packageName: PACKAGE_NAME,
        data: {
          config: this.config,
          projectDeleted: needToRemoveProject,
        },
        status: 'info',
        connId: this.connId,
      });
  }

  /**
   * @private
   * @param {{
   *  pwd: string;
   *  service: string;
   *  cached: CacheItem[];
   *  exclude: ConfigFile['services'][0]['exclude']
   * }} param0
   */
  async checkCache({ exclude, pwd, service, cached }) {
    /**
     * @type {CacheItem[]}
     */
    let files = [];

    /**
     * @type {CacheItem[]}
     */
    let deleted = [];

    const targetDirPath = resolve(CWD, pwd);
    if (!existsSync(targetDirPath)) {
      console.warn('Target dir is missing', targetDirPath);
      console.error('Exited with code 2', 'Fix warning before and try again');
      process.exit(2);
    }

    const cacheChanged = new CacheChanged({
      cacheFilePath: this.cacheFilePath[service],
      exclude: exclude
        ? exclude.concat([CONFIG_FILE_NAME, CONFIG_FILE_NAME_A])
        : [CONFIG_FILE_NAME, CONFIG_FILE_NAME_A],
      targetDirPath,
    });

    if (this.options.clearCache && existsSync(this.cacheFilePath[service])) {
      this.removeCache(service);
    }

    let needUpload = false;
    if (!existsSync(this.cacheFilePath[service])) {
      needUpload = true;
      files = (await this.createCache(cacheChanged)) || [];
    } else {
      const cacheRes = await cacheChanged.compare().catch((err) => {
        console.error('Failed to compare cache', err, new Error().stack);
        console.warn('Cache skipping');
      });

      this.cacheWorked = typeof cacheRes !== 'undefined';
      if (this.cacheWorked && typeof cacheRes !== 'undefined') {
        needUpload = cacheRes.isChanged;
        await this.createCache(cacheChanged);
        files = [...new Set(cacheRes.added.concat(cacheRes.updated))];
        deleted = cacheRes.deleted;
      }
      if (!this.cacheWorked) {
        console.error(
          'Failed cache',
          `Remove folder ~/.${PACKAGE_NAME}/${this.project}/ and try again`
        );
        process.exit(1);
      }
    }
    const _files = await this.createCache(cacheChanged, true);

    if (_files) {
      _files.forEach((item) => {
        const file = cached.find((_item) => _item.pathAbs === item.pathAbs);
        if (!file) {
          files.push(item);
        } else if (file.size !== item.size) {
          files.push(item);
        }
      });

      cached.forEach((item) => {
        if (!_files.find((_item) => _item.pathAbs === item.pathAbs)) {
          deleted.push(item);
        }
      });
    }

    if (!needUpload) {
      needUpload = files.length !== 0 || deleted.length !== 0;
    }
    return { files: this.filterUnique(files), needUpload, deleted: this.filterUnique(deleted) };
  }

  /**
   * @param {CacheItem[]} files
   * @returns {CacheItem[]}
   */
  filterUnique(files) {
    return files.filter((item, index, array) => {
      const _index = array.findIndex((_item) => item.pathAbs === _item.pathAbs);
      return index === _index;
    });
  }

  /**
   * @param {string} service
   */
  removeCache(service) {
    rmSync(this.cacheFilePath[service]);
  }

  /**
   * @private
   * @param {CacheChanged} cacheChanged
   * @param {boolean} noWrite
   * @returns {Promise<CacheItem[] | null>}
   */
  async createCache(cacheChanged, noWrite = false) {
    let cacheRes = await cacheChanged.create({ noWrite }).catch((err) => {
      console.error('Failed to create cache', err, new Error().stack);
      console.warn('Cache skipping');
    });
    if (typeof cacheRes === 'undefined') {
      this.cacheWorked = false;
      return null;
    }
    this.cacheWorked = true;
    return /** @type {typeof as<CacheItem[]>} */ (as)(cacheRes);
  }

  /**
   * @private
   * @param {string} url
   * @returns {Promise<HttpRequest | HttpsRequest>}
   */
  async setRequest(url) {
    /**
     * @type {HttpRequest}
     */
    let result;
    if (/https:/.test(url)) {
      this.request =
        this.request ||
        (await new Promise((resolve) => {
          import('https').then((d) => {
            resolve(d.request);
          });
        }));
      result = /** @type {typeof as<HttpRequest>} */ (as)(this.request);
    } else {
      this.requestHttps =
        this.requestHttps ||
        (await new Promise((resolve) => {
          import('http').then((d) => {
            resolve(d.request);
          });
        }));
      result = /** @type {typeof as<HttpsRequest>} */ (as)(this.requestHttps);
    }
    return result;
  }

  /**
   * @private
   * @param {{
   *  filePath: string
   *  url: string;
   *  service: string;
   *  fileName: string;
   *  connId: string;
   * }} param0
   * @returns {Promise<{
   *  status: Status
   *  message: string;
   *  code: number | undefined;
   * }>}
   */
  async uploadFileRequest({ filePath, url, service, fileName, connId }) {
    console.log(`Upload file "${service}"`, { fileName, url });

    const allSize = await new Promise((resolve) => {
      stat(filePath, (err, data) => {
        if (err) {
          console.error('Failed to get stat of file', err);
          resolve(0);
          return;
        }
        const { size } = data;
        resolve(size);
      });
    });

    let percent = 0;
    let percentUpload = 0;

    const checkNeedWait = () => {
      if (percentUpload === 0 && percent === 0) {
        return false;
      }
      return percent - percentUpload >= UPLOAD_PERCENT_DIFF;
    };

    const waitRead = async () => {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (!checkNeedWait()) {
            clearInterval(interval);
            resolve(0);
          }
        }, 0);
      });
    };

    const fn = await this.setRequest(url);

    return new Promise((resolve) => {
      let size = 0;
      let sizeUpload = 0;
      let speed = '-- KB/s';
      let oldSize = 0;
      let interval = setInterval(() => {
        const _speed = sizeUpload - oldSize;
        speed =
          _speed !== 0
            ? `${filesize(_speed / (UPLOAD_SPEED_INTERVAL / 1000), {
                standard: 'jedec',
              })}/s`
            : speed;
        oldSize = sizeUpload;
      }, UPLOAD_SPEED_INTERVAL);

      /**
       * @param {number} size
       * @param {number} curSize
       * @returns {number}
       */
      const calculatePercents = (size, curSize) => {
        const percent = (curSize / size) * 100;
        return parseInt(percent.toFixed(0), 10);
      };
      const req = fn(
        url,
        {
          method: 'POST',
          headers: {
            'Transfer-Encoding': 'chunked',
            'content-type': 'application/octet-stream',
            'user-agent': `client ${this.package.version}`,
            host: url.replace(/https?:\/\//, '').replace(/\/.+$/, ''),
            [HEADER_CONN_ID]: connId,
          },
          timeout: UPLOAD_REQUEST_TIMEOUT,
        },
        (res) => {
          let message = '';

          res.on('data', (msg) => {
            const chunks = msg.toString().split(UPLOAD_CHUNK_DELIMITER);
            const chunk = chunks[chunks.length - 1];
            const _l = parseInt(chunk, 10);
            if (Number.isNaN(_l)) {
              message += chunk;
              return;
            }
            sizeUpload += _l;
            percentUpload = calculatePercents(allSize, sizeUpload);
            if (percent !== 100) {
              percent = calculatePercents(allSize, size);
            }
            const columns = process.stdout.columns;
            const shift = 10 - speed.length;

            const output = `${service}|${fileName} - uploading: ${percentUpload}% |${new Array(
              shift
            )
              .fill(' ')
              .join('')} ${speed} | read: ${percent}% | ${filesize(allSize, {
              standard: 'jedec',
            })}/${filesize(sizeUpload, {
              standard: 'jedec',
            })}`;
            let _output = output;
            if (output.length > columns) {
              _output = output.substring(0, columns > 4 ? columns - 4 : columns);
              _output += ' ...';
            }
            stdoutWriteStart(_output);
          });

          res.on('error', (err) => {
            stdoutWriteStart('');
            console.error('Failed to upload file', { err, url, percent, percentUpload });
            resolve({
              status: 'error',
              code: res.statusCode,
              message: err.message,
            });
          });

          res.on('end', () => {
            resolve({
              status:
                message === UPLOADED_FILE_MESSAGE.replace(UPLOAD_CHUNK_DELIMITER, '')
                  ? 'info'
                  : 'error',
              code: res.statusCode,
              message,
            });
          });
        }
      );

      const file = createReadStream(filePath, { highWaterMark: UPLOAD_CHUNK_SIZE });

      file.on('data', async (chunk) => {
        if (checkNeedWait()) {
          file.pause();
          await waitRead();
          file.resume();
        }
        size += chunk.length;
        req.write(chunk);
      });

      file.on('end', () => {
        stdoutWriteStart('');
        console.log('End read file', filePath);
        file.close();
        req.end();
      });

      file.on('error', (e) => {
        console.error('Failed to read file to upload', e);
      });

      req.on('error', (error) => {
        stdoutWriteStart('');
        console.error('Request failed', { error, url, percent, percentUpload });
        process.exit(1);
      });

      req.on('timeout', () => {
        stdoutWriteStart('');
        console.error('Request timeout exceeded', { url });
        process.exit(1);
      });

      req.on('close', () => {
        req.destroy();
        clearInterval(interval);
      });
    });
  }
}
