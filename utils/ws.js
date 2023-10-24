// @ts-check
const WebSocket = require("ws");
const { LANG, WEBSOCKET_ADDRESS } = require("./constants");

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
   */
  constructor(url, protocol) {
    /**
     * @type {WebSocket | null}
     */
    this.conn = new WebSocket(url, protocol);
    /**
     * @type {Protocol}
     */
    this.protocol = protocol;
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
    this.conn.on("message", (d) => {
      const rawMessage = /** @type {typeof parseMessage<any>} */ (parseMessage)(
        d.toString()
      );
      if (rawMessage === null) {
        return;
      }
      const { type } = rawMessage;
      switch (type) {
        case MessageType.test:
          sendMessage(this.conn, {
            status: "info",
            type: MessageType.login,
            message: "",
            lang: LANG,
            data: "",
            token: null,
          });
          break;
        default:
          console.warn("Default case", rawMessage);
      }
    });
  }
};
