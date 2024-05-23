import Console from 'console';
import WS from '../connectors/ws.js';
import { parseMessageCli } from '../types/interfaces.js';
import { PACKAGE_NAME } from '../utils/constants.js';
import { console } from '../utils/lib.js';
import chalk from 'chalk';
import Inquirer from '../utils/inquirer.js';

/**
 * @typedef {import("../connectors/ws.js").Options} Options
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 */

/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {import('../types/interfaces.js').WSMessageCli<T>} WSMessageCli<T>
 */

const inquirer = new Inquirer();

export default class Logs extends WS {
  num = 0;
  /**
   * @private
   * @type {string}
   */
  serviceName;
  /**
   * @public
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
      /**
       * @type {keyof WSMessageDataCli}
       */
      const _type = type;
      switch (_type) {
        case 'logs':
          await this.handleLogs(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
  }

  /**
   * @private
   * @param {WSMessageCli<'logs'>} msg
   */
  async handleLogs({ data: { text, last, num }, status }) {
    await this.waitQueue(num);
    this.num++;
    Console[status](chalk.whiteBright(text));
    if (last) {
      process.exit(0);
    }
  }

  /**
   * @private
   * @param {number} num
   */
  async waitQueue(num) {
    await new Promise((resolve) => {
      let interval = setInterval(() => {
        if (num === this.num) {
          clearInterval(interval);
          resolve(0);
        }
      }, 0);
    });
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

    if (this.options.clear) {
      console.warn('While logs are cleaning the service will be restart!');
      const clearLogs = await inquirer.confirm(
        `Do you want to clear all logs for the service ${this.serviceName}?`,
        false
      );
      if (!clearLogs) {
        console.warn('Clear logs is skipped');
        this.options.clear = false;
      }
    }

    const { project } = config;
    /** @type {typeof this.sendMessage<'getLogs'>} */ (this.sendMessage)({
      token: this.token,
      type: 'getLogs',
      message: '',
      packageName: PACKAGE_NAME,
      data: {
        watch: this.options.watch || false,
        timestamps: this.options.timestamps || false,
        serviceName: this.serviceName,
        project,
        since: this.options.since,
        until: this.options.until,
        tail: this.options.tail,
        clear: this.options.clear || false,
        config,
      },
      connId: this.connId,
      status: 'info',
      userId: this.userId,
    });
  }
}
