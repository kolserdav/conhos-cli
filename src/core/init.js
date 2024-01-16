import WS from '../tools/ws.js';
import Inquirer from '../utils/inquirer.js';
import {
  CURRENCY,
  SIZE_INDEX_DEFAULT,
  COMMAND_DEFAULT,
  PACKAGE_NAME,
  EXCLUDE_NODE,
  EXCLUDE_RUST,
} from '../utils/constants.js';
import {
  parseMessageCli,
  computeCostService,
  PORT_MAX,
  PORT_DEFAULT,
  PORT_TYPES,
  SERVICES_CUSTOM,
} from '../types/interfaces.js';
import { existsSync } from 'fs';
import {
  getConfigFilePath,
  console,
  getPackageName,
  getRustCommandDefault,
  cast,
} from '../utils/lib.js';

/**
 * @typedef {import('../tools/ws.js').Options} Options
 * @typedef {import('../tools/ws.js').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('../types/interfaces.js').ConfigFile} ConfigFile
 * @typedef {import('../tools/ws.js').Session} Session
 * @typedef {import('../types/interfaces.js').ServiceType} ServiceType
 * @typedef {import('../types/interfaces.js').ServiceTypeCustom} ServiceTypeCustom
 * @typedef {import('../types/interfaces.js').PortType} PortType
 */
/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {import('../tools/ws.js').WSMessageCli<T>} WSMessageCli<T>
 */

const inquirer = new Inquirer();

export default class Init extends WS {
  /**
   * @type {string}
   */
  configFile;

  /**
   * @type {ConfigFile['services']}
   */
  services;

  /**
   * @type {Options}
   */
  options;

  /**
   * @type {number}
   */
  index;

  /**
   *
   * @param {Options} options
   */
  constructor(options) {
    super(options);

    this.services = {};

    this.configFile = getConfigFilePath();

    this.options = options;

    this.index = 0;
  }

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
      switch (type) {
        case 'deployData':
          await this.handleDeployData(rawMessage);
          break;
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
  }

  /**
   * @param {WSMessageDataCli['deployData']['sizes'][0]} item
   * @param {Omit<WSMessageDataCli['deployData'], 'services'>} param1
   * @returns
   */
  getCostString(item, { sizes, baseCost, baseValue }) {
    const cost = computeCostService(item.name, {
      sizes,
      baseCost,
      baseValue,
    });
    if (!cost) {
      console.error(`"${item.name}" is not allowed here`);
      process.exit(1);
    }
    const { month, hour } = cost;
    return `${item.name} (${item.memory.name} RAM, ${item.storage} SSD): ${month} ${CURRENCY}/month, ${hour} ${CURRENCY}/hour`;
  }

  /**
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
   *
   * @param {WSMessageCli<'deployData'>} param0
   */
  async handleDeployData(param0) {
    const {
      data: { sizes, baseCost, baseValue, services },
    } = param0;

    console.info("It's adding service to the config file...");

    /**
     * @type {string | undefined}
     */
    let command = COMMAND_DEFAULT;
    const packageName = getPackageName();

    if (this.options.yes) {
      this.writeConfigFile({
        project: packageName,
        services: {
          node1: {
            type: 'node',
            active: true,
            image: this.getService('node', services)?.tags[0] || 'latest',
            size: sizes[SIZE_INDEX_DEFAULT].name,
            command,
            ports: [PORT_DEFAULT],
            environment: {
              PORT: PORT_DEFAULT.port,
            },
          },
        },
        exclude: EXCLUDE_NODE,
      });

      console.info('Project successfully initialized', this.configFile);
      process.exit(0);
    }

    /**
     * @type {ConfigFile['services'][0]['ports']}
     */
    let ports = [];

    const project = await this.getProject();

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

    const image = await inquirer.list(
      `Select ${serv.name} image`,
      serv.tags.map((item) => item.toString()),
      serv.tags.length,
      true
    );

    /**
     * @type {ConfigFile['exclude']}
     */
    let exclude = undefined;
    const GET_SERVICE_MESSAGE = 'Specify service start command';
    // Switch services
    switch (service) {
      case 'node':
        command = await inquirer.input(GET_SERVICE_MESSAGE, command);
        exclude = EXCLUDE_NODE;
        break;
      case 'rust':
        command = await inquirer.input(GET_SERVICE_MESSAGE, getRustCommandDefault(packageName));
        exclude = EXCLUDE_RUST;
        break;
    }
    // Group services
    if (
      SERVICES_CUSTOM.indexOf(/** @type {typeof cast<ServiceTypeCustom>} */ (cast)(service)) !== -1
    ) {
      ports = await this.getPorts();
    }

    const environment = (ports || []).map(
      (item, index) => `PORT${index === 0 ? '' : index}=${item.port}`
    );
    this.services[`${service}${this.index}`] = {
      type: service,
      size,
      active: true,
      image,
      command,
      ports: ports?.length ? ports : undefined,
      environment: environment?.length ? environment : undefined,
    };
    this.increaseIndex();

    this.writeConfigFile({ project, services: this.services, exclude });

    const addAnother = await inquirer.confirm('Do you want to add another service?', false);
    if (addAnother) {
      await this.handleDeployData(param0);
    } else {
      console.info('Project successfully initialized', this.configFile);
      process.exit(0);
    }
  }

  /**
   *
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
   *
   * @returns {Promise<string>}
   */
  async getProject() {
    const project = await inquirer.input(
      'Setting up the project name',
      getPackageName(),
      (input) => {
        const projectNameReg = /^[0-9a-zA-z\-_\\.]+$/;
        if (!projectNameReg.test(input)) {
          return `Project name contain not allowed symbols. Allowed regex: ${projectNameReg}`;
        }
        return true;
      }
    );
    return project;
  }

  /**
   * @type {WS['handler']}
   */
  async handler() {
    console.info('Starting init service script...');
    if (!existsSync(this.configFile)) {
      console.info('Config file is not found, creating...', this.configFile);
      /** @type {typeof this.sendMessage<'getDeployData'>} */ this.sendMessage({
        token: this.token,
        type: 'getDeployData',
        packageName: PACKAGE_NAME,
        message: '',
        data: null,
        status: 'info',
        userId: this.userId,
        connId: this.connId,
      });
      return;
    }
    console.info('Config file is exists', this.configFile);
    const overwriteConf = await inquirer.confirm(
      'Do you want to overwrite the config file?',
      false
    );
    if (overwriteConf) {
      console.info('Config file will be overwrite');
      /** @type {typeof this.sendMessage<'getDeployData'>} */ this.sendMessage({
        token: this.token,
        type: 'getDeployData',
        packageName: PACKAGE_NAME,
        message: '',
        data: null,
        status: 'info',
        userId: this.userId,
        connId: this.connId,
      });
      return;
    }
    console.info('This project has already been initialized');
    process.exit(0);
  }

  increaseIndex() {
    this.index++;
  }
}
