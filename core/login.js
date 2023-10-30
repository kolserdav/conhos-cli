// @ts-check
const { v4 } = require("uuid");
const WS = require("../tools/ws");

/**
 * @typedef {import('../tools/ws').Options} Options
 */

module.exports = class Login extends WS {
  /**
   *
   * @param {Options} options
   */
  constructor(options) {
    super(options);
  }

  loginCommandListeners() {
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
          console.warn("Default case", this.protocol, rawMessage);
      }
    });
  }
};
