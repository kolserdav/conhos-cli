/******************************************************************************************
 * Repository: Conhos cli
 * File name: init.js
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Sun Sep 01 2024 13:12:51 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import { existsSync } from 'fs';
import WS from '../connectors/ws.js';
import Inquirer from '../utils/inquirer.js';
import {
  CURRENCY,
  SIZE_INDEX_DEFAULT,
  COMMAND_DEFAULT,
  PACKAGE_NAME,
  EXCLUDE_DEFAULT,
} from '../utils/constants.js';
import { computeCostService, isCustomService, isCommonService } from 'conhos-vscode/dist/lib.js';
import {
  getConfigFilePath,
  console,
  getPackageName,
  getRustCommandDefault,
  filterUnique,
  getPHPCommandDefault,
  as,
  parseMessageCli,
  exit,
} from '../utils/lib.js';
import { PORT_DEFAULT, PORT_MAX, PORT_TYPES } from 'conhos-vscode/dist/constants.js';

/**
 * @typedef {import('../types/interfaces.js').Options} Options
 * @typedef {import('../connectors/ws.js').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('conhos-vscode').ConfigFile} ConfigFile
 * @typedef {import('../connectors/ws.js').Session} Session
 * @typedef {import('conhos-vscode').ServiceType} ServiceType
 * @typedef {import('conhos-vscode').ServiceTypeCustom} ServiceTypeCustom
 * @typedef {import('conhos-vscode').PortType} PortType
 * @typedef {import('conhos-vscode').ServiceSize} ServiceSize
 */
/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {import('../types/interfaces.js').WSMessageCli<T>} WSMessageCli<T>
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
   * @private
   */
  addNewService = false;

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
   * @type {ConfigFile['volumes']}
   */
  localVolumes = undefined;

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
            const res = await this.getConfig({
              withoutCheck: this.addNewService || this.overwrite,
            });
            if (res !== null) {
              const { config } = res;
              this.config = config;
              this.project = config.name;
              this.services = this.config.services;
            }
          }
          if (this.config) {
            this.config.name = this.project;
            this.server = this.config.server;
            this.localVolumes = this.config.volumes;
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
   * @returns {string}
   */
  getCostString(item, { sizes, baseCost, baseValue, baseStorageCostHour }) {
    const cost = computeCostService(
      {
        serviceSize: /** @type {typeof as<ServiceSize>} */ (as)(item.name),
        replicas: 1,
        storage: 0,
      },
      {
        sizes,
        baseCost,
        baseValue,
        baseStorageCostHour,
      }
    );
    if (!cost) {
      console.error(`"${item.name}" is not allowed here`);
      exit(1);
      return '';
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
      data: { sizes, baseCost, baseValue, services, baseStorageCostHour },
    } = param0;

    console.info("It's adding service to the config file...", this.configFile);

    /**
     * @type {string | undefined}
     */
    let command;
    const packageName = getPackageName();

    if (this.options.yes) {
      this.writeConfigFile({
        name: packageName,
        services: {
          node1: {
            image: 'node',
            active: true,
            pwd: 'examples/hello-world',
            exclude: EXCLUDE_DEFAULT.node,
            version: this.getService('node', services)?.tags[0] || 'latest',
            size: /** @type {typeof as<ServiceSize>} */ (as)(sizes[SIZE_INDEX_DEFAULT].name),
            command: COMMAND_DEFAULT.node,
            ports: [PORT_DEFAULT],
            environment: [`PORT=${PORT_DEFAULT.port}`],
          },
        },
        volumes: undefined,
      });

      console.info('Project successfully initialized', this.configFile);
      exit(0);
      return;
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
      console.error('Unexpected error. Service is temporarily unavailable.', '');
      exit(1);
      return;
    }
    const size = await inquirer.list(
      'Select size of service',
      sizes.map((item) =>
        this.getCostString(item, { sizes, baseCost, baseValue, baseStorageCostHour })
      ),
      SIZE_INDEX_DEFAULT
    );

    const version =
      serv.tags.length === 0
        ? await inquirer.input(`Set ${serv.name} version from ${serv.hub}/tags`, 'latest')
        : await inquirer.list(
            `Select ${serv.name} version`,
            serv.tags.map((item) => item.toString()),
            serv.tags.length,
            true
          );

    const fpm = service === 'php' && /fpm/.test(version);

    const customService = isCustomService(service);
    /**
     * @type {ConfigFile['services'][0]['exclude']}
     */
    let exclude;
    // Group services
    if (customService) {
      ports = await this.getPorts(fpm);
      exclude = EXCLUDE_DEFAULT[customService].concat(exclude || []).filter(filterUnique);
    }

    const firstPort = (ports || [])[0]?.port;

    const GET_SERVICE_MESSAGE = 'Specify service start command';
    // Switch services
    switch (service) {
      case 'node':
        command = await inquirer.input(GET_SERVICE_MESSAGE, COMMAND_DEFAULT.node);
        break;
      case 'rust':
        command = await inquirer.input(GET_SERVICE_MESSAGE, getRustCommandDefault(packageName));
        break;
      case 'python':
        command = await inquirer.input(GET_SERVICE_MESSAGE, COMMAND_DEFAULT.python);
        break;
      case 'golang':
        command = await inquirer.input(GET_SERVICE_MESSAGE, COMMAND_DEFAULT.golang);
        break;
      case 'php':
        command = await inquirer.input(
          GET_SERVICE_MESSAGE,
          getPHPCommandDefault(
            firstPort !== undefined ? firstPort : fpm ? 9000 : PORT_DEFAULT.port,
            fpm
          )
        );
        break;
      case 'ruby':
        command = await inquirer.input(GET_SERVICE_MESSAGE, COMMAND_DEFAULT.ruby);
        break;
      case 'custom':
        command = await inquirer.input(GET_SERVICE_MESSAGE, COMMAND_DEFAULT.custom);
        break;
      default:
        console.log('Default case in create service command', service);
    }

    const environment = (ports || []).map(
      (item, index) => `PORT${index === 0 ? '' : index}=${item.port}`
    );
    this.services[this.getServiceName(service)] = {
      image: service,
      size: /** @type {typeof as<ServiceSize>} */ (as)(size),
      active: true,
      version,
      pwd: isCommonService(service) ? undefined : './',
      exclude,
      command,
      ports: ports?.length ? ports : undefined,
      environment: environment?.length ? environment : undefined,
    };
    this.increaseIndex();

    this.writeConfigFile({
      name: this.project,
      server: this.server,
      services: this.services,
      volumes: this.localVolumes,
    });

    const addAnother = await inquirer.confirm('Do you want to add another service?', false);
    if (addAnother) {
      await this.handleDeployData(param0);
    } else {
      console.info('Project successfully initialized', this.configFile);
      exit(0);
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
   * @param {boolean} fpm
   * @param {ConfigFile['services'][0]['ports']} ports
   * @returns {Promise<ConfigFile['services'][0]['ports']>}
   */
  async getPorts(fpm, ports = []) {
    const _ports = ports.slice();
    const port = await inquirer.input(
      ports.length === 0 ? 'Setting up a listening port' : 'Setting up another listening port',
      fpm ? 9000 : PORT_DEFAULT.port,
      (input) => {
        const num = parseInt(input, 10);
        if (Number.isNaN(num) || !/^\d+$/.test(input)) {
          return 'Port must be a decimal number';
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
      return this.getPorts(fpm, _ports);
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
    const ADD_NEW_SERVICE = 'Add new service';
    const rewrite = await inquirer.expand('What do you want to make with old config file', 'H', [
      { key: 'o', value: OVERWRITE },
      { key: 'a', value: ADD_NEW_SERVICE },
    ]);
    if (rewrite === OVERWRITE) {
      this.overwrite = true;
    } else if (rewrite === ADD_NEW_SERVICE) {
      this.addNewService = true;
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
        exit(0);
      }
    }

    const res = await this.getConfig({ withoutCheck: this.overwrite || this.addNewService });
    if (res !== null) {
      const { config } = res;
      this.config = config;
    }

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
