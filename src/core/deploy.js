const { v4 } = require('uuid');
const WS = require('../tools/ws');
const Tar = require('../utils/tar');
const { getPackage, getTmpArchive, stdoutWriteStart, getConfigFilePath } = require('../utils/lib');
const { createReadStream, statSync, existsSync, readFileSync, readdirSync } = require('fs');
const {
  LANG,
  PACKAGE_NAME,
  CWD,
  CONFIG_EXCLUDE_DEFAULT,
  EXPLICIT_EXCLUDE,
} = require('../utils/constants');
const { parseMessageCli } = require('../types/interfaces');
const Yaml = require('../utils/yaml');

const yaml = new Yaml();

/**
 * @typedef {import('../tools/ws').Options} Options
 * @typedef {import('../tools/ws').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces').WSMessageDataCli} WSMessageDataCli
 */

module.exports = class Login extends WS {
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

    const connId = v4();

    const ws = this;
    this.conn.on('message', async (d) => {
      const rawMessage = /** @type {typeof parseMessageCli<any>} */ (parseMessageCli)(d.toString());
      if (rawMessage === null) {
        return;
      }
      const { type } = rawMessage;
      switch (type) {
        default:
          await this.handleCommonMessages(connId, rawMessage);
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
  async handler({ connId }) {
    if (!existsSync(this.configFile)) {
      console.warn('Config file is not exists run', `"${PACKAGE_NAME} init" first`);
      process.exit(2);
    }
    const data = readFileSync(this.configFile).toString();
    const config = yaml.parse(data);
    const { exclude } = config;

    const pack = getPackage();
    console.info(`Starting deploy "${pack.name}" project`);
    const fileTar = getTmpArchive();
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
};
