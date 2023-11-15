import { v4 } from 'uuid';
import WS from '../tools/ws.js';
import Tar from '../utils/tar.js';
import { getPackage, getTmpArchive, stdoutWriteStart, getConfigFilePath } from '../utils/lib.js';
import { createReadStream, statSync, existsSync, readFileSync, readdirSync } from 'fs';
import { LANG, PACKAGE_NAME, CWD, EXPLICIT_EXCLUDE } from '../utils/constants.js';
import { parseMessageCli } from '../types/interfaces.js';
import Yaml from '../utils/yaml.js';

const yaml = new Yaml();

/**
 * @typedef {import('../tools/ws.js').Options} Options
 * @typedef {import('../tools/ws.js').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 */

export default class Deploy extends WS {
  /**
   * @param {Options} options
   */
  constructor(options) {
    super(options);
    /**
     * @type {string}
     */
    this.configFile = getConfigFilePath();
    this.listener();
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
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
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
    if (!existsSync(this.configFile)) {
      console.warn('Config file is not exists run', `"${PACKAGE_NAME} init" first`);
      process.exit(2);
    }
    const data = readFileSync(this.configFile).toString();
    const config = yaml.parse(data);
    const { exclude } = config;

    const pack = await getPackage();
    console.info(`Starting deploy "${pack.name}" project`);
    const fileTar = getTmpArchive(pack.name);
    const tar = new Tar();
    await tar.create({
      fileList: readdirSync(CWD)
        .filter((item) => exclude.indexOf(item) === -1)
        .filter((item) => EXPLICIT_EXCLUDE.indexOf(item) === -1),
      file: fileTar,
    });
    const stats = statSync(fileTar);
    const { size } = stats;
    let curSize = 0;

    const rStream = createReadStream(fileTar);
    let num = 0;
    rStream.on('data', (chunk) => {
      /** @type {typeof this.sendMessage<WSMessageDataCli['deploy']>} */ (this.sendMessage)({
        token: this.token,
        message: '',
        type: 'deploy',
        userId: this.userId,
        data: {
          num,
          project: pack.name,
          last: false,
          chunk: new Uint8Array(Buffer.from(chunk)),
          config: null,
        },
        lang: LANG,
        status: 'info',
      });
      num++;
      curSize += chunk.length;
      stdoutWriteStart(
        `Uploading the project to the cloud: ${this.calculatePercents(size, curSize)}%`
      );
    });
    rStream.on('close', () => {
      /** @type {typeof this.sendMessage<WSMessageDataCli['deploy']>} */ (this.sendMessage)({
        token: this.token,
        message: '',
        type: 'deploy',
        userId: this.userId,
        data: {
          num,
          project: pack.name,
          last: true,
          chunk: new Uint8Array(),
          config,
        },
        lang: LANG,
        status: 'info',
      });
      stdoutWriteStart('');
      const percent = this.calculatePercents(size, curSize);
      console.info(`Project files uploaded to the cloud: ${percent}%`);
    });
  }
}
