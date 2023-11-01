const { v4 } = require('uuid');
const WS = require('../tools/ws');
const Inquirer = require('../utils/inquirer');
const { LANG } = require('../utils/constants');

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

const inquirer = new Inquirer();

module.exports = class Init extends WS {
  /**
   *
   * @param {Options} options
   */
  constructor(options) {
    super(options);
    /**
     * @type {Options}
     */
    this.options = options;
    this.listener();
  }

  listener() {
    if (!this.conn) {
      return;
    }

    const connId = v4();
    const ws = this;
    this.conn.on('message', async (d) => {
      const rawMessage = /** @type {typeof ws.parseMessage<any>} */ (ws.parseMessage)(d.toString());
      if (rawMessage === null) {
        return;
      }
      const { type } = rawMessage;
      switch (type) {
        case 'deployData':
          await this.handleDeployData(rawMessage);
          break;
        default:
          await this.handleCommonMessages(connId, rawMessage);
      }
    });
  }

  /**
   *
   * @param {WsMessage<MessageData['deployData']>} param0
   */
  async handleDeployData({ data: { services, sizes } }) {
    console.log(services, sizes);
  }

  /**
   * @type {WS['handler']}
   */
  handler({ connId }) {
    /** @type {typeof this.sendMessage<MessageData['getDeployData']>} */ (this.sendMessage)({
      token: this.token,
      type: 'getDeployData',
      message: '',
      data: null,
      lang: LANG,
      status: 'info',
    });
  }
};
