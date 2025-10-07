import WS from '../connectors/ws.js';
import { PACKAGE_NAME } from '../utils/constants.js';
import { console, parseMessageCli, stdoutWriteStart } from '../utils/lib.js';

/**
 * @typedef {import('../types/interfaces.js').Options} Options
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 */

/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {import('../types/interfaces.js').WSMessageCli<T>} WSMessageCli<T>
 */

export default class Service extends WS {
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
        case 'serviceRestartProgressCli':
          this.progress(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
  }

  /**
   * @private
   * @param {WSMessageCli<'serviceRestartProgressCli'>} msg
   */
  async progress({ data: { msg } }) {
    stdoutWriteStart(msg.trim());
  }

  /**
   * @public
   * @type {WS['handler']}
   */
  async handler() {
    let project = this.options.project || 'no-project';
    if (this.config && !this.options.project) {
      project = this.config.name;
    }

    if (this.options.name && this.options.restart) {
      this.console.info(`Try to restart service '${this.options.name}' in project:'`, project);
      this.sendMessage({
        token: this.token,
        type: 'serviceRestartServer',
        message: '',
        packageName: PACKAGE_NAME,
        data: {
          project,
          service: this.options.name,
        },
        connId: this.connId,
        status: 'info',
        userId: this.userId,
      });
      return;
    }

    this.console.warn('No command', '');
    this.exit(undefined);
  }
}
