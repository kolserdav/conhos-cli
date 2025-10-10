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
import Inquirer from '../utils/inquirer.js';
import { parseMessageCli } from '../utils/lib.js';

const inquirer = new Inquirer();

/**
 * @typedef {import('../types/interfaces.js').Options} Options
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 */

/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {import('../types/interfaces.js').WSMessageCli<T>} WSMessageCli<T>
 */

export default class Project extends WS {
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
        case 'projectDeleteProgressCli':
          await this.progress(rawMessage);
          break;
        case 'projectDeleteAcceptCli':
          await this.acceptDelete(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
  }

  /**
   * @private
   * @param {WSMessageCli<'projectDeleteProgressCli'>} msg
   */
  async progress({ status, message, data }) {
    this.console[status](message.replace(/^\w+: /, '').replace(/\n$/, ''), data.msg);
  }

  /**
   * @private
   * @param {WSMessageCli<'projectDeleteAcceptCli'>} msg
   */
  async acceptDelete({ message, data: { name } }) {
    const value = await inquirer.confirm(message, false);
    this.sendMessage({
      token: this.token,
      type: 'projectDeleteAcceptServer',
      message: '',
      packageName: PACKAGE_NAME,
      data: {
        name,
        value,
      },
      connId: this.connId,
      status: 'info',
      userId: this.userId,
    });
  }

  /**
   * @public
   * @type {WS['handler']}
   */
  async handler() {
    let name = this.options.project || 'no-project';
    if (this.config && !this.options.project) {
      name = this.config.name;
    }

    if (this.options.delete) {
      this.sendMessage({
        token: this.token,
        type: 'projectDeleteServer',
        message: '',
        packageName: PACKAGE_NAME,
        data: {
          name,
          interractive: this.options.interractive || false,
        },
        connId: this.connId,
        status: 'info',
        userId: this.userId,
      });
      return;
    }

    this.console.warn('No command', '');
    this.exit(undefined);
    return;
  }
}
