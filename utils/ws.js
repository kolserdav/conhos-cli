// @ts-check
const WebSocket = require("ws");
const { v4 } = require("uuid");
const {
  LANG,
  WEBSOCKET_ADDRESS,
  LOGIN_PAGE,
  QUERY_STRING_CONN_ID,
  SESSION_FILE_NAME,
  PACKAGE_NAME,
} = require("./constants");
const {
  openBrowser,
  getPackagePath,
  readUserValue,
  console,
  getPackage,
} = require("./lib");
const Crypto = require("./crypto");
const { writeFileSync, readFileSync, existsSync, rmSync } = require("fs");
const path = require("path");
const Http = require("./http");

const crypto = new Crypto();
const http = new Http();

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
 * }} Options
 */

/**
 * @template T
 * @typedef {{
 *  status: Status;
 *  type: 'login' | 'setSocket' | 'test' | 'checkToken';
 *  message: string;
 *  lang: 'en';
 *  data: T;
 *  token: string | null;
 * }} WsMessage
 */

/**
 * @typedef {object} MessageData
 * @property {string} setSocket
 * @property {string} test
 * @property {string} login
 * @property {boolean} checkTocken
 */

/**
 * @template T
 * @param {WebSocket | null} conn
 * @param {WsMessage<T>} data
 * @returns
 */
function sendMessage(conn, data) {
  if (!conn) {
    console.warn("Missing connection in send message");
    return;
  }
  console.log("Send message", data);
  conn.send(JSON.stringify(data));
}

/**
 * @template T
 * @param {string} msg
 * @returns {WsMessage<T> | null}
 */
function parseMessage(msg) {
  let data = null;
  try {
    data = JSON.parse(msg);
  } catch (e) {
    console.error("Failed parse message", e);
  }
  if (data) {
    console.log("Parse message", data);
  }
  return data;
}

module.exports = class WS {
  /**
   *
   * @param {string} url
   * @param {Protocol} protocol
   * @param {Options} options
   */
  constructor(url, protocol, options) {
    /**
     * @type {WebSocket | null}
     */
    this.conn = new WebSocket(url, protocol);
    /**
     * @type {Protocol}
     */
    this.protocol = protocol;
    /**
     * @type {Options}
     */
    this.options = options;
    this.start();
  }

  start() {
    if (!this.conn) {
      console.warn("WebSocket is missing");
      return;
    }
    this.conn.on("error", (e) => {
      console.error("Failed WS connection", e);
    });

    this.conn.on("open", function open() {
      console.log("Open WS connection:", WEBSOCKET_ADDRESS);
      /** @type {typeof sendMessage<MessageData['setSocket']>} */ (
        sendMessage
      )(this, {
        status: "info",
        type: "setSocket",
        message: "",
        lang: LANG,
        data: "",
        token: null,
      });
    });

    // Listen commands
    switch (this.protocol) {
      case "login":
        this.loginCommandListeners();
        break;
      case "deploy":
        this.deployCommandListeners();
        break;
      default:
        console.warn("Default protocol case", this.protocol);
    }
  }

  loginCommandListeners() {
    if (!this.conn) {
      return;
    }

    const connId = v4();

    this.conn.on("message", async (d) => {
      const rawMessage = /** @type {typeof parseMessage<any>} */ (parseMessage)(
        d.toString()
      );
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
          console.warn("Default case", this.protocol, rawMessage);
      }
    });
  }

  deployCommandListeners() {
    if (!this.conn) {
      return;
    }

    const connId = v4();

    this.conn.on("message", async (d) => {
      const rawMessage = /** @type {typeof parseMessage<any>} */ (parseMessage)(
        d.toString()
      );
      if (rawMessage === null) {
        return;
      }
      const { type } = rawMessage;
      switch (type) {
        case "test":
          await this.listenTest(connId);
          break;
        case "checkToken":
          await this.listenCheckToken(rawMessage, connId);
          break;
        default:
          console.warn("Default case", this.protocol, rawMessage);
      }
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
    this.startLogic(connId, { failedLogin: !data, sessionExists: true });
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
   * @typedef {{
   *  failedLogin: boolean
   *   sessionExists?: boolean
   * }} CommandOptions
   * @param {string} connId
   * @param {CommandOptions} options
   */
  async startLogic(connId, options) {
    switch (this.protocol) {
      case "login":
        this.login(connId, options);
        break;
      case "deploy":
        this.deploy(options);
        break;
      default:
        console.warn("Default case of logic");
    }
  }

  /**
   * @param {string} connId
   * @param {CommandOptions} options
   */
  login(connId, { failedLogin, sessionExists }) {
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
   * @param {CommandOptions} options
   */
  deploy({ failedLogin, sessionExists }) {
    const root = process.cwd();
    const fileEnv = path.resolve(root, "./.env");
    const pack = getPackage();
    http.uploadFile(fileEnv);
  }

  /**
   *
   * @param {string} connId
   */
  async listenTest(connId) {
    const authData = this.readSessionFile();
    if (authData) {
      let password = "";
      if (authData.iv !== "") {
        console.info("Session token was encrypted");
        password = await readUserValue("Enter password: ", {
          hidden: true,
        });
        const key = crypto.createHash(password);
        const token = crypto.decrypt(authData, key);
        if (token === null) {
          console.warn("Password is wrong, current session can't be use");
          this.startLogic(connId, { failedLogin: true });
          return;
        }

        /** @type {typeof sendMessage<MessageData['checkTocken']>} */ (
          sendMessage
        )(this.conn, {
          token,
          type: "checkToken",
          data: false,
          lang: LANG,
          message: "",
          status: "info",
        });
      } else {
        console.info("Now it's using the saved session token");
        /** @type {typeof sendMessage<MessageData['checkTocken']>} */ (
          sendMessage
        )(this.conn, {
          token: authData.content,
          type: "checkToken",
          data: false,
          lang: LANG,
          message: "",
          status: "info",
        });
      }
    } else if (this.protocol !== "login") {
      console.warn(
        `You are not authenticated, run "${PACKAGE_NAME} login" first`
      );
      process.exit(1);
    } else {
      this.startLogic(connId, { failedLogin: false, sessionExists: false });
    }
  }

  /**
   *
   * @param {string} connId
   */
  openNewSession(connId) {
    console.info("Trying to create a new session...");
    /** @type {typeof sendMessage<MessageData['login']>} */ (sendMessage)(
      this.conn,
      {
        status: "info",
        type: "login",
        message: "",
        lang: LANG,
        data: connId,
        token: null,
      }
    );
    openBrowser(`${LOGIN_PAGE}?${QUERY_STRING_CONN_ID}=${connId}`);
  }
};
