// @ts-check
const { v4 } = require("uuid");
const WS = require("../tools/ws");
const path = require("path");
const { tmpdir } = require("os");
const Tar = require("../utils/tar");
const { getPackage } = require("../utils/lib");
const { createReadStream } = require("fs");
const { LANG } = require("../utils/constants");

/**
 * @typedef {import('../tools/ws').Options} Options
 * @typedef {import('../tools/ws').CommandOptions} CommandOptions
 * @typedef {import('../tools/ws').MessageData} MessageData
 */

module.exports = class Login extends WS {
  /**
   *
   * @param {Options} options
   */
  constructor(options) {
    super(options);
    this.listener();
  }

  /**
   * @type {WS['listener']}
   */
  listener() {
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
      const { type } = rawMessage;
      switch (type) {
        case "test":
          await this.listenTest(connId);
          break;
        case "checkToken":
          await this.listenCheckToken(rawMessage, connId);
          break;
        default:
          console.warn("Default message case for command deploy", rawMessage);
      }
    });
  }

  /**
   * @param {string} connId
   * @param {CommandOptions} options
   */
  async handler(connId, { failedLogin, sessionExists }) {
    console.info("Starting deploy the project...");
    const fileZip = path.resolve(tmpdir(), "tmp.tgz");
    const tar = new Tar();
    await tar.create({ fileList: ["./"], file: fileZip });
    const pack = getPackage();

    const rStream = createReadStream(fileZip);
    let num = 0;
    rStream.on("data", (chunk) => {
      /** @type {typeof this.sendMessage<MessageData['upload']>} */ (
        this.sendMessage
      )(this.conn, {
        token: this.token,
        message: "",
        type: "upload",
        data: {
          num,
          project: pack.name,
          last: false,
          chunk: new Uint8Array(Buffer.from(chunk)),
        },
        lang: LANG,
        status: "info",
      });
      num++;
    });
    rStream.on("close", (d) => {
      /** @type {typeof this.sendMessage<MessageData['upload']>} */ (
        this.sendMessage
      )(this.conn, {
        token: this.token,
        message: "",
        type: "upload",
        data: {
          num,
          project: pack.name,
          last: true,
          chunk: new Uint8Array(),
        },
        lang: LANG,
        status: "info",
      });
    });
  }
};
