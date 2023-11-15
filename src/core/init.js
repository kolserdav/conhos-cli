import { v4 } from 'uuid';
import WS from '../tools/ws.js';
import Inquirer from '../utils/inquirer.js';
import {
  LANG,
  CURRENCY,
  CONFIG_EXCLUDE_DEFAULT,
  SIZE_INDEX_DEFAULT,
  COMMAND_DEFAULT,
} from '../utils/constants.js';
import {
  parseMessageCli,
  computeCostService,
  PORT_MAX,
  PORT_DEFAULT,
} from '../types/interfaces.js';
import { existsSync, writeFileSync } from 'fs';
import { getConfigFilePath } from '../utils/lib.js';
import Yaml from '../utils/yaml.js';

const yaml = new Yaml();

/**
 * @typedef {import('../tools/ws.js').Options} Options
 * @typedef {import('../tools/ws.js').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('../types/interfaces.js').ConfigFile} ConfigFile
 * @typedef {import('../tools/ws.js').Session} Session
 * @typedef {import('../types/interfaces.js').ServiceType} ServiceType
 */
/**
 * @template T
 * @typedef {import('../tools/ws.js').WSMessageCli<T>} WSMessageCli<T>
 */

const inquirer = new Inquirer();

export default class Init extends WS {
  /**
   *
   * @param {Options} options
   */
  constructor(options) {
    super(options);
    /**
     * @type {ConfigFile['services']}
     */
    this.services = {};
    /**
     * @type {string}
     */
    this.configFile = getConfigFilePath();
    /**
     * @type {Options}
     */
    this.options = options;
    /**
     * @type {number}
     */
    this.index = 0;
    this.listener();
  }

  listener() {
    if (!this.conn) {
      return;
    }

    const ws = this;
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
   * @param {WSMessageCli<WSMessageDataCli['deployData']>} param0
   */
  async handleDeployData(param0) {
    const {
      data: { sizes, baseCost, baseValue, services },
    } = param0;

    console.info("It's adding service to the config file...");

    /**
     * @type {string | undefined}
     */
    let command;
    /**
     * @type {number[]}
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

    if (this.options.yes) {
      writeFileSync(
        this.configFile,
        yaml.stringify({
          services: {
            node1: {
              type: 'node',
              image: serv.tags[0],
              size: sizes[SIZE_INDEX_DEFAULT].name,
              command,
              ports: [PORT_DEFAULT],
              environment: {
                PORT: PORT_DEFAULT.toString(),
              },
            },
          },
          exclude: CONFIG_EXCLUDE_DEFAULT,
        })
      );

      console.info('Project successfully initialized', this.configFile);
      process.exit(0);
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

    // Switch services
    if (service === 'node') {
      command = await inquirer.input('Specify service start command', COMMAND_DEFAULT);

      ports = await this.getPorts();
    }

    this.services[`${service}${this.index}`] = {
      type: service,
      size,
      image,
      command,
      ports,
      environment: {
        PORT: ports[0] ? ports[0].toString() : undefined,
      },
    };
    this.increaseIndex();

    writeFileSync(
      this.configFile,
      yaml.stringify({ services: this.services, exclude: CONFIG_EXCLUDE_DEFAULT })
    );

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
   * @param {number[]} ports
   * @returns {Promise<number[]>}
   */
  async getPorts(ports = []) {
    const _ports = ports.slice();
    const port = await inquirer.input(
      ports.length === 0 ? 'Setting up a listening port' : 'Setting up another listening port',
      PORT_DEFAULT,
      (input) => {
        const num = parseInt(input, 10);
        if (Number.isNaN(num) || !/^\d+$/.test(input)) {
          return 'Port must be a decimal number';
        }
        if (num < PORT_DEFAULT) {
          return `Port must be more than ${PORT_DEFAULT}`;
        }
        if (num > PORT_MAX) {
          return `Port can't be more than ${PORT_MAX}`;
        }
        if (_ports.indexOf(num) !== -1) {
          return 'The same port is already exists';
        }
        return true;
      }
    );
    _ports.push(parseInt(port, 10));

    const anotherPort = await inquirer.confirm('Do you want to add another listened port?', false);
    if (anotherPort) {
      return this.getPorts(_ports);
    }
    return _ports;
  }

  /**
   * @type {WS['handler']}
   */
  async handler() {
    console.info('Starting init service script...');
    if (!existsSync(this.configFile)) {
      console.info('Config file is not found, creating...', this.configFile);
      /** @type {typeof this.sendMessage<WSMessageDataCli['getDeployData']>} */ this.sendMessage({
        token: this.token,
        type: 'getDeployData',
        message: '',
        data: null,
        lang: LANG,
        status: 'info',
        userId: this.userId,
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
      /** @type {typeof this.sendMessage<WSMessageDataCli['getDeployData']>} */ this.sendMessage({
        token: this.token,
        type: 'getDeployData',
        message: '',
        data: null,
        lang: LANG,
        status: 'info',
        userId: this.userId,
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
