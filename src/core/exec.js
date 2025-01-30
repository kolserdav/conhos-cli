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
import WebSocket from 'ws';
import readline from 'readline';
import WS from '../connectors/ws.js';
import { EXEC_CONNECT_URL_MESSAGE } from '../types/interfaces.js';
import { PACKAGE_NAME } from '../utils/constants.js';
import { as, console, parseMessageCli, stdoutWriteStart } from '../utils/lib.js';
import Inquirer from '../utils/inquirer.js';
import Console from 'console';

/**
 * @typedef {import("../connectors/ws.js").Options} Options
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('conhos-vscode').Status} Status
 */

/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {import('../types/interfaces.js').WSMessageCli<T>} WSMessageCli<T>
 */

const inquirer = new Inquirer();

export default class Exec extends WS {
  /**
   * @private
   * @type {string}
   */
  serviceName;

  /**
   * @private
   * @type {string[]}
   */
  history = [];

  /**
   * @private
   */
  historyIndex = 0;

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
        case 'execCli':
          await this.execCli(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
  }

  /**
   * @private
   */
  showStartLine() {
    stdoutWriteStart(`${this.serviceName}# `);
  }

  /**
   * @private
   * @param {WSMessageCli<'execCli'>} msg
   */
  async execCli({ data: { url } }) {
    console.info(EXEC_CONNECT_URL_MESSAGE, url);
    const socket = new WebSocket(url, ['test']);

    socket.on('close', () => {
      console.warn('Connection aborting', 'Try again later');
      process.exit(1);
    });

    socket.on('message', (d) => {
      const str = d.toString();
      if (str) {
        stdoutWriteStart('');
        Console.log(str.replace(/\n$/, ''));
      }
      this.showStartLine();
    });

    this.showStartLine();

    const rl = readline.createInterface({
      // @ts-ignore
      input: process.stdin,
      output: this.options.interractive ? process.stdout : undefined,
      terminal: true,
    });

    rl.on('line', (input) => {
      this.history.push();
      socket.send(input);
    });

    rl.on('close', () => {
      stdoutWriteStart('');
      console.info('Terminal exited', this.serviceName);
      process.exit(0);
    });

    /**
     * @type {NodeJS.ReadStream}
     */
    const readStream = as(rl).input;
    readStream.on('data', (key) => {
      const enter = key[0] === 10 || key[0] === 13;
      if (enter) {
        this.showStartLine();
      }
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

    this.sendMessage({
      token: this.token,
      type: 'execServer',
      message: '',
      packageName: PACKAGE_NAME,
      data: {
        service: this.serviceName,
        project,
        repl: this.options.repl || 1,
      },
      connId: this.connId,
      status: 'info',
      userId: this.userId,
    });
  }
}
