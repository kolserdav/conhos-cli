/******************************************************************************************
 * Repository: Conhos cli
 * File name: deploy.js
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Sun Sep 01 2024 13:12:51 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import { filesize } from 'filesize';
import { create } from 'tar';
import { tmpdir } from 'os';
import CacheChanged from 'cache-changed';
import { createReadStream, existsSync, mkdirSync, rmSync, stat } from 'fs';
import { basename, normalize, resolve } from 'path';
import WS from '../connectors/ws.js';
import { console, getPackagePath, stdoutWriteStart } from '../utils/lib.js';
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
  GIT_UNTRACKED_POLICY,
  HEADER_CONN_ID,
  HEADER_TARBALL,
  isCustomService,
  parseMessageCli,
  UPLOAD_CHUNK_DELIMITER,
  UPLOAD_REQUEST_TIMEOUT,
  UPLOADED_FILE_MESSAGE,
  VOLUME_LOCAL_POSTFIX_REGEX,
  VOLUME_LOCAL_REGEX,
} from '../types/interfaces.js';
import Inquirer from '../utils/inquirer.js';

/**
 * @typedef {import('../types/interfaces.js').ConfigFile} ConfigFile
 * @typedef {import('../connectors/ws.js').Options} Options
 * @typedef {import('../connectors/ws.js').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('cache-changed').CacheItem} CacheItem
 * @typedef {import('../types/interfaces.js').Status} Status
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
   */
  isNewUpload = false;

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
        case 'acceptDeleteCli':
          this.acceptDelete(rawMessage);
          break;
        case 'prepareDeployCli':
          this.prepareUpload(rawMessage);
          break;
        case 'deployDeleteFilesCli':
          this.deleteFiles(rawMessage);
          break;
        case 'deployGitCli':
          this.gitCli(rawMessage);
          break;
        case 'deployPrepareVolumeUploadCli':
          this.prepareVolumeUpload(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
  }

  /**
   * @private
   * @param {WSMessageCli<'deployPrepareVolumeUploadCli'>} msg
   */
  async prepareVolumeUpload({ data: { url, serviceName } }) {
    if (!this.config) {
      return;
    }
    const { services } = this.config;
    const servKeys = Object.keys(services);
    for (let i = 0; servKeys[i]; i++) {
      const key = servKeys[i];
      if (key === serviceName) {
        const { volumes } = services[key];
        if (!volumes) {
          console.error(
            'Something went wrong',
            'Program got signal to upload volume, but volumes is undefined',
            'Try again later'
          );
          break;
        }
        this.canClose = false;

        for (let _i = 0; volumes[_i]; _i++) {
          const volume = volumes[_i];
          const fileM = volume.match(VOLUME_LOCAL_REGEX);
          if (!fileM) {
            console.error(
              `Service "${key}" has wrong volume "${volume}"`,
              `It doesn't match to regexp ${VOLUME_LOCAL_REGEX}`
            );
            continue;
          }
          const filePath = fileM[0].replace(VOLUME_LOCAL_POSTFIX_REGEX, '');
          const file = basename(filePath);
          const { message, status } = await this.uploadFileRequest({
            filePath,
            url: `${url}/${file}`,
            service: serviceName,
            fileName: file,
            connId: this.connId,
            tarball: false,
          });
          stdoutWriteStart('');
          console[status](message, serviceName, file);
          if (status === 'error') {
            console.warn(`Failed to upload volume for service "${key}"`, filePath);
            process.exit(1);
          }
        }
        this.canClose = true;
      }
    }
  }

  /**
   * @private
   * @param {WSMessageCli<'deployDeleteFilesCli'>} param0
   */
  async deleteFiles({ data: { service, files, cwd, last, url }, status }) {
    if (files.length !== 0) {
      console[status](`Files deleted "${service}":\n`, files.map((item) => item).join('\n'));
    }

    let tarbalPath = '';

    if (this.isNewUpload) {
      tarbalPath = resolve(tmpdir(), `${this.project}.tgz`);
      console.info('Creating tarball ...', tarbalPath);
      await new Promise((_resolve) => {
        create(
          {
            file: tarbalPath,
            cwd,
            onwarn: (d) => {
              console.warn('Creating tarball onwarn', d.toString());
            },
          },
          this.fileList
        ).then((_) => {
          console.info('Tarball created', tarbalPath);
          _resolve(0);
        });
      });
    }
    if (tarbalPath) {
      await this.uploadFile({
        service,
        file: tarbalPath,
        cwd,
        last,
        latest: true,
        url,
        tarball: true,
      });
    } else {
      for (let i = 0; this.fileList[i]; i++) {
        const file = this.fileList[i];
        const latest = this.fileList[i + 1] === undefined;
        await this.uploadFile({ service, file, cwd, last, latest, url, tarball: false });
      }
    }

    if (this.fileList.length === 0) {
      this.sendMessage({
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
      process.exit(1);
    }
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
   * @param {WSMessageCli<'deployGitCli'>} param0
   */
  async gitCli({ data: { service, last } }) {
    if (!this.config) {
      return;
    }

    this.sendMessage({
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

  /**
   * @public
   * @param {WSMessageCli<'prepareDeployCli'>} param0
   */
  async prepareUpload({ data: { service, exclude, pwd, active, cache, git } }) {
    if (!this.config) {
      return;
    }

    if (cache.length === 0) {
      this.isNewUpload = true;
    }

    this.uploadedServices.push(service);

    const { services } = this.config;
    const activeServices = this.getActiveServices(services);
    const last = activeServices.length === this.uploadedServices.length;

    if (git) {
      console.info(
        'Starting synchronyze git',
        `Url: ${git.url}, branch: ${git.branch}, untracked: ${
          git.untracked || Object.keys(GIT_UNTRACKED_POLICY)[0]
        }`
      );
      this.sendMessage({
        token: this.token,
        message: '',
        type: 'deployGitServer',
        userId: this.userId,
        packageName: PACKAGE_NAME,
        data: {
          service,
          last,
          pwd,
          git,
          active,
        },
        status: 'info',
        connId: this.connId,
      });
      return;
    }

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

    const cached = this.changePWD({ cache, pwd });
    const { files, needUpload, deleted } =
      (await this.checkCache({ exclude, pwd, service, cached })) || [];

    if (!needUpload) {
      console.info('Skipping to upload service files', pwd);
      this.sendMessage({
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
    this.sendMessage({
      token: this.token,
      message: '',
      type: 'deployDeleteFilesServer',
      userId: this.userId,
      packageName: PACKAGE_NAME,
      data: {
        service,
        files: deleted.map(({ pathRel }) => pathRel),
        cwd,
        last,
        pwd: pwd || '',
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
   * }} param0
   */
  changePWD({ cache, pwd }) {
    const cwd = resolve(CWD, pwd);
    return cache.map((item) => {
      const _item = structuredClone(item);
      _item.pathAbs = resolve(cwd, item.pathRel);
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
   *  tarball: boolean
   * }} param0
   */
  async uploadFile({ service, file, cwd, last, latest, url, tarball }) {
    const num = 0;
    const filePath = resolve(cwd, file);

    if (!this.config) {
      return;
    }
    const { services } = this.config;
    let pwd = '';
    Object.keys(services).every((item) => {
      if (item === service) {
        pwd = services[item].pwd || '';
        if (pwd) {
          pwd = pwd.replace(/^\.\//, '');
        }
        return false;
      }
      return true;
    });

    const uploadUrl = `${url}/${tarball ? basename(file) : file}`;
    const { message, status } = await this.uploadFileRequest({
      filePath,
      url: uploadUrl,
      service,
      fileName: file,
      connId: this.connId,
      tarball,
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
    if (!this.config) {
      return;
    }

    const { name, services } = this.config;

    const packageProjectPath = getPackagePath(name);
    if (!existsSync(packageProjectPath)) {
      mkdirSync(packageProjectPath, { recursive: true });
    }

    const needToRemoveProject =
      typeof Object.keys(services).find((item) => services[item].active) === 'undefined';
    if (needToRemoveProject) {
      console.info('Starting remove project ', name);
    } else {
      console.info('Starting deploy project', name);
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
          volumes: this.volumes,
          interractive: this.options.interractive || false,
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
      process.exit(1);
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
    const cacheRes = await cacheChanged.create({ noWrite }).catch((err) => {
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
   * @param {{
   *  filePath: string
   *  url: string;
   *  service: string;
   *  fileName: string;
   *  connId: string;
   *  tarball: boolean;
   * }} param0
   * @returns {Promise<{
   *  status: Status
   *  message: string;
   *  code: number | undefined;
   * }>}
   */
  async uploadFileRequest({ filePath, url, service, fileName, connId, tarball }) {
    console.log(`Upload file "${service}"`, `Filename: ${fileName}, url: ${url}`);

    const allSize = await new Promise((_resolve) => {
      stat(filePath, (err, data) => {
        if (err) {
          console.error('Failed to get stat of file', err);
          _resolve(0);
          return;
        }
        const { size } = data;
        _resolve(size);
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

    const waitRead = async () =>
      new Promise((_resolve) => {
        const interval = setInterval(() => {
          if (!checkNeedWait()) {
            clearInterval(interval);
            _resolve(0);
          }
        }, 0);
      });

    const fn = await this.setRequest(url);

    return new Promise((_resolve) => {
      let size = 0;
      let sizeUpload = 0;
      let speed = '-- KB/s';
      let fileSize = '-- B';
      let oldSize = 0;
      const interval = setInterval(() => {
        const _speed = sizeUpload - oldSize;
        speed =
          _speed !== 0
            ? `${filesize(_speed / (UPLOAD_SPEED_INTERVAL / 1000), {
                standard: 'jedec',
              })}/s`
            : speed;
        oldSize = sizeUpload;
      }, UPLOAD_SPEED_INTERVAL);
      const interval2 = setInterval(() => {
        fileSize = filesize(sizeUpload, {
          standard: 'jedec',
        });
      }, 1000);

      /**
       * @param {number} _size
       * @param {number} curSize
       * @returns {number}
       */
      const calculatePercents = (_size, curSize) => {
        const _percent = (curSize / _size) * 100;
        return parseInt(_percent.toFixed(0), 10);
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
            [HEADER_TARBALL]: tarball ? '1' : '0',
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
            const { columns } = process.stdout;
            const shift = 10 - speed.length;

            const output = `${service}|${fileName} - uploading: ${percentUpload}% |${new Array(
              shift
            )
              .fill(' ')
              .join('')} ${speed} | read: ${percent}% | ${filesize(allSize, {
              standard: 'jedec',
            })}/${fileSize}`;
            let _output = output;
            if (output.length > columns) {
              _output = output.substring(0, columns > 4 ? columns - 4 : columns);
              _output += ' ...';
            }
            stdoutWriteStart(_output);
          });

          res.on('error', (err) => {
            stdoutWriteStart('');
            console.warn(
              'Can not upload file',
              `url: ${url}, percent: ${percent}, percentUpload: ${percentUpload}`
            );
            console.error('Failed to upload file', err);
            _resolve({
              status: 'error',
              code: res.statusCode,
              message: err.message,
            });
          });

          res.on('end', () => {
            _resolve({
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
        console.warn(
          'Request error',
          `url: ${url}, percent: ${percent}, percentUpload: ${percentUpload}`
        );
        console.error('Request failed', error);
        process.exit(1);
      });

      req.on('timeout', () => {
        stdoutWriteStart('');
        console.error('Request timeout exceeded', url);
        process.exit(1);
      });

      req.on('close', () => {
        req.destroy();
        clearInterval(interval);
        clearInterval(interval2);
      });
    });
  }
}
