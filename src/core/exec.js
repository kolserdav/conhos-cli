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
import { as, parseMessageCli, stdoutWriteStart } from '../utils/lib.js';
import Inquirer from '../utils/inquirer.js';
import { isLastStreamMessage } from 'conhos-vscode/dist/lib.js';
import { Readable, Writable } from 'stream';

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
   * @param {WSProps} props
   * @param {string} serviceName
   */
  constructor(options, props, serviceName) {
    super(options, props);
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
    this.console.info(EXEC_CONNECT_URL_MESSAGE, url);
    const socket = new WebSocket(url, ['test']);

    socket.on('close', () => {
      this.console.warn('Connection aborting', 'Try again later');
      return this.exit(1);
    });

    socket.on('message', (d) => {
      const str = d.toString();
      if (str) {
        if (isLastStreamMessage(str) && this.options.interractive) {
          process.stdout.write(str);
          this.showStartLine();
        } else {
          stdoutWriteStart('');
          this.console.Log(str.replace(/\n$/, ''));
        }
      }
    });

    this.showStartLine();

    let input = process.stdin;
    let output = process.stdout;
    let terminal = true;
    if (process.env.IS_SERVER === 'true') {
      terminal = false;
      input = /** @type {any} */ (as)(new Readable({ read() {} }));
      const Console = this.console;
      output = /** @type {any} */ (as)(
        new Writable({
          write(chunk, encoding, callback) {
            Console.log(chunk.toString());
            callback();
          },
        })
      );
    }

    this.rl = readline.createInterface({
      // @ts-ignore
      input,
      output: this.options.interractive ? output : undefined,
      terminal,
    });

    this.rl.on('line', (input) => {
      this.history.push();
      socket.send(input);
    });

    this.rl.on('close', () => {
      stdoutWriteStart('');
      this.console.info('Terminal exited', this.serviceName);
      return this.exit(0);
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
