import WebSocket from 'ws';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import path, { resolve } from 'path';
import { fileURLToPath } from 'url';
import { SESSION_FILE_NAME, PACKAGE_NAME, CLOUD_LOG_PREFIX } from '../utils/constants.js';
import { getPackagePath, console, getConfigFilePath } from '../utils/lib.js';
import Crypto from '../utils/crypto.js';
import Inquirer from '../utils/inquirer.js';
import {
  PROTOCOL_CLI,
  checkConfig,
  WEBSOCKET_ADDRESS,
  as,
  changeConfigFileVolumes,
} from '../types/interfaces.js';
import Yaml from '../utils/yaml.js';

const __filenameNew = fileURLToPath(import.meta.url);

const crypto = new Crypto();
const yaml = new Yaml();

/**
 * @typedef {import('../types/interfaces.js').DeployData} DeployData
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('../types/interfaces.js').ConfigFile} ConfigFile
 * @typedef {import('http').request} HttpRequest
 * @typedef {import('https').request} HttpsRequest
 * @typedef {import('../types/interfaces.js').Volumes} Volumes
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
 *  clearCache?: boolean;
 *  interractive?: boolean;
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
   * @private
   * @type {HttpRequest | null}
   */
  request = null;

  /**
   * @private
   * @type {HttpsRequest | null}
   */
  requestHttps = null;

  /**
   * @protected
   */
  canClose = true;

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
   * @protected
   * @type {Record<string, string>}
   */
  package = {};

  /**
   * @protected
   * @type {DeployData | null}
   */
  deployData = null;

  /**
   * @protected
   * @type {ConfigFile | null}
   */
  config = null;

  /**
   * @protected
   * @type {Volumes}
   */
  volumes = {};

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
    const _data = structuredClone(data);
    console.log('Send message', _data);
    this.conn.send(JSON.stringify(data));
  }

  /**
   * @private
   * @param {DeployData | null} data
   */
  setDeployData(data) {
    this.deployData = data;
  }

  /**
   * @private
   * @param {WS['project']} project
   */
  setProject(project) {
    this.project = project;
  }

  start() {
    this.package = JSON.parse(
      readFileSync(resolve(path.dirname(__filenameNew), '../../package.json')).toString()
    );

    if (!this.conn) {
      console.warn('WebSocket is missing');
      return;
    }
    this.conn.on('error', (error) => {
      console.error('Failed WS connection', { error, WEBSOCKET_ADDRESS });
      process.exit(1);
    });
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const ws = this;
    const { version } = this.package;
    this.conn.on('open', () => {
      console.log('Open WS connection:', WEBSOCKET_ADDRESS);
      /** @type {typeof ws.sendMessage<'setSocketServer'>} */ (ws.sendMessage)({
        status: 'info',
        type: 'setSocketServer',
        packageName: PACKAGE_NAME,
        message: '',
        data: {
          version,
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
    const { skipSetProject } = data;

    this.setUserId(userId);

    if (!skipSetProject) {
      const { config, volumes } = await this.getConfig();
      if (config) {
        this.setProject(config.name);
        this.config = config;
        this.volumes = volumes;
      }
    }

    if ((!data && !this.options.isLogin) || !token) {
      console.warn(`Session is not allowed. First run "${PACKAGE_NAME}" login`);
      process.exit(1);
    }

    this.setToken(token);

    const {
      status,
      message,
      data: { checked, errMess },
    } = msg;

    if (!this.options.isLogin) {
      if (!checked) {
        console[status](`${CLOUD_LOG_PREFIX} ${message}`, errMess);
        console.error('Failed to check session', 'Fix a warning before and try again');
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
   * @private
   * @param {string} data
   */
  changeVariables(data) {
    const envs = data.match(/\${?[a-zA-Z0-9_]+}?/g);
    let res = `${data}`;
    if (envs) {
      envs.forEach((item) => {
        const key = item.replace(/[\\$\\{\\}]+/g, '');
        const val = process.env[key];
        if (val) {
          res = res.replace(item, val);
        } else {
          console.warn('Undefined environment variable', item);
        }
      });
    }
    return res;
  }

  /**
   * @protected
   * @param {string} url
   * @returns {Promise<HttpRequest | HttpsRequest>}
   */
  async setRequest(url) {
    /**
     * @type {HttpRequest}
     */
    let result;
    if (/https:/.test(url)) {
      this.request =
        this.request ||
        (await new Promise((_resolve) => {
          import('https').then((d) => {
            _resolve(d.request);
          });
        }));
      result = /** @type {typeof as<HttpRequest>} */ (as)(this.request);
    } else {
      this.requestHttps =
        this.requestHttps ||
        (await new Promise((_resolve) => {
          import('http').then((d) => {
            _resolve(d.request);
          });
        }));
      result = /** @type {typeof as<HttpsRequest>} */ (as)(this.requestHttps);
    }
    return result;
  }

  /**
   * @protected
   * @param {{
   *  withoutWarns?: boolean;
   *  changeVars?: boolean;
   *  withoutCheck?: boolean;
   * }} [param0={ withoutWarns: false, changeVars: true, withoutCheck: false }]
   * @returns {Promise<{config: ConfigFile; volumes: Volumes}>}
   */
  async getConfig(
    { withoutWarns, changeVars, withoutCheck } = {
      withoutWarns: false,
      changeVars: true,
      withoutCheck: false,
    }
  ) {
    if (!existsSync(this.configFile)) {
      console.warn('Config file is not exists, run', `"${PACKAGE_NAME} init" first`);
      process.exit(1);
    }
    const _data = readFileSync(this.configFile).toString();
    const data = changeVars ? this.changeVariables(_data) : _data;
    let config = yaml.parse(data);
    if (!config) {
      process.exit(1);
    }

    const changeRes = await changeConfigFileVolumes({ config, userId: this.userId });
    if (changeRes.error) {
      console.error(changeRes.error, '');
      process.exit(1);
    }
    config = changeRes.config;
    const volumes = changeRes.volumes || {};
    if (!withoutCheck) {
      const checkErr = checkConfig(config, { deployData: this.deployData, isServer: false });
      let checkExit = false;
      checkErr.forEach((item) => {
        if (!withoutWarns) {
          console[item.exit ? 'error' : 'warn'](item.msg, item.data);
        } else if (item.exit) {
          console.error(item.msg, item.data);
        }
        if (item.exit) {
          checkExit = true;
        }
      });
      if (checkExit) {
        process.exit(2);
      }
    }

    return { config, volumes };
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

    this.setDeployData(msg.data.deployData);

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
            skipSetProject,
          },
          message: '',
          status: 'info',
          userId: this.userId,
          connId: this.connId,
        });
      } else {
        const authPath = getPackagePath(SESSION_FILE_NAME);
        console.log("Now it's using the saved session token:", authPath);
        /** @type {typeof this.sendMessage<'checkTokenServer'>} */ (this.sendMessage)({
          token: authData.content,
          type: 'checkTokenServer',
          packageName: PACKAGE_NAME,
          data: {
            skipSetProject,
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
          this.closeIfCan(data);
        }
        break;
      default:
        console.warn('Default message case of command:', type);
    }
  }

  /**
   * @private
   * @param {any} data
   */
  closeIfCan(data) {
    const interval = setInterval(() => {
      if (this.canClose) {
        clearInterval(interval);
        process.exit(!data ? 1 : 0);
      }
    }, 0);
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
