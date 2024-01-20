import WS from '../connectors/ws.js';
import Tar from '../utils/tar.js';
import { console, getTmpArchive, stdoutWriteStart } from '../utils/lib.js';
import { createReadStream, statSync, readdirSync } from 'fs';
import { CWD, EXPLICIT_EXCLUDE, PACKAGE_NAME } from '../utils/constants.js';
import { isCommonService, parseMessageCli } from '../types/interfaces.js';

/**
 * @typedef {import('../connectors/ws.js').Options} Options
 * @typedef {import('../connectors/ws.js').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 */

/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {import('../connectors/ws.js').WSMessageCli<T>} WSMessageCli<T>
 */

export default class Deploy extends WS {
  /**
   * @param {Options} options
   */
  constructor(options) {
    super(options);
  }

  /**
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
      switch (type) {
        case 'setDomains':
          this.setDomainsHandler(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
  }

  /**
   * @param {WSMessageCli<'setDomains'>} param0
   */
  setDomainsHandler({ data }) {
    const configFile = this.getConfig();
    if (!configFile) {
      return;
    }
    const _configFile = structuredClone(configFile);
    Object.keys(configFile.services).forEach((item) => {
      if (!configFile.services[item].active) {
        return;
      }
      const dataDomains = data.find((_item) => _item.service === item);
      if (!dataDomains) {
        console.warn(`Failed to find domains for service "${item}"`, data);
        return;
      }
      const { domains } = dataDomains;
      _configFile.services[item].domains = domains;
      console.info(
        `Service "${item}" links:\n`,
        Object.keys(domains)
          .map((dK) => `${dK}: http://${domains[parseInt(dK, 10)]}`)
          .join('\n ')
      );
    });
    this.writeConfigFile(_configFile);
  }

  /**
   *
   * @param {number} size
   * @param {number} curSize
   * @returns {number}
   */
  calculatePercents(size, curSize) {
    const percent = (curSize / size) * 100;
    return parseInt(percent.toFixed(0), 10);
  }

  /**
   * @type {WS['handler']}
   */
  async handler() {
    const config = this.getConfig();
    if (!config) {
      return;
    }

    const { exclude, project, services } = config;

    if (!Object.keys(services).find((item) => services[item].active)) {
      /** @type {typeof this.sendMessage<'deploy'>} */ (this.sendMessage)({
        token: this.token,
        message: '',
        type: 'deploy',
        userId: this.userId,
        packageName: PACKAGE_NAME,
        data: {
          num: 0,
          project,
          last: true,
          chunk: new Uint8Array(),
          config,
          nodeName: this.options.node,
        },
        status: 'info',
        connId: this.connId,
      });
      console.info('Starting remove project', project);
      return;
    }

    console.info('Starting deploy project', project);
    const fileTar = getTmpArchive(project);
    const tar = new Tar();
    await tar.create({
      fileList: readdirSync(CWD)
        .filter((item) => (exclude || []).indexOf(item) === -1)
        .filter((item) => EXPLICIT_EXCLUDE.indexOf(item) === -1),
      file: fileTar,
    });
    const stats = statSync(fileTar);
    const { size } = stats;
    let curSize = 0;

    const rStream = createReadStream(fileTar);
    let num = 0;
    rStream.on('data', (chunk) => {
      /** @type {typeof this.sendMessage<'deploy'>} */ (this.sendMessage)({
        token: this.token,
        message: '',
        type: 'deploy',
        userId: this.userId,
        packageName: PACKAGE_NAME,
        data: {
          num,
          project,
          last: false,
          chunk: new Uint8Array(Buffer.from(chunk)),
          config: num === 0 ? config : null,
          nodeName: this.options.node,
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
      /** @type {typeof this.sendMessage<'deploy'>} */ (this.sendMessage)({
        token: this.token,
        message: '',
        type: 'deploy',
        userId: this.userId,
        packageName: PACKAGE_NAME,
        data: {
          num,
          project,
          last: true,
          chunk: new Uint8Array(),
          config: null,
        },
        status: 'info',
        connId: this.connId,
      });
      stdoutWriteStart('');
      const percent = this.calculatePercents(size, curSize);
      console.info(`Project files uploaded to the cloud: ${percent}%`);
    });
  }
}
