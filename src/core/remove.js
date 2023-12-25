import WS from '../tools/ws.js';
import { getConfigFilePath } from '../utils/lib.js';
import { existsSync, readFileSync } from 'fs';
import { PACKAGE_NAME } from '../utils/constants.js';
import { parseMessageCli } from '../types/interfaces.js';
import Yaml from '../utils/yaml.js';

const yaml = new Yaml();

/**
 * @typedef {import('../tools/ws.js').Options} Options
 * @typedef {import('../tools/ws.js').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 */

export default class Remove extends WS {
  /**
   * @param {Options} options
   */
  constructor(options) {
    super(options);
    /**
     * @type {string}
     */
    this.configFile = getConfigFilePath();
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
   * @type {WS['handler']}
   */
  async handler() {
    if (!existsSync(this.configFile)) {
      console.warn('Config file is not exists run', `"${PACKAGE_NAME} init" first`);
      process.exit(2);
    }
    const data = readFileSync(this.configFile).toString();
    const config = yaml.parse(data);

    console.info(`Starting remove "${config.project}" project`);
    /** @type {typeof this.sendMessage<'remove'>} */ (this.sendMessage)({
      token: this.token,
      message: '',
      type: 'remove',
      packageName: PACKAGE_NAME,
      userId: this.userId,
      data: {
        project: config.project,
      },
      status: 'info',
    });
  }
}
