/******************************************************************************************
 * Repository: Conhos cli
 * File name: ip.js
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Sun Sep 01 2024 13:12:51 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import WS from '../connectors/ws.js';
import { PACKAGE_NAME } from '../utils/constants.js';
import { console, parseMessageCli } from '../utils/lib.js';
/**
 * @typedef {import('../types/interfaces.js').Options} Options
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 */

/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {import('../types/interfaces.js').WSMessageCli<T>} WSMessageCli<T>
 */

export default class IP extends WS {
  num = 0;

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
    this.console.info(
      'Project node id received:',
      data.ip || 'IP is undefined please write to support'
    );
    return this.exit(0);
  }

  /**
   * @public
   * @type {WS['handler']}
   */
  async handler() {
    if (!this.config) {
      return;
    }

    const { name } = this.config;
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
