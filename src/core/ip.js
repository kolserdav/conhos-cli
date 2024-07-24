import WS from '../connectors/ws.js';
import { parseMessageCli } from '../types/interfaces.js';
import { PACKAGE_NAME } from '../utils/constants.js';
import { console } from '../utils/lib.js';
/**
 * @typedef {import("../connectors/ws.js").Options} Options
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 */

/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {import('../types/interfaces.js').WSMessageCli<T>} WSMessageCli<T>
 */

export default class IP extends WS {
  num = 0;

  /**
   * @public
   * @param {Options} options
   */
  constructor(options) {
    super(options);
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
      /**
       * @type {keyof WSMessageDataCli}
       */
      const _type = type;
      switch (_type) {
        case 'ipCli':
          await this.handleIP(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
  }

  /**
   * @private
   * @param {WSMessageCli<'ipCli'>} msg
   */
  async handleIP({ data }) {
    console.info('Project node id received:', data.ip);
    process.exit(0);
  }

  /**
   * @public
   * @type {WS['handler']}
   */
  async handler() {
    const config = this.getConfig();
    if (!config) {
      return;
    }

    const { name } = config;
    this.sendMessage({
      token: this.token,
      type: 'ipServer',
      message: '',
      packageName: PACKAGE_NAME,
      data: {
        project: name,
      },
      connId: this.connId,
      status: 'info',
      userId: this.userId,
    });
  }
}
