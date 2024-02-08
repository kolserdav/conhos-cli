import CacheChanged from 'cache-changed';
import WS from '../connectors/ws.js';
import Tar from '../utils/tar.js';
import { console, getPackagePath, getTmpArchive, stdoutWriteStart } from '../utils/lib.js';
import { createReadStream, statSync, existsSync, mkdirSync } from 'fs';
import {
  CACHE_FILE_NAME,
  CONFIG_FILE_NAME,
  CONFIG_FILE_NAME_A,
  CWD,
  PACKAGE_NAME,
} from '../utils/constants.js';
import { as, parseMessageCli } from '../types/interfaces.js';
import Inquirer from '../utils/inquirer.js';
import path, { normalize } from 'path';

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
   * @type {boolean}
   */
  needUpload = false;

  /**
   * @private
   * @type {string}
   */
  cacheFilePath = '';

  /**
   * @private
   * @type {CacheItem[]}
   */
  files = [];

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
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
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
    const configFile = this.getConfig({ withoutWarns: true });
    if (!configFile) {
      return;
    }
    const _configFile = structuredClone(configFile);
    Object.keys(configFile.services).forEach((item) => {
      if (!configFile.services[item].active) {
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
   * @public
   * @param {WSMessageCli<'prepareDeployCli'>} param0
   */
  async prepareUpload({ data }) {
    const fileTar = getTmpArchive(this.project);
    const tar = new Tar();
    console.info('Creating tarball ...', fileTar);
    const fileList = this.files
      .filter((item) => !item.isDir)
      .map((item) => normalize(item.pathAbs).replace(`${CWD}/`, ''));
    const tarRes = await tar
      .create({
        fileList,
        file: fileTar,
      })
      .catch((error) => {
        console.error('Failed to create tarball', { error, fileList });
      });
    if (typeof tarRes === 'undefined') {
      process.exit(1);
    }
    console.info('Tarball created', fileTar);
    const stats = statSync(fileTar);
    const { size } = stats;
    let curSize = 0;

    const rStream = createReadStream(fileTar);
    let num = 0;
    rStream.on('data', (chunk) => {
      /** @type {typeof this.sendMessage<'deployServer'>} */ (this.sendMessage)({
        token: this.token,
        message: '',
        type: 'deployServer',
        userId: this.userId,
        packageName: PACKAGE_NAME,
        data: {
          num,
          chunk: new Uint8Array(Buffer.from(chunk)),
        },
        status: 'info',
        connId: this.connId,
      });
      num++;
      curSize += chunk.length;
      stdoutWriteStart(
        `Uploading the project to the cloud: ${this.calculatePercents(size, curSize)}%`
      );
    });
    rStream.on('close', () => {
      /** @type {typeof this.sendMessage<'deployEndServer'>} */ (this.sendMessage)({
        token: this.token,
        message: '',
        type: 'deployEndServer',
        userId: this.userId,
        packageName: PACKAGE_NAME,
        data: null,
        status: 'info',
        connId: this.connId,
      });
      stdoutWriteStart('');
      const percent = this.calculatePercents(size, curSize);
      console.info('Project files uploaded to the cloud', `${percent}%`);
    });
  }

  /**
   * @public
   * @type {WS['handler']}
   */
  async handler(_, msg) {
    const config = this.getConfig({ withoutWarns: true });
    if (!config) {
      return;
    }

    const { exclude, project, services } = config;

    const packageProjectPath = getPackagePath(project);
    if (!existsSync(packageProjectPath)) {
      mkdirSync(packageProjectPath, { recursive: true });
    }

    this.files = (await this.checkCache({ msg, project, exclude })) || [];

    const needToRemoveProject =
      typeof Object.keys(services).find((item) => services[item].active) === 'undefined';
    if (needToRemoveProject) {
      console.info('Starting remove project ', project);
    } else {
      console.info('Starting deploy project', project);
    }

    let projectChanged = true;
    if (needToRemoveProject || (!this.needUpload && this.cacheWorked)) {
      if (!this.needUpload) {
        console.info('No changed files', 'Upload skipping');
      }

      projectChanged = false;
    }

    this
      /** @type {typeof this.sendMessage<'deployServer'>} */ .sendMessage({
        token: this.token,
        message: '',
        type: 'prepareDeployServer',
        userId: this.userId,
        packageName: PACKAGE_NAME,
        data: {
          projectChanged,
          config,
        },
        status: 'info',
        connId: this.connId,
      });
  }

  /**
   * @private
   * @param {{
   *  msg: WSMessageCli<'checkTokenCli'> | undefined;
   *  project: string;
   *  exclude: ConfigFile['exclude']
   * }} param0
   */
  async checkCache({ project, exclude }) {
    /**
     * @type {CacheItem[] | null}
     */
    let cache = [];

    this.cacheFilePath = getPackagePath(`${project}/${CACHE_FILE_NAME}`);

    const cacheChanged = new CacheChanged({
      cacheFilePath: this.cacheFilePath,
      exclude: exclude
        ? exclude.concat([CONFIG_FILE_NAME, CONFIG_FILE_NAME_A])
        : [CONFIG_FILE_NAME, CONFIG_FILE_NAME_A],
    });

    if (!existsSync(this.cacheFilePath)) {
      this.needUpload = true;
      cache = await this.createCache(cacheChanged);
    } else {
      const cacheRes = await cacheChanged.compare().catch((err) => {
        console.error('Failed to compare cache', err, new Error().stack);
        console.warn('Cache skipping');
      });

      this.cacheWorked = typeof cacheRes !== 'undefined';
      if (this.cacheWorked && typeof cacheRes !== 'undefined') {
        this.needUpload = cacheRes.isChanged;
        cache = await this.createCache(cacheChanged);
      }
    }
    return cache;
  }

  /**
   * @private
   * @param {CacheChanged} cacheChanged
   * @returns {Promise<CacheItem[] | null>}
   */
  async createCache(cacheChanged) {
    let cacheRes = await cacheChanged.create().catch((err) => {
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
