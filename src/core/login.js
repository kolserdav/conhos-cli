import { v4 } from 'uuid';
import WS from '../tools/ws.js';
import { getPackagePath, openBrowser } from '../utils/lib.js';
import { SESSION_FILE_NAME, LANG, LOGIN_PAGE, QUERY_STRING_CONN_ID } from '../utils/constants.js';
import { existsSync, rmSync, writeFileSync } from 'fs';
import Crypto from '../utils/crypto.js';
import Inquirer from '../utils/inquirer.js';
import { parseMessageCli } from '../types/interfaces.js';

/**
 * @typedef {import('../tools/ws.js').Options} Options
 * @typedef {import('../tools/ws.js').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('../tools/ws.js').Session} Session
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
    const _options = { ...options };
    _options.isLogin = true;
    super(_options);
    this.listener();
  }

  listener() {
    if (!this.conn) {
      return;
    }

    const connId = v4();
    const ws = this;
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
          await this.handleCommonMessages(connId, rawMessage);
      }
    });
  }

  /**
   * @type {WS['handler']}
   */
  async handler({ failedLogin, sessionExists, connId }) {
    const authPath = getPackagePath(SESSION_FILE_NAME);
    if (!this.options.remove) {
      if (failedLogin || !sessionExists) {
        this.openNewSession(connId);
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

  /**
   *
   * @param {string} connId
   */
  openNewSession(connId) {
    console.info('Trying to create a new session...');
    /** @type {typeof this.sendMessage<WSMessageDataCli['login']>} */ (this.sendMessage)({
      status: 'info',
      type: 'login',
      message: '',
      lang: LANG,
      data: connId,
      token: null,
    });
    openBrowser(`${LOGIN_PAGE}?${QUERY_STRING_CONN_ID}=${connId}`);
  }
}
