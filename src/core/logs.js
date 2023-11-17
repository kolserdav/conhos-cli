import WS from '../tools/ws.js';
import { parseMessageCli } from '../types/interfaces.js';
import { LANG } from '../utils/constants.js';

/**
 * @typedef {import("../tools/ws.js").Options} Options
 */

/**
 * @template {keyof import('../types/interfaces.js').WSMessageDataCli} T
 * @typedef {import('../types/interfaces.js').WSMessageCli<T>} WSMessageCli<T>
 */

export default class Logs extends WS {
  /**
   * @type {string}
   */
  serviceName;
  /**
   * @param {Options} options
   * @param {string} serviceName
   */
  constructor(options, serviceName) {
    super(options);
    this.serviceName = serviceName;
  }

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
        case 'logs':
          await this.handleLogs(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
  }

  /**
   *
   * @param {WSMessageCli<'logs'>} msg
   */
  handleLogs({ data }) {
    if (!this.options.watch) {
      console.info(data);
      process.exit(0);
    }
    console.info(data);
  }

  /**
   * @type {WS['handler']}
   */
  async handler() {
    console.info('Starting show logs', this.options.watch ? 'in watching mode' : '', '...');
    /** @type {typeof this.sendMessage<'getLogs'>} */ (this.sendMessage)({
      token: this.token,
      type: 'getLogs',
      message: '',
      data: null,
      lang: LANG,
      status: 'info',
      userId: this.userId,
    });
  }
}
