// @ts-check
const { v4 } = require("uuid");
const WS = require("../tools/ws");
const { getPackagePath, openBrowser, readUserValue } = require("../utils/lib");
const {
  SESSION_FILE_NAME,
  LANG,
  LOGIN_PAGE,
  QUERY_STRING_CONN_ID,
} = require("../utils/constants");
const { existsSync, rmSync, writeFileSync } = require("fs");
const Crypto = require("../utils/crypto");

/**
 * @typedef {import('../tools/ws').Options} Options
 * @typedef {import('../tools/ws').CommandOptions} CommandOptions
 * @typedef {import('../tools/ws').MessageData} MessageData
 * @typedef {import('../tools/ws').Session} Session
 */
/**
 * @template T
 * @typedef {import('../tools/ws').WsMessage<any>} WsMessage<T>
 */

const crypto = new Crypto();

module.exports = class Login extends WS {
  /**
   *
   * @param {Options} options
   */
  constructor(options) {
    const _options = { ...options };
    _options.isLogin = true;
    super(_options);
  }

  commandListeners() {
    if (!this.conn) {
      return;
    }

    const connId = v4();
    const ws = this;
    this.conn.on("message", async (d) => {
      const rawMessage = /** @type {typeof ws.parseMessage<any>} */ (
        ws.parseMessage
      )(d.toString());
      if (rawMessage === null) {
        return;
      }
      const { type, token } = rawMessage;
      switch (type) {
        case "test":
          await this.listenTest(connId);
          break;
        case "checkToken":
          await this.listenCheckToken(rawMessage, connId);
          break;
        case "login":
          await this.listenLogin(rawMessage);
          break;
        default:
          console.warn("Default message case of login command", rawMessage);
      }
    });
  }

  /**
   * @param {string} connId
   * @param {CommandOptions} options
   */
  handler(connId, { failedLogin, sessionExists }) {
    const authPath = getPackagePath(SESSION_FILE_NAME);
    if (!this.options.remove) {
      if (failedLogin || !sessionExists) {
        this.openNewSession(connId);
      } else {
        console.info("You have already signed in");
        process.exit(0);
      }
    } else {
      if (existsSync(authPath)) {
        rmSync(authPath);
        console.info("Session token was deleted");
      } else {
        console.info("Session token file not found");
      }
      process.exit(0);
    }
  }

  /**
   *
   * @param {WsMessage<MessageData['login']>} param0
   * @returns
   */
  async listenLogin({ token }) {
    if (!token) {
      console.warn("Session token wasn't get from server");
      return;
    }
    /**
     * @type {Session}
     */
    let session = {
      iv: "",
      content: token,
    };
    if (this.options.crypt) {
      /**
       * @type {string | undefined}
       */
      let cryptoPassword = undefined;
      console.info("Session token will be encrypted with your password");
      cryptoPassword = await readUserValue("Enter a new password: ", {
        hidden: true,
      });
      console.info("Specifyed password length is", cryptoPassword.length);

      const key = crypto.createHash(cryptoPassword);
      session = crypto.encrypt(token, key);
    }
    const authPath = getPackagePath(SESSION_FILE_NAME);
    writeFileSync(authPath, JSON.stringify(session));
    console.info("Successfully logged in");
    process.exit(0);
  }

  /**
   *
   * @param {string} connId
   */
  openNewSession(connId) {
    console.info("Trying to create a new session...");
    /** @type {typeof this.sendMessage<MessageData['login']>} */ (
      this.sendMessage
    )(this.conn, {
      status: "info",
      type: "login",
      message: "",
      lang: LANG,
      data: connId,
      token: null,
    });
    openBrowser(`${LOGIN_PAGE}?${QUERY_STRING_CONN_ID}=${connId}`);
  }
};
