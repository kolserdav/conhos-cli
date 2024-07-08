import CacheChanged from 'cache-changed';
import WS from '../connectors/ws.js';
import { console, getPackagePath, stdoutWriteStart, uploadFile } from '../utils/lib.js';
import { existsSync, mkdirSync, rmSync } from 'fs';
import {
  CACHE_FILE_NAME,
  CONFIG_FILE_NAME,
  CONFIG_FILE_NAME_A,
  CWD,
  PACKAGE_NAME,
} from '../utils/constants.js';
import { as, isCustomService, parseMessageCli } from '../types/interfaces.js';
import Inquirer from '../utils/inquirer.js';
import { normalize, resolve } from 'path';

/**
 * @typedef {import('../types/interfaces.js').ConfigFile} ConfigFile
 * @typedef {import('../connectors/ws.js').Options} Options
 * @typedef {import('../connectors/ws.js').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('cache-changed').CacheItem} CacheItem
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
   * @param {number} size
   * @param {number} curSize
   * @returns {number}
   */
  calculatePercents(size, curSize) {
    const percent = (curSize / size) * 100;
    return parseInt(percent.toFixed(0), 10);
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

    const { message, status } = await uploadFile({
      filePath,
      url: `${url}/${file}`,
      service,
      fileName: file,
    });
    stdoutWriteStart('');
    console[status](`${message}: ${service}|${file}`, filePath);

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
      rmSync(this.cacheFilePath[service]);
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
        files = cacheRes.added.concat(cacheRes.updated);
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
        if (!cached.find((_item) => _item.pathAbs === item.pathAbs)) {
          if (!needUpload) {
            needUpload = true;
          }
          files.push(item);
        }
      });

      cached.forEach((item) => {
        if (!_files.find((_item) => _item.pathAbs === item.pathAbs)) {
          if (!needUpload) {
            needUpload = true;
          }
          deleted.push(item);
        }
      });
    }
    return { files, needUpload, deleted };
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
}
