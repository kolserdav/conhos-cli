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
import pkg from '@xterm/headless';
import WS from '../connectors/ws.js';
import { CLI_COMMANDS, EXEC_CONNECT_URL_MESSAGE } from '../types/interfaces.js';
import { PACKAGE_NAME } from '../utils/constants.js';
import { as, parseMessageCli, stdoutWriteStart } from '../utils/lib.js';

const { Terminal } = pkg;

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

// ttyd protocol constants
/** @type {number} */
const TTYD_CMD_INPUT = '0'.charCodeAt(0);

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
   * @param {WSMessageCli<'execCli'>} msg
   */
  async execCli({ data: { url } }) {
    this.console.info(EXEC_CONNECT_URL_MESSAGE, url);

    const ttydAddress = process.env.TTYD_AUTH_ADDRESS || 'wss://ttyd-auth.conhos.ru';
    const ttydWs = new WebSocket(ttydAddress + '/ws');
    ttydWs.binaryType = 'nodebuffer';

    const token = this.token || '';

    const headlessTerm = new Terminal({
      cols: process.stdout.columns || 80,
      rows: process.stdout.rows || 24,
      scrollback: 1000,
      allowProposedApi: true,
    });

    /**
     * @type {((...args: any[]) => void) | null}
     */
    let stdinDataHandler = null;
    /**
     * @type {((...args: any[]) => void) | null}
     */
    let stdoutResizeHandler = null;
    let rawModeEnabled = false;
    let exited = false;

    const cleanup = () => {
      if (rawModeEnabled && process.stdin.isTTY && process.stdin.setRawMode) {
        try {
          process.stdin.setRawMode(false);
        } catch {
          /* ignore */
        }
        rawModeEnabled = false;
      }
      try {
        process.stdin.pause();
      } catch {
        /* ignore */
      }
      if (stdinDataHandler) {
        process.stdin.off('data', stdinDataHandler);
        stdinDataHandler = null;
      }
      if (stdoutResizeHandler) {
        process.stdout.off('resize', stdoutResizeHandler);
        stdoutResizeHandler = null;
      }
      try {
        headlessTerm.dispose();
      } catch {
        /* ignore */
      }
    };

    const doExit = (code = 0) => {
      if (exited) return;
      exited = true;
      cleanup();
      stdoutWriteStart('');
      this.console.info('Terminal exited', this.serviceName);
      this.exit(code);
    };

    ttydWs.on('open', () => {
      this.console.info('TTYD WebSocket connection opened', '');
      try {
        ttydWs.send(
          JSON.stringify({
            token,
            serviceId: '6394de18-91e7-4340-b963-0617dad2ec53', // do not FIXME !!! it's needed for tests
            projectId: '1d2c7812-d6d4-44d1-ad70-6de5ba12f55f', // do not FIXME !!! it's needed for tests
          })
        );
      } catch (e) {
        this.console.error('Failed to send auth', String(e));
      }
    });
    ttydWs.on('message', (d) => {
      const buf = Buffer.isBuffer(d) ? d : Buffer.from(as(d));
      if (buf.length === 0) return;

      // Auth JSON начинается с '{' (0x7b)
      if (buf[0] === 0x7b) {
        const text = buf.toString('utf8');
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          return;
        }
        if (!parsed || !parsed.status) return;

        if (parsed.status === 'ok') {
          const cols = process.stdout.columns || 80;
          const rows = process.stdout.rows || 24;
          sendBinary(ttydWs, buildInitPacket(cols, rows));

          if (process.stdin.isTTY && process.stdin.setRawMode) {
            process.stdin.setRawMode(true);
          }
          process.stdin.resume();
          process.stdin.setEncoding('utf8');

          process.stdin.on('data', (data) => {
            sendBinary(ttydWs, buildInputPacket(as(data)));
          });
        }
        return;
      }

      if (buf[0] === 0x30) {
        process.stdout.write(buf.slice(1).toString('utf8'));
        return;
      }
    });

    ttydWs.on('close', (code) => {
      this.console.warn('TTYD connection closed', code);
      doExit(0);
    });

    ttydWs.on('error', (e) => {
      this.console.error('TTYD WebSocket error', e.message);
    });

    const onSignal = () => {
      try {
        ttydWs.close();
      } catch {
        /* ignore */
      }
      doExit(0);
    };
    process.once('SIGINT', onSignal);
    process.once('SIGTERM', onSignal);
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
