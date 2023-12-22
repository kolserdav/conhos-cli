import WebSocket from 'ws';
import { LANG, WEBSOCKET_ADDRESS, SESSION_FILE_NAME, PACKAGE_NAME } from '../utils/constants.js';
import { getPackagePath, console, getConfigFilePath } from '../utils/lib.js';
import Crypto from '../utils/crypto.js';
import { readFileSync, existsSync } from 'fs';
import Inquirer from '../utils/inquirer.js';
import { PROTOCOL_CLI } from '../types/interfaces.js';
import { v4 } from 'uuid';
import Yaml from '../utils/yaml.js';

const crypto = new Crypto();
const yaml = new Yaml();

/**
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('../types/interfaces.js').ConfigFile} ConfigFile
 */
/**
 * @template {keyof WSMessageDataCli} T
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
 *  crypt?: boolean;
 *  remove?: boolean;
 *  yes?: boolean;
 *  watch?: boolean;
 *  isLogin?: boolean;
 *  timestamps?: boolean;
 *  since?: string;
 *  until?: string;
 *  tail?: number
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
export class WSInterface {
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
   * @type {string}
   */
  userId;

  /**
   * @type {string}
   */
  connId;

  /**
   * @type {WebSocket | null}
   */
  conn;

  /**
   * @type {Options}
   */
  options;

  /**
   * @type {string | null}
   */
  token;

  /**
   * @type {string}
   */
  configFile;

  /**
   * @param {Options} options
   */
  constructor(options) {
    this.options = options;
    this.userId = '';
    this.connId = v4();
    this.conn = new WebSocket(WEBSOCKET_ADDRESS, PROTOCOL_CLI);
    this.token = null;
    this.start();
    this.listener();
    this.configFile = getConfigFilePath();
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
   * @template {keyof WSMessageDataCli} T
   * @param {WSMessageCli<T>} data
   * @returns
   */
  sendMessage(data) {
    if (!this.conn) {
      console.warn('Missing connection in send message');
      return;
    }
    let _data = structuredClone(data);
    if (data.type === 'deploy') {
      _data.data.chunk = ['[...]'];
    }
    console.log('Send message', _data);
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
      /** @type {typeof ws.sendMessage<'setSocket'>} */ (ws.sendMessage)({
        status: 'info',
        type: 'setSocket',
        packageName: PACKAGE_NAME,
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
   * @param {WSMessageCli<'checkToken'>} param0
   * @returns
   */
  async listenCheckToken({ data, token, userId }) {
    if ((!data && !this.options.isLogin) || !token) {
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
   * @returns {ConfigFile}
   */
  getConfig() {
    if (!existsSync(this.configFile)) {
      console.warn('Config file is not exists, run', `"${PACKAGE_NAME} init" first`);
      process.exit(2);
    }
    const data = readFileSync(this.configFile).toString();
    return yaml.parse(data);
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

        /** @type {typeof this.sendMessage<'checkToken'>} */ (this.sendMessage)({
          token,
          type: 'checkToken',
          packageName: PACKAGE_NAME,
          data: false,
          lang: LANG,
          message: '',
          status: 'info',
          userId: this.userId,
        });
      } else {
        const authPath = getPackagePath(SESSION_FILE_NAME);
        console.info("Now it's using the saved session token:", authPath);
        /** @type {typeof this.sendMessage<'checkToken'>} */ (this.sendMessage)({
          token: authData.content,
          type: 'checkToken',
          packageName: PACKAGE_NAME,
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
        console[status](`<cloud> ${message}`, data.msg);
        if (status === 'error' || data.end) {
          process.exit(!data ? 1 : 0);
        }
        break;
      default:
        console.warn('Default message case of command:', type);
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
