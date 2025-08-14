/******************************************************************************************
 * Repository: Conhos cli
 * File name: login.js
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Sun Sep 01 2024 13:12:51 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import { existsSync, rmSync, writeFileSync } from 'fs';
import WS from '../connectors/ws.js';
import {
  console,
  createDockerConfig,
  exit,
  getPackagePath,
  getRegistryOrigin,
  openBrowser,
  parseMessageCli,
  readDockerConfig,
} from '../utils/lib.js';
import {
  SESSION_FILE_NAME,
  LOGIN_PAGE,
  QUERY_STRING_CONN_ID,
  PACKAGE_NAME,
  DOCKER_CONFIG_PATH,
} from '../utils/constants.js';
import Crypto from '../utils/crypto.js';
import Inquirer from '../utils/inquirer.js';

/**
 * @typedef {import('../connectors/ws.js').Options} Options
 * @typedef {import('../connectors/ws.js').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('../connectors/ws.js').Session} Session
 * @typedef {{userId: string;}} Identity
 */
/**
 * @template T
 * @typedef {import('../connectors/ws.js').WSMessageCli<any>} WsMessage<T>
 */

const inquirer = new Inquirer();
const crypto = new Crypto();

export default class Login extends WS {
  /**
   * @param {Options} options
   */
  constructor(options) {
    const _options = structuredClone(options);
    _options.isLogin = true;
    super(_options);
  }

  /**
   * @public
   * @returns
   */
  listener() {
    if (!this.conn) {
      console.warn('Connection ID is missing', 'Need to update the program version');
      return;
    }

    if (this.options.remove) {
      const authPath = getPackagePath(null, SESSION_FILE_NAME);
      if (existsSync(authPath)) {
        rmSync(authPath);
        console.info('Session token was deleted', authPath);
      } else {
        console.warn('Session token file not found', authPath);
      }
      exit(0);
    }

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
        case 'loginCli':
          await this.listenLogin(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage, true);
      }
    });
  }

  /**
   * @public
   * @type {WS['handler']}
   */
  async handler({ failedLogin, sessionExists }, rawMessage) {
    if (!this.options.remove) {
      let checked = false;
      if (rawMessage) {
        checked = rawMessage.data.checked;
      }
      if (failedLogin || !sessionExists || !checked) {
        this.openNewSession();
      } else {
        console.info('You have already signed in', '');
        exit(0);
      }
    }
  }

  /**
   * @private
   * @param {WsMessage<WSMessageDataCli['loginCli']>} param0
   * @returns
   */
  async listenLogin({ token, message, userId }) {
    if (!token) {
      console.warn("Session token wasn't get from the server", '');
      console.warn(message, '');
      exit(1);
      return;
    }
    /**
     * @type {Session}
     */
    let session = {
      iv: '',
      content: token,
      uid: userId,
    };
    if (this.options.crypt) {
      console.info('Session token will be encrypted with your password');

      const password = await inquirer.promptPassword('Enter a new password');
      const key = crypto.createHash(password);
      session = crypto.encrypt(token, key, userId);
    }
    const authPath = getPackagePath(null, SESSION_FILE_NAME);
    writeFileSync(authPath, JSON.stringify(session));

    this.createDockerConfig({ userId, token });

    console.info('Successfully logged in', '');
    exit(0);
  }

  /**
   * @private
   * @param {{
   *  userId: string;
   *  token: string
   * }} param0
   */
  createDockerConfig({ userId, token }) {
    const domain = getRegistryOrigin();
    if (!existsSync(DOCKER_CONFIG_PATH)) {
      console.info('Docker config file is not exists, will create', DOCKER_CONFIG_PATH);
      createDockerConfig({ userId, token, domain }, { auths: {} });
      return;
    }
    const dockerConfig = readDockerConfig();
    if (dockerConfig) {
      createDockerConfig({ userId, token, domain }, dockerConfig);
    } else {
      console.warn('Docker config is not changed', '');
      return;
    }
    console.info('Docker config changed', DOCKER_CONFIG_PATH);
  }

  /**
   * @private
   */
  openNewSession() {
    console.info('Trying to create a new session', '...');
    /** @type {typeof this.sendMessage<'loginServer'>} */ (this.sendMessage)({
      status: 'info',
      type: 'loginServer',
      message: '',
      packageName: PACKAGE_NAME,
      data: this.connId,
      token: this.token,
      userId: this.userId,
      connId: this.connId,
    });
    const url = `${LOGIN_PAGE}?${QUERY_STRING_CONN_ID}=${this.connId}`;
    console.info('Login via browser', url);
    openBrowser(url);
  }
}
