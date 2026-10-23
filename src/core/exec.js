/******************************************************************************************
 * Repository: Conhos cli
 * File name: exec.js
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Sun Sep 01 2024 13:12:51 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import WebSocket from 'ws';
import readline from 'readline';
import NodePty from 'node-pty';
import WS from '../connectors/ws.js';
import { CLI_COMMANDS, EXEC_CONNECT_URL_MESSAGE } from '../types/interfaces.js';
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

// ttyd protocol constants
/** @type {number} */
const TTYD_CMD_INPUT = '0'.charCodeAt(0);
/** @type {number} */
const TTYD_CMD_RESIZE = '1'.charCodeAt(0);
/** @type {number} */
const TTYD_CMD_OUTPUT = '0'.charCodeAt(0);

/**
 * @param {number} cmd
 * @param {Uint8Array} payload
 * @returns {Uint8Array}
 */
function buildTtydPacket(cmd, payload) {
  /** @type {Uint8Array} */
  const out = new Uint8Array(1 + payload.length);
  out[0] = cmd;
  out.set(payload, 1);
  return out;
}

/**
 * @param {string} data
 * @returns {Uint8Array}
 */
function buildInputPacket(data) {
  return buildTtydPacket(TTYD_CMD_INPUT, new TextEncoder().encode(data));
}

/**
 * @param {number} cols
 * @param {number} rows
 * @returns {Uint8Array}
 */
function buildResizePacket(cols, rows) {
  const json = JSON.stringify({ columns: cols, rows });
  return buildTtydPacket(TTYD_CMD_RESIZE, new TextEncoder().encode(json));
}

/**
 * @param {number} cols
 * @param {number} rows
 * @returns {Uint8Array}
 */
function buildInitPacket(cols, rows) {
  return new TextEncoder().encode(JSON.stringify({ columns: cols, rows }));
}

/**
 * @param {WebSocket} socket
 * @param {Uint8Array} packet
 */
function sendBinary(socket, packet) {
  socket.send(packet.buffer);
}

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
    super(options, CLI_COMMANDS.exec, props);
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

    const ttydAddress = process.env.TTYD_AUTH_ADDRESS || 'wss://ttyd-auth.conhos.ru';
    const ttydWs = new WebSocket(ttydAddress + '/ws');

    let token = this.token || '';
    const serviceId = this.serviceName;
    const projectId = this.options.project || 'no-project';

    /** @type {{ current: import('node-pty').IPty | null }} */
    const terminalRef = { current: null };
    /** @type {{ current: boolean }} */
    const authenticatedRef = { current: false };

    ttydWs.on('open', () => {
      this.console.info('TTYD WebSocket connection opened');
      const authMsg = JSON.stringify({
        token,
        serviceId: '6394de18-91e7-4340-b963-0617dad2ec53', // FIXME
        projectId: '1d2c7812-d6d4-44d1-ad70-6de5ba12f55f', // FIXME
      });
      ttydWs.send(authMsg);
    });

    ttydWs.on('message', (d) => {
      const res = d.toString().trim();
      if (res.startsWith('{') && res.endsWith('}')) {
        let parsed;

        try {
          parsed = JSON.parse(res);
        } catch (e) {
          return;
        }

        if (!parsed || !parsed.status) return;

        if (parsed.status === 'ok') {
          authenticatedRef.current = true;
          this.console.info('TTYD authenticated, sending init packet');

          const term = terminalRef.current;
          if (term) {
            const cols = term.cols ?? 80;
            const rows = term.rows ?? 24;
            const initPacket = buildInitPacket(cols, rows);
            sendBinary(ttydWs, initPacket);

            // Now that we're authenticated, enable terminal input forwarding
            term.onData((data) => {
              const inputPacket = buildInputPacket(data);
              sendBinary(ttydWs, inputPacket);
            });
          }
        } else if (parsed.status === 'error') {
          this.console.error('TTYD auth error', parsed.message || 'auth failed');
          ttydWs.close();
        }
        return;
      }

      if (d instanceof ArrayBuffer) {
        const bytes = new Uint8Array(d);
        if (bytes.length === 0) return;
        const cmd = bytes[0];

        if (cmd === TTYD_CMD_OUTPUT) {
          const text = new TextDecoder().decode(bytes.slice(1));
          const term = terminalRef.current;
          if (term) {
            term.write(text);
          }
        }
      }
    });

    ttydWs.on('close', (code) => {
      this.console.warn('TTYD connection closed', code);
      if (terminalRef.current) {
        terminalRef.current.kill();
      }
    });

    ttydWs.on('error', (e) => {
      this.console.error('TTYD WebSocket error', e.message);
    });

    // Create node-pty terminal
    const termCommand = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
    const term = NodePty.spawn(termCommand, [], {
      name: 'xterm-256color',
      cwd: process.env.HOME || process.env.USERPROFILE || '.',
      env: { ...process.env, TERM: 'xterm-256color' },
    });

    terminalRef.current = term;

    // Handle terminal exit
    term.onExit(() => {
      stdoutWriteStart('');
      this.console.info('Terminal exited', this.serviceName);
      ttydWs.close();
      this.exit(0);
    });

    // Set up stdin for terminal input
    const isInteractive = this.options.interractive && process.stdin.isTTY;

    if (isInteractive) {
      // Enable raw mode for proper terminal input handling
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
      }
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', (data) => {
        term.write(data);
      });

      // Handle terminal resize
      process.stdout.on('resize', () => {
        const cols = process.stdout.columns || 80;
        const rows = process.stdout.rows || 24;
        term.resize(cols, rows);
        const resizePacket = buildResizePacket(cols, rows);
        sendBinary(ttydWs, resizePacket);
      });
    } else {
      // Non-interactive mode (server mode)
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
      });

      this.rl.on('line', (input) => {
        this.history.push();
        term.write(input + '\n');
      });

      this.rl.on('close', () => {
        stdoutWriteStart('');
        this.console.info('Terminal exited', this.serviceName);
        return this.exit(0);
      });
    }

    // Cleanup on exit
    const cleanup = () => {
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      if (this.rl) {
        this.rl.close();
      }
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
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
