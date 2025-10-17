/******************************************************************************************
 * Repository: Conhos cli
 * File name: logs.js
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Sun Sep 01 2024 13:12:51 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import WS from '../connectors/ws.js';
import { HEADER_CONN_ID, LOGS_REQUEST_TIMEOUT } from 'conhos-vscode/dist/constants.js';
import { PACKAGE_NAME } from '../utils/constants.js';
import { parseMessageCli } from '../utils/lib.js';
import Inquirer from '../utils/inquirer.js';
import { CLI_COMMANDS } from '../types/interfaces.js';

/**
 * @typedef {import('../connectors/ws.js').WSProps} WSProps
 * @typedef {import('../types/interfaces.js').Options} Options
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('conhos-vscode').Status} Status
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
   * @param {WSProps} props
   * @param {string} serviceName
   */
  constructor(options, props, serviceName) {
    super(options, CLI_COMMANDS.logs, props);
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
    this.console.info('End read logs', serviceName);
    return this.exit(res.code);
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
      // process. return this.exit(0);
    }
  }

  /**
   * @private
   * @param {number} num
   */
  async waitQueue(num) {
    await new Promise((resolve) => {
      const interval = setInterval(() => {
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
    let project = this.options.project || 'no-project';
    if (this.config && !this.options.project) {
      project = this.config.name;
    }

    if (this.options.clear) {
      this.console.warn('While logs are cleaning the service will be restart!');
      const clearLogs = await inquirer.confirm(
        `Do you want to clear all logs for the service ${this.serviceName}?`,
        false
      );
      if (!clearLogs) {
        this.console.warn('Clear logs is skipped');
        this.options.clear = false;
      }
    }

    this.sendMessage({
      token: this.token,
      type: 'getLogsServer',
      message: '',
      packageName: PACKAGE_NAME,
      data: {
        watch: this.options.follow || false,
        timestamps: this.options.timestamps || false,
        serviceName: this.serviceName,
        project,
        since: this.options.since,
        until: this.options.until,
        tail: this.options.tail,
        clear: this.options.clear || false,
        config: this.config,
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
    this.console.log(`Request of logs "${service}"`, { url });

    const percent = 0;
    const percentUpload = 0;

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
          timeout: LOGS_REQUEST_TIMEOUT,
        },
        (res) => {
          const message = '';

          res.on('data', (msg) => {
            this.console.Log(msg.toString());
          });

          res.on('error', (err) => {
            this.console.error('Failed to read logs', err.message);
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
        this.console.error('Request failed', { error, url, percent, percentUpload });
        return this.exit(1);
      });

      req.on('timeout', () => {
        this.console.error('Request timeout exceeded', { url });
        return this.exit(1);
      });

      req.on('close', () => {
        req.destroy();
      });

      req.write(JSON.stringify(data));
      req.write('0');
    });
  }
}
