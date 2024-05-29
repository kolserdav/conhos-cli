import WebSocket from 'ws';
import { SESSION_FILE_NAME, PACKAGE_NAME, CLOUD_LOG_PREFIX } from '../utils/constants.js';
import { getPackagePath, console, getConfigFilePath } from '../utils/lib.js';
import Crypto from '../utils/crypto.js';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import Inquirer from '../utils/inquirer.js';
import { PROTOCOL_CLI, checkConfig, WEBSOCKET_ADDRESS } from '../types/interfaces.js';
import Yaml from '../utils/yaml.js';
import pack from '../../package.json' with { type: 'json' };

const crypto = new Crypto();
const yaml = new Yaml();

/**
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('../types/interfaces.js').ConfigFile} ConfigFile
 */
/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {import('../types/interfaces.js').WSMessageCli<T>} WSMessageCli<T>
 */

/**
 * @typedef {'login' | 'deploy'} Protocol
 */

/**
 * @typedef {{
 *  iv: string;
 *  content: string;
 *  uid: string
 * }} Session
 */

/**
 * @typedef {{
 *  crypt?: boolean;
 *  remove?: boolean;
 *  yes?: boolean;
 *  follow?: boolean;
 *  isLogin?: boolean;
 *  timestamps?: boolean;
 *  since?: string;
 *  until?: string;
 *  tail?: number
 *  clear?: boolean;
 * }} Options
 */

/**
 * @typedef {{
 *  failedLogin: boolean
 *  sessionExists?: boolean
 * }} CommandOptions
 */

const inquirer = new Inquirer();

/**
 * @abstract
 * @constructor
 */
export class WSInterface {
  /**
   * @abstract
   */
  listener() {
    console.warn('Listener must be impelemented');
  }

  /**
   * @param {CommandOptions} options
   * @param {WSMessageCli<'checkTokenCli'> | undefined} [msg=null]
   */
  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  handler(options, msg) {
    console.warn('Handler must be impelemented');
  }
}

/**
 * @class
 * @implements WSInterface
 */
export default class WS {
  /**
   * @protected
   * @type {string}
   */
  project = '';

  /**
   * @protected
   * @type {string}
   */
  userId;

  /**
   * @type {string}
   */
  connId = '';

  /**
   * @type {WebSocket | null}
   */
  conn;

  /**
   * @type {Options}
   */
  options;

  /**
   * @type {string | null}
   */
  token;

  /**
   * @type {string}
   */
  configFile;

  /**
   * @param {Options} options
   */
  constructor(options) {
    this.options = options;
    this.userId = '';
    this.conn = new WebSocket(WEBSOCKET_ADDRESS, PROTOCOL_CLI);
    this.token = null;
    this.start();
    this.listener();
    this.configFile = getConfigFilePath();
  }

  /**
   * @type {WSInterface['listener']}
   */
  listener() {
    console.warn('Default WS listener');
  }

  /**
   * @type {WSInterface['handler']}
   */
  handler(options) {
    console.warn('Default WS handler', options);
  }

  /**
   * @template {keyof WSMessageDataCli} T
   * @param {WSMessageCli<T>} data
   * @returns
   */
  sendMessage(data) {
    if (!this.conn) {
      console.warn('Missing connection in send message');
      return;
    }
    let _data = structuredClone(data);
    if (data.type === 'deployServer') {
      _data.data.chunk = ['[...]'];
    }
    console.log('Send message', _data);
    this.conn.send(JSON.stringify(data));
  }

  /**
   * @private
   * @param {WS['project']} project
   */
  setProject(project) {
    this.project = project;
  }

  start() {
    if (!this.conn) {
      console.warn('WebSocket is missing');
      return;
    }
    this.conn.on('error', (error) => {
      console.error('Failed WS connection', { error, WEBSOCKET_ADDRESS });
    });
    const ws = this;
    this.conn.on('open', function open() {
      console.log('Open WS connection:', WEBSOCKET_ADDRESS);
      /** @type {typeof ws.sendMessage<'setSocketServer'>} */ (ws.sendMessage)({
        status: 'info',
        type: 'setSocketServer',
        packageName: PACKAGE_NAME,
        message: '',
        data: {
          version: pack.version,
        },
        connId: ws.connId,
        token: null,
        userId: ws.userId,
      });
    });
    this.conn.on('close', (d) => {
      console.warn(`Connection closed with code ${d}`, 'Try again later');
      process.exit();
    });
  }

  /**
   *
   * @param {WSMessageCli<'checkTokenCli'>} msg
   * @returns
   */
  async listenCheckToken(msg) {
    const { data, token, userId } = msg;
    if ((!data && !this.options.isLogin) || !token) {
      console.warn(`Session is not allowed. First run "${PACKAGE_NAME}" login`);
      process.exit(2);
    }

    this.setToken(token);
    this.setUserId(userId);

    const {
      status,
      message,
      data: { checked, errMess },
    } = msg;

    if (!this.options.isLogin) {
      if (!checked) {
        console[status](`${CLOUD_LOG_PREFIX} ${message}`, errMess);
        process.exit(1);
      }
    } else if (checked) {
      console.info('Successfully logged in', '');
      process.exit(0);
    }

    this.handler(
      {
        failedLogin: !data,
        sessionExists: true,
      },
      msg
    );
  }

  /**
   * @param {string} connId
   */
  setConnId(connId) {
    this.connId = connId;
  }

  /**
   * @param {{
   *  withoutWarns: boolean;
   * }} [param0={ withoutWarns: false }]
   * @returns {ConfigFile}
   */
  getConfig({ withoutWarns } = { withoutWarns: false }) {
    if (!existsSync(this.configFile)) {
      console.warn('Config file is not exists, run', `"${PACKAGE_NAME} init" first`);
      process.exit(2);
    }
    const data = readFileSync(this.configFile).toString();
    const config = yaml.parse(data);
    if (!config) {
      process.exit(1);
    }

    const checkErr = checkConfig(config);
    let checkExit = false;
    checkErr.forEach((item) => {
      if (!withoutWarns) {
        console[item.exit ? 'error' : 'warn'](item.msg, item.data);
      } else if (item.exit) {
        console['error'](item.msg, item.data);
      }
      if (item.exit) {
        checkExit = true;
      }
    });
    if (checkExit) {
      process.exit(2);
    }

    return config;
  }

  /**
   *
   * @param {ConfigFile} config
   */
  writeConfigFile(config) {
    writeFileSync(this.configFile, yaml.stringify(config));
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
   * @param {WSMessageCli<'setSocketCli'>} msg
   */
  async listenSetSocket(msg, skipSetProject = false) {
    const { connId } = msg;

    this.setConnId(connId);

    const authData = this.readSessionFile();

    if (!skipSetProject) {
      const config = this.getConfig();
      if (config) {
        this.setProject(config.project);
      }
    }

    if (authData) {
      this.setUserId(authData.uid);
      if (authData.iv !== '') {
        console.info('Session token was encrypted', '');

        const password = await inquirer.promptPassword('Enter password');
        const key = crypto.createHash(password);
        const token = crypto.decrypt(authData, key);

        if (token === null) {
          console.warn("Password is wrong, current session can't be use", '');
          if (!this.options.isLogin) {
            process.exit();
          }
          this.handler({ failedLogin: true });
          return;
        }

        /** @type {typeof this.sendMessage<'checkTokenServer'>} */ (this.sendMessage)({
          token,
          type: 'checkTokenServer',
          packageName: PACKAGE_NAME,
          data: {
            project: this.project,
          },
          message: '',
          status: 'info',
          userId: this.userId,
          connId: this.connId,
        });
      } else {
        const authPath = getPackagePath(SESSION_FILE_NAME);
        console.info("Now it's using the saved session token:", authPath);
        /** @type {typeof this.sendMessage<'checkTokenServer'>} */ (this.sendMessage)({
          token: authData.content,
          type: 'checkTokenServer',
          packageName: PACKAGE_NAME,
          data: {
            project: this.project,
          },
          message: '',
          status: 'info',
          userId: this.userId,
          connId: this.connId,
        });
      }
    } else if (!this.options.isLogin) {
      console.warn(`You are not authenticated, run "${PACKAGE_NAME} login" first`);
      process.exit(1);
    } else {
      this.handler({ failedLogin: false, sessionExists: false });
    }
  }

  /**
   *
   * @param {WSMessageCli<WSMessageDataCli['any']>} msg
   */
  async handleCommonMessages(msg, skipSetProject = false) {
    const { type, status, message, data, token } = msg;
    /**
     * @type {keyof WSMessageDataCli}
     */
    const _type = type;
    console.log('On message', { type, status, message, token });
    switch (_type) {
      case 'setSocketCli':
        await this.listenSetSocket(msg, skipSetProject);
        break;
      case 'checkTokenCli':
        await this.listenCheckToken(msg);
        break;
      case 'message':
        console[status](`${CLOUD_LOG_PREFIX} ${message}`, data.msg);
        if (status === 'error' || data.end) {
          process.exit(!data ? 1 : 0);
        }
        break;
      default:
        console.warn('Default message case of command:', type);
    }
  }

  /**
   * @param {string} userId
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * @param {string} token
   */
  setToken(token) {
    this.token = token;
  }
}
