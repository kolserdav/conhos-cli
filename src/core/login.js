import WS from '../tools/ws.js';
import { getPackagePath, openBrowser } from '../utils/lib.js';
import {
  SESSION_FILE_NAME,
  LOGIN_PAGE,
  QUERY_STRING_CONN_ID,
  PACKAGE_NAME,
} from '../utils/constants.js';
import { existsSync, rmSync, writeFileSync } from 'fs';
import Crypto from '../utils/crypto.js';
import Inquirer from '../utils/inquirer.js';
import { parseMessageCli } from '../types/interfaces.js';

/**
 * @typedef {import('../tools/ws.js').Options} Options
 * @typedef {import('../tools/ws.js').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('../tools/ws.js').Session} Session
 * @typedef {import('../types/interfaces.js').Identity} Identity
 */
/**
 * @template T
 * @typedef {import('../tools/ws.js').WSMessageCli<any>} WsMessage<T>
 */

const inquirer = new Inquirer();
const crypto = new Crypto();

export default class Login extends WS {
  /**
   *
   * @param {Options} options
   */
  constructor(options) {
    const _options = structuredClone(options);
    _options.isLogin = true;
    super(_options);
  }

  listener() {
    if (!this.conn) {
      return;
    }

    this.conn.on('message', async (d) => {
      const rawMessage = /** @type {typeof parseMessageCli<any>} */ (parseMessageCli)(d.toString());
      if (rawMessage === null) {
        return;
      }
      const { type } = rawMessage;
      switch (type) {
        case 'login':
          await this.listenLogin(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
  }

  /**
   * @type {WS['handler']}
   */
  async handler({ failedLogin, sessionExists }) {
    const authPath = getPackagePath(SESSION_FILE_NAME);
    if (!this.options.remove) {
      if (failedLogin || !sessionExists) {
        this.openNewSession();
      } else {
        console.info('You have already signed in');
        process.exit(0);
      }
    } else {
      if (existsSync(authPath)) {
        rmSync(authPath);
        console.info('Session token was deleted');
      } else {
        console.info('Session token file not found');
      }
      process.exit(0);
    }
  }

  /**
   *
   * @param {WsMessage<WSMessageDataCli['login']>} param0
   * @returns
   */
  async listenLogin({ token, message }) {
    if (!token) {
      console.warn("Session token wasn't get from the server");
      console.warn(message);
      process.exit(1);
      return;
    }
    /**
     * @type {Session}
     */
    let session = {
      iv: '',
      content: token,
    };
    if (this.options.crypt) {
      /**
       * @type {string | undefined}
       */
      let password = undefined;
      console.info('Session token will be encrypted with your password');

      password = await inquirer.promptPassword('Enter a new password');
      const key = crypto.createHash(password);
      session = crypto.encrypt(token, key);
    }
    const authPath = getPackagePath(SESSION_FILE_NAME);
    writeFileSync(authPath, JSON.stringify(session));
    console.info('Successfully logged in');
    process.exit(0);
  }

  openNewSession() {
    console.info('Trying to create a new session...');
    /** @type {typeof this.sendMessage<'login'>} */ (this.sendMessage)({
      status: 'info',
      type: 'login',
      message: '',
      packageName: PACKAGE_NAME,
      data: this.connId,
      token: null,
      userId: this.userId,
    });
    openBrowser(`${LOGIN_PAGE}?${QUERY_STRING_CONN_ID}=${this.connId}`);
  }
}
