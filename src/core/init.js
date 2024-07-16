import WS from '../connectors/ws.js';
import Inquirer from '../utils/inquirer.js';
import {
  CURRENCY,
  SIZE_INDEX_DEFAULT,
  COMMAND_DEFAULT,
  PACKAGE_NAME,
  EXCLUDE_NODE,
  EXCLUDE_RUST,
  COMMAND_PYTHON_DEFAULT,
  EXCLUDE_PYTHON,
  COMMAND_GOLANG_DEFAULT,
} from '../utils/constants.js';
import {
  parseMessageCli,
  computeCostService,
  PORT_MAX,
  PORT_DEFAULT,
  PORT_TYPES,
  isCustomService,
  isCommonServicePublic,
  as,
  isCommonService,
} from '../types/interfaces.js';
import { existsSync } from 'fs';
import {
  getConfigFilePath,
  console,
  getPackageName,
  getRustCommandDefault,
  filterUnique,
} from '../utils/lib.js';

/**
 * @typedef {import('../connectors/ws.js').Options} Options
 * @typedef {import('../connectors/ws.js').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('../types/interfaces.js').ConfigFile} ConfigFile
 * @typedef {import('../connectors/ws.js').Session} Session
 * @typedef {import('../types/interfaces.js').ServiceType} ServiceType
 * @typedef {import('../types/interfaces.js').ServiceTypeCustom} ServiceTypeCustom
 * @typedef {import('../types/interfaces.js').PortType} PortType
 * @typedef {import('../types/interfaces.js').ServiceSize} ServiceSize
 */
/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {import('../connectors/ws.js').WSMessageCli<T>} WSMessageCli<T>
 */

const inquirer = new Inquirer();

export default class Init extends WS {
  /**
   * @public
   * @type {string}
   */
  configFile;

  /**
   * @private
   * @type {ConfigFile['services']}
   */
  services;

  /**
   * @private
   * @type {ConfigFile['server']}
   */
  server;

  /**
   * @private
   */
  overwrite = false;

  /**
   * @public
   * @type {Options}
   */
  options;

  /**
   * @private
   * @type {number}
   */
  index;

  /**
   * @public
   * @type {string}
   */
  project = getPackageName();

  /**
   * @param {Options} options
   */
  constructor(options) {
    super(options);

    this.services = {};

    /**
     * @type {ConfigFile | null}
     */
    this.config = null;

    this.configFile = getConfigFilePath();

    this.options = options;

    this.index = 0;
  }

  /**
   * @public
   */
  listener() {
    if (!this.conn) {
      return;
    }

    this.conn.on('message', async (d) => {
      const rawMessage = /** @type {typeof parseMessageCli<any>} */ (parseMessageCli)(d.toString());
      if (rawMessage === null) {
        return;
      }
      const { type } = rawMessage;

      const configExists = existsSync(this.configFile);

      /**
       * @type {keyof WSMessageDataCli}
       */
      const _type = type;
      switch (_type) {
        case 'deployData':
          if (this.overwrite || !configExists) {
            this.project = await this.getProject();
            if (configExists) {
              if (!this.config) {
                console.warn('Config is missing', '');
                return;
              }
            }
          } else {
            this.config = this.getConfig();
            this.services = this.config.services;
          }
          if (this.config) {
            this.server = this.config.server;
            this.project = this.config.project || this.project;
          }
          await this.handleDeployData(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage, true);
      }
    });
  }

  /**
   * @private
   * @param {WSMessageDataCli['deployData']['sizes'][0]} item
   * @param {Omit<WSMessageDataCli['deployData'], 'services'>} param1
   * @returns
   */
  getCostString(item, { sizes, baseCost, baseValue }) {
    const cost = computeCostService(/** @type {typeof as<ServiceSize>} */ (as)(item.name), {
      sizes,
      baseCost,
      baseValue,
    });
    if (!cost) {
      console.error(`"${item.name}" is not allowed here`);
      process.exit(1);
    }
    const { month, hour } = cost;
    const costs = `: ${parseFloat((month / 100).toFixed(2))} ${CURRENCY}/month, ${parseFloat(
      (hour / 100).toFixed(2)
    )} ${CURRENCY}/hour`;
    return `${item.name} (${item.memory.name} RAM, ${item.storage} SSD)${costs}`;
  }

  /**
   * @private
   * @param {ServiceType} service
   * @param {WSMessageDataCli['deployData']['services']} services
   */
  getService(service, services) {
    const res = services.find((item) => item.type === service);
    if (!res) {
      console.error('Failed to find service from the list', {
        search: service,
        allowed: services.map((item) => item.type),
      });
    }
    return res;
  }

  /**
   * @private
   * @param {WSMessageCli<'deployData'>} param0
   */
  async handleDeployData(param0) {
    const {
      data: { sizes, baseCost, baseValue, services },
    } = param0;

    console.info("It's adding service to the config file...", this.configFile);

    /**
     * @type {string | undefined}
     */
    let command;
    const packageName = getPackageName();

    if (this.options.yes) {
      this.writeConfigFile({
        project: packageName,
        services: {
          node1: {
            type: 'node',
            active: true,
            public: true,
            pwd: 'examples/hello-world',
            exclude: EXCLUDE_NODE,
            version: this.getService('node', services)?.tags[0] || 'latest',
            size: /** @type {typeof as<ServiceSize>} */ (as)(sizes[SIZE_INDEX_DEFAULT].name),
            command: COMMAND_DEFAULT,
            ports: [PORT_DEFAULT],
            environment: [`PORT=${PORT_DEFAULT.port}`],
          },
        },
      });

      console.info('Project successfully initialized', this.configFile);
      process.exit(0);
    }

    /**
     * @type {ConfigFile['services'][0]['ports']}
     */
    let ports = [];

    /**
     * @type {any}
     */
    const _service = await inquirer.list(
      'Select service',
      services.map((item) => `${item.type} (${item.name})`),
      0
    );
    /**
     * @type {ServiceType}
     */
    const service = _service;

    const serv = this.getService(service, services);
    if (!serv) {
      console.error('Unexpected error. Service is temporarily unavailable.');
      process.exit(1);
    }
    const size = await inquirer.list(
      'Select size of service',
      sizes.map((item) => this.getCostString(item, { sizes, baseCost, baseValue })),
      SIZE_INDEX_DEFAULT
    );

    const version = await inquirer.list(
      `Select ${serv.name} version`,
      serv.tags.map((item) => item.toString()),
      serv.tags.length,
      true
    );

    /**
     * @type {ConfigFile['services'][0]['exclude']}
     */
    let exclude = [];
    const GET_SERVICE_MESSAGE = 'Specify service start command';
    // Switch services
    switch (service) {
      case 'node':
        command = await inquirer.input(GET_SERVICE_MESSAGE, COMMAND_DEFAULT);
        exclude = EXCLUDE_NODE.concat(exclude).filter(filterUnique);
        break;
      case 'rust':
        command = await inquirer.input(GET_SERVICE_MESSAGE, getRustCommandDefault(packageName));
        exclude = EXCLUDE_RUST.concat(exclude).filter(filterUnique);
        break;
      case 'python':
        command = await inquirer.input(GET_SERVICE_MESSAGE, COMMAND_PYTHON_DEFAULT);
        exclude = EXCLUDE_PYTHON.concat(exclude).filter(filterUnique);
        break;
      case 'golang':
        command = await inquirer.input(GET_SERVICE_MESSAGE, COMMAND_GOLANG_DEFAULT);
        break;
    }
    // Group services
    if (isCustomService(service)) {
      ports = await this.getPorts();
    }

    const environment = (ports || []).map(
      (item, index) => `PORT${index === 0 ? '' : index}=${item.port}`
    );
    this.services[this.getServiceName(service)] = {
      type: service,
      size: /** @type {typeof as<ServiceSize>} */ (as)(size),
      active: true,
      public: isCustomService(service) || isCommonServicePublic(service) || false,
      version,
      pwd: isCommonService(service) ? undefined : './',
      exclude,
      command,
      ports: ports?.length ? ports : undefined,
      environment: environment?.length ? environment : undefined,
    };
    this.increaseIndex();

    this.writeConfigFile({
      project: this.project,
      server: this.server,
      services: this.services,
    });

    const addAnother = await inquirer.confirm('Do you want to add another service?', false);
    if (addAnother) {
      await this.handleDeployData(param0);
    } else {
      console.info('Project successfully initialized', this.configFile);
      process.exit(0);
    }
  }

  /**
   * @private
   * @param {string} service
   * @returns {string}
   */
  getServiceName(service) {
    const name = `${service}${this.index}`;
    if (this.services[name]) {
      this.index++;
      return this.getServiceName(service);
    }
    return name;
  }

  /**
   * @private
   * @param {ConfigFile['services'][0]['ports']} ports
   * @returns {Promise<ConfigFile['services'][0]['ports']>}
   */
  async getPorts(ports = []) {
    const _ports = ports.slice();
    const port = await inquirer.input(
      ports.length === 0 ? 'Setting up a listening port' : 'Setting up another listening port',
      PORT_DEFAULT.port,
      (input) => {
        const num = parseInt(input, 10);
        if (Number.isNaN(num) || !/^\d+$/.test(input)) {
          return 'Port must be a decimal number';
        }
        if (num < PORT_DEFAULT.port) {
          return `Port must be more than ${PORT_DEFAULT.port}`;
        }
        if (num > PORT_MAX) {
          return `Port can't be more than ${PORT_MAX}`;
        }
        if (_ports.find((item) => item.port === num)) {
          return 'The same port is already exists';
        }
        return true;
      }
    );

    /**
     * @type {any}
     */
    const type = await inquirer.list('Select port type', PORT_TYPES, 0);

    _ports.push({
      port: parseInt(port, 10),
      type,
    });

    const anotherPort = await inquirer.confirm('Do you want to add another listened port?', false);
    if (anotherPort) {
      return this.getPorts(_ports);
    }
    return _ports;
  }

  /**
   * @private
   * @returns {Promise<string>}
   */
  async getProject() {
    const project = await inquirer.input('Setting up the project name', this.project, (input) => {
      const projectNameReg = /^[0-9a-zA-z\-_\\.]+$/;
      if (!projectNameReg.test(input)) {
        return `Project name contain not allowed symbols. Allowed regex: ${projectNameReg}`;
      }
      return true;
    });
    return project;
  }

  /**
   * @public
   * @type {WS['handler']}
   */
  async handler() {
    console.info('Starting init service script...', '');
    if (!existsSync(this.configFile)) {
      console.info('Config file is not found, creating...', this.configFile);
      /** @type {typeof this.sendMessage<'getDeployData'>} */ this.sendMessage({
        token: this.token,
        type: 'getDeployData',
        packageName: PACKAGE_NAME,
        message: '',
        data: {
          nodeName: this.config?.server?.node_name,
        },
        status: 'info',
        userId: this.userId,
        connId: this.connId,
      });
      return;
    }
    console.info('Config file is exists', this.configFile);
    const OVERWRITE = 'Overwrite';
    const rewrite = await inquirer.expand('What do you want to make with old config file', 'H', [
      { key: 'o', value: OVERWRITE },
      { key: 'a', value: 'Add new service' },
    ]);
    if (rewrite === OVERWRITE) {
      this.overwrite = true;
    }
    if (this.overwrite) {
      console.warn(
        'If you overwrite the config file that all old services will delete',
        'Old services will delete from cloud with all their data, when you run "deploy"'
      );
      const overwriteConf = await inquirer.confirm(
        'Do you want to overwrite the config file?',
        false
      );
      if (overwriteConf) {
        console.info('Config file will be overwrite', this.configFile);
      } else {
        console.info('This project has been initialized before');
        process.exit(0);
      }
    }

    this.config = this.getConfig();

    /** @type {typeof this.sendMessage<'getDeployData'>} */ this.sendMessage({
      token: this.token,
      type: 'getDeployData',
      packageName: PACKAGE_NAME,
      message: '',
      data: {
        nodeName: this.config?.server?.node_name,
      },
      status: 'info',
      userId: this.userId,
      connId: this.connId,
    });
  }

  increaseIndex() {
    this.index++;
  }
}
