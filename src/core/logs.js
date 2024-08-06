import Console from 'console';
import WS from '../connectors/ws.js';
import { HEADER_CONN_ID, parseMessageCli, UPLOAD_REQUEST_TIMEOUT } from '../types/interfaces.js';
import { PACKAGE_NAME } from '../utils/constants.js';
import { console } from '../utils/lib.js';
import Inquirer from '../utils/inquirer.js';

/**
 * @typedef {import("../connectors/ws.js").Options} Options
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('../types/interfaces.js').Status} Status
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
        case 'getLogsCli':
          await this.getLogs(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
  }

  /**
   * @private
   * @param {WSMessageCli<'getLogsCli'>} msg
   */
  async getLogs({ data, connId }) {
    const { url, serviceName } = data;
    const res = await this.readLogsRequest({ url, service: serviceName, connId }, data);
    console.info('End read logs', serviceName);
    process.exit(res.code);
  }

  /**
   * @private
   * @param {WSMessageCli<'logs'>} msg
   */
  async handleLogs({ data: { text, last, num }, status }) {
    await this.waitQueue(num);
    this.num++;
    // Console[status](chalk.whiteBright(text));
    if (last) {
      // process.exit(0);
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

    const { name } = config;
    this.sendMessage({
      token: this.token,
      type: 'getLogsServer',
      message: '',
      packageName: PACKAGE_NAME,
      data: {
        watch: this.options.follow || false,
        timestamps: this.options.timestamps || false,
        serviceName: this.serviceName,
        project: name,
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

  /**
   * @private
   * @param {{
   *  url: string;
   *  service: string;
   *  connId: string;
   * }} param0
   * @param {WSMessageCli<'getLogsCli'>['data']} data
   * @returns {Promise<{
   *  status: Status
   *  message: string;
   *  code: number | undefined;
   * }>}
   */
  async readLogsRequest({ url, service, connId }, data) {
    console.info(`Request of logs "${service}"`, { url });

    let percent = 0;
    let percentUpload = 0;

    const fn = await this.setRequest(url);

    return new Promise((resolve) => {
      const req = fn(
        url,
        {
          method: 'POST',
          headers: {
            'Transfer-Encoding': 'chunked',
            'content-type': 'application/octet-stream',
            'user-agent': `client ${this.package.version}`,
            host: url.replace(/https?:\/\//, '').replace(/\/.+$/, ''),
            [HEADER_CONN_ID]: connId,
          },
          timeout: UPLOAD_REQUEST_TIMEOUT,
        },
        (res) => {
          let message = '';

          res.on('data', (msg) => {
            Console.log(msg.toString());
          });

          res.on('error', (err) => {
            console.error('Failed to read logs', err);
            resolve({
              status: 'error',
              code: res.statusCode,
              message: err.message,
            });
          });

          res.on('end', () => {
            resolve({
              status: 'info',
              code: res.statusCode,
              message,
            });
          });
        }
      );

      req.on('error', (error) => {
        console.error('Request failed', { error, url, percent, percentUpload });
        process.exit(1);
      });

      req.on('timeout', () => {
        console.error('Request timeout exceeded', { url });
        process.exit(1);
      });

      req.on('close', () => {
        req.destroy();
      });

      req.write(JSON.stringify(data));
      req.write('0');
    });
  }
}
