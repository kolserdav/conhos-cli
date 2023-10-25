// @ts-check
const WebSocket = require("ws");
const { v4 } = require("uuid");
const {
  LANG,
  WEBSOCKET_ADDRESS,
  LOGIN_PAGE,
  QUERY_STRING_CONN_ID,
  SESSION_FILE_NAME,
} = require("./constants");
const {
  openBrowser,
  getPackagePath,
  readUserValue,
  console,
} = require("./lib");
const Crypto = require("./crypto");
const { writeFileSync, readFileSync, existsSync } = require("fs");

const crypto = new Crypto();

const MessageType = {
  setSocket: "setSocket",
  test: "test",
  login: "login",
};

/**
 * @typedef {'login'} Protocol
 */

/**
 * @typedef {'info' | 'warn' | 'error'} Status
 */

/**
 * @template T
 * @typedef {T extends typeof MessageType.setSocket ? string :
 *  T extends typeof MessageType.test ? string :
 *  T extends typeof MessageType.login ? string : unknown
 * } ArgsSubset
 */

/**
 * @template T
 * @typedef {{
 *  status: Status;
 *  type: T;
 *  message: string;
 *  lang: 'en';
 *  data: ArgsSubset<T>;
 *  token: string | null;
 * }} WsMessage
 */

/**
 * @typedef {{
 *  crypt: boolean;
 * }} Options
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
      sendMessage(this, {
        status: "info",
        type: MessageType.setSocket,
        message: "",
        lang: LANG,
        data: "",
        token: null,
      });
    });

    switch (this.protocol) {
      case "login":
        this.login();
        break;
      default:
        console.warn("Default protocol case", this.protocol);
    }
  }

  login() {
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
        case MessageType.test:
          await this.listenTest(connId);
          break;
        case MessageType.login:
          await this.listenLogin(rawMessage);
          break;
        default:
          console.warn("Default case", rawMessage);
      }
    });
  }

  /**
   *
   * @param {WsMessage<typeof MessageType.login>} param0
   * @returns
   */
  async listenLogin({ token }) {
    if (!token) {
      console.warn("Session token wasn't get from server");
      return;
    }
    console.info("Successfully login on the service");
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
  }

  /**
   *
   * @param {string} connId
   */
  async listenTest(connId) {
    const sessionFilePath = getPackagePath(SESSION_FILE_NAME);
    if (existsSync(sessionFilePath)) {
      const authStr = readFileSync(sessionFilePath).toString();
      const authData = JSON.parse(authStr);
      let password = "";
      if (authData.iv) {
        console.info("Session file was encrypted");
        password = await readUserValue("Enter password: ", {
          hidden: true,
        });
        const key = crypto.createHash(password);
        const token = crypto.decrypt(authData, key);
        if (token === null) {
          console.warn(
            "Password is wrong, current session can't be use, trying to create a new session..."
          );
          this.openNewSession(connId);
          return;
        }
        console.info("Current session is authenticated");
      }
      return;
    }
    this.openNewSession(connId);
  }

  /**
   *
   * @param {string} connId
   */
  openNewSession(connId) {
    sendMessage(this.conn, {
      status: "info",
      type: MessageType.login,
      message: "",
      lang: LANG,
      data: connId,
      token: null,
    });
    openBrowser(`${LOGIN_PAGE}?${QUERY_STRING_CONN_ID}=${connId}`);
  }
};
