// @ts-check
const WebSocket = require('ws');
const { LANG, WEBSOCKET_ADDRESS, SESSION_FILE_NAME, PACKAGE_NAME } = require('../utils/constants');
const { getPackagePath, console } = require('../utils/lib');
const Crypto = require('../utils/crypto');
const { readFileSync, existsSync } = require('fs');
const Inquirer = require('../utils/inquirer');
const { v4 } = require('uuid');

const crypto = new Crypto();

/**
 * @typedef {'login' | 'deploy'} Protocol
 */

/**
 * @typedef {'info' | 'warn' | 'error'} Status
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
 *  isLogin?: boolean;
 * }} Options
 */

/**
 * @typedef {{
 *  connId: string;
 *  failedLogin: boolean
 *  sessionExists?: boolean
 * }} CommandOptions
 */

/**
 * @typedef {'node'} ServiceType
 */

/**
 * @template T
 * @typedef {{
 *  status: Status;
 *  type: 'login' | 'setSocket' | 'test' | 'checkToken' |
 *  'upload' | 'deployData' | 'getDeployData';
 *  message: string;
 *  lang: 'en';
 *  data: T;
 *  token: string | null;
 * }} WsMessage
 */

/**
 * @typedef {object} MessageData
 * @property {any} any
 * @property {string} setSocket
 * @property {string} test
 * @property {string} login
 * @property {boolean} checkTocken
 * @property {{
 *  num: number;
 *  project: string;
 *  last: boolean;
 *  chunk: Uint8Array
 *  options: {
 *    serviceType: string;
 *    serviceSize: string
 *  }
 * }} upload
 * @property {null} getDeployData
 * @property {{
 *  services: {
 *    value: string;
 *    name: string;
 *    versions: string[];
 * }[];
 *  sizes: {
 *    name: string;
 *    memory: {
 *     name: string;
 *      value: number;
 *    };
 *    cpus: string;
 *  };
 * }} deployData
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
module.exports = class WS {
  /**
   * @param {Options} options
   */
  constructor(options) {
    /**
     * @type {WebSocket | null}
     */
    this.conn = new WebSocket(WEBSOCKET_ADDRESS, 'cli');
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
   * @param {WsMessage<T>} data
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

  /**
   * @template T
   * @param {string} msg
   * @returns {WsMessage<T> | null}
   */
  parseMessage(msg) {
    let data = null;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.error('Failed parse message', e);
    }
    if (data) {
      console.log('Parse message', data);
    }
    return data;
  }

  start() {
    if (!this.conn) {
      console.warn('WebSocket is missing');
      return;
    }
    this.conn.on('error', (e) => {
      console.error('Failed WS connection', e);
    });
    const ws = this;
    this.conn.on('open', function open() {
      console.log('Open WS connection:', WEBSOCKET_ADDRESS);
      /** @type {typeof ws.sendMessage<MessageData['setSocket']>} */ (ws.sendMessage)({
        status: 'info',
        type: 'setSocket',
        message: '',
        lang: LANG,
        data: '',
        token: null,
      });
    });
  }

  /**
   *
   * @param {WsMessage<MessageData['checkTocken']>} param0
   * @param {string} connId
   * @returns
   */
  async listenCheckToken({ data, token }, connId) {
    this.token = token;
    this.handler({ failedLogin: !data, sessionExists: true, connId });
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
   * @param {string} connId
   */
  async listenTest(connId) {
    const authData = this.readSessionFile();
    if (authData) {
      if (authData.iv !== '') {
        console.info('Session token was encrypted');

        const password = await inquirer.promptPassword('Enter password');
        const key = crypto.createHash(password);
        const token = crypto.decrypt(authData, key);

        if (token === null) {
          console.warn("Password is wrong, current session can't be use");
          this.handler({ failedLogin: true, connId });
          return;
        }

        /** @type {typeof this.sendMessage<MessageData['checkTocken']>} */ (this.sendMessage)({
          token,
          type: 'checkToken',
          data: false,
          lang: LANG,
          message: '',
          status: 'info',
        });
      } else {
        console.info("Now it's using the saved session token");
        /** @type {typeof this.sendMessage<MessageData['checkTocken']>} */ (this.sendMessage)({
          token: authData.content,
          type: 'checkToken',
          data: false,
          lang: LANG,
          message: '',
          status: 'info',
        });
      }
    } else if (!this.options.isLogin) {
      console.warn(`You are not authenticated, run "${PACKAGE_NAME} login" first`);
      process.exit(1);
    } else {
      this.handler({ failedLogin: false, sessionExists: false, connId });
    }
  }

  /**
   *
   * @param {string} connId
   * @param {WsMessage<MessageData['any']>} message
   */
  async handleCommonMessages(connId, message) {
    const { type } = message;
    switch (type) {
      case 'test':
        await this.listenTest(connId);
        break;
      case 'checkToken':
        await this.listenCheckToken(message, connId);
        break;
      default:
        console.warn('Default message case of login command', message);
    }
  }
};
