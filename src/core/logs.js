import WS from '../tools/ws.js';
import { parseMessageCli } from '../types/interfaces.js';
import { LANG } from '../utils/constants.js';
import { getPackage } from '../utils/lib.js';

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
  handleLogs({ data: { text, last }, status }) {
    console[status](text);
    if (last) {
      process.exit(0);
    }
  }

  /**
   * @type {WS['handler']}
   */
  async handler() {
    console.info(
      `Starting show logs of service "${this.serviceName}"`,
      this.options.watch ? 'in watching mode' : '',
      '...'
    );
    const pack = await getPackage();
    /** @type {typeof this.sendMessage<'getLogs'>} */ (this.sendMessage)({
      token: this.token,
      type: 'getLogs',
      message: '',
      data: {
        watch: this.options.watch || false,
        serviceName: this.serviceName,
        project: pack.name,
      },
      lang: LANG,
      status: 'info',
      userId: this.userId,
    });
  }
}
