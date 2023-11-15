import WebSocket from 'ws';
import { LANG, WEBSOCKET_ADDRESS, SESSION_FILE_NAME, PACKAGE_NAME } from '../utils/constants.js';
import { getPackagePath, console } from '../utils/lib.js';
import Crypto from '../utils/crypto.js';
import { readFileSync, existsSync } from 'fs';
import Inquirer from '../utils/inquirer.js';
import { PROTOCOL_CLI } from '../types/interfaces.js';
import { v4 } from 'uuid';

const crypto = new Crypto();

/**
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 */
/**
 * @template T
 * @typedef {import('../types/interfaces.js').WSMessageCli<T>} WSMessageCli<T>
 */

/**
 * @typedef {'login' | 'deploy'} Protocol
 */

/**
 * @typedef {{
 *  iv: string;
 *  content: string;
 * }} Session
 */

/**
 * @typedef {{
 *  crypt: boolean;
 *  remove: boolean;
 *  yes: boolean;
 *  isLogin?: boolean;
 * }} Options
 */

/**
 * @typedef {{
 *  failedLogin: boolean
 *  sessionExists?: boolean
 * }} CommandOptions
 */

const inquirer = new Inquirer();

/**
 * @abstract
 * @constructor
 */
class WSInterface {
  /**
   * @abstract
   */
  listener() {
    console.warn('Listener must be impelemented');
  }

  /**
   * @param {CommandOptions} options
   */
  handler(options) {
    console.warn('Handler must be impelemented');
  }
}

/**
 * @class
 * @implements WSInterface
 */
export default class WS {
  /**
   * @param {Options} options
   */
  constructor(options) {
    /**
     * @type {string}
     */
    this.userId = '';
    /**
     * @type {string}
     */
    this.connId = v4();
    /**
     * @type {WebSocket | null}
     */
    this.conn = new WebSocket(WEBSOCKET_ADDRESS, PROTOCOL_CLI);
    /**
     * @type {Options}
     */
    this.options = options;
    /**
     * @type {string | null}
     */
    this.token = null;
    this.start();
  }

  /**
   * @type {WSInterface['listener']}
   */
  listener() {
    console.warn('Default WS listener');
  }

  /**
   * @type {WSInterface['handler']}
   */
  handler(options) {
    console.warn('Default WS handler', options);
  }

  /**
   * @template T
   * @param {WSMessageCli<T>} data
   * @returns
   */
  sendMessage(data) {
    if (!this.conn) {
      console.warn('Missing connection in send message');
      return;
    }
    console.log('Send message', data);
    this.conn.send(JSON.stringify(data));
  }

  start() {
    if (!this.conn) {
      console.warn('WebSocket is missing');
      return;
    }
    this.conn.on('error', (error) => {
      console.error('Failed WS connection', { error, WEBSOCKET_ADDRESS });
    });
    const ws = this;
    this.conn.on('open', function open() {
      console.log('Open WS connection:', WEBSOCKET_ADDRESS);
      /** @type {typeof ws.sendMessage<WSMessageDataCli['setSocket']>} */ (ws.sendMessage)({
        status: 'info',
        type: 'setSocket',
        message: '',
        lang: LANG,
        data: '',
        token: null,
        userId: ws.userId,
      });
    });
  }

  /**
   *
   * @param {WSMessageCli<WSMessageDataCli['checkToken']>} param0
   * @returns
   */
  async listenCheckToken({ data, token, type, userId }) {
    if ((!data && type !== 'login') || !token) {
      console.warn(`Session is not allowed. First run "${PACKAGE_NAME}" login`);
      process.exit(2);
    }

    this.setToken(token);
    this.setUserId(userId);

    this.handler({
      failedLogin: !data,
      sessionExists: true,
    });
  }

  /**
   *
   * @returns {Session | null}
   */
  readSessionFile() {
    const sessionFilePath = getPackagePath(SESSION_FILE_NAME);
    if (!existsSync(sessionFilePath)) {
      return null;
    }
    const authStr = readFileSync(sessionFilePath).toString();
    return JSON.parse(authStr);
  }

  /**
   *
   */
  async listenTest() {
    const authData = this.readSessionFile();
    if (authData) {
      if (authData.iv !== '') {
        console.info('Session token was encrypted');

        const password = await inquirer.promptPassword('Enter password');
        const key = crypto.createHash(password);
        const token = crypto.decrypt(authData, key);

        if (token === null) {
          console.warn("Password is wrong, current session can't be use");
          this.handler({ failedLogin: true });
          return;
        }

        /** @type {typeof this.sendMessage<WSMessageDataCli['checkToken']>} */ (this.sendMessage)({
          token,
          type: 'checkToken',
          data: false,
          lang: LANG,
          message: '',
          status: 'info',
          userId: this.userId,
        });
      } else {
        console.info("Now it's using the saved session token");
        /** @type {typeof this.sendMessage<WSMessageDataCli['checkToken']>} */ (this.sendMessage)({
          token: authData.content,
          type: 'checkToken',
          data: false,
          lang: LANG,
          message: '',
          status: 'info',
          userId: this.userId,
        });
      }
    } else if (!this.options.isLogin) {
      console.warn(`You are not authenticated, run "${PACKAGE_NAME} login" first`);
      process.exit(1);
    } else {
      this.handler({ failedLogin: false, sessionExists: false });
    }
  }

  /**
   *
   * @param {WSMessageCli<WSMessageDataCli['any']>} msg
   */
  async handleCommonMessages(msg) {
    const { type, status, message, data } = msg;
    switch (type) {
      case 'test':
        await this.listenTest();
        break;
      case 'checkToken':
        await this.listenCheckToken(msg);
        break;
      case 'message':
        console[status](`<cloud> ${message}`);
        if (status === 'error' || data) {
          process.exit(!data ? 1 : 0);
        }
        break;
      default:
        console.warn('Default message case of login command', message);
    }
  }

  /**
   * @param {string} userId
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * @param {string} token
   */
  setToken(token) {
    this.token = token;
  }
}
