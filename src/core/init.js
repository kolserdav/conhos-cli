const { v4 } = require('uuid');
const WS = require('../tools/ws');
const Inquirer = require('../utils/inquirer');
const {
  LANG,
  CURRENCY,
  BUILD_COMMAND_DEFAULT,
  INSTALL_COMMAND_DEFAULT,
  START_COMMAND_DEFAULT,
  CONFIG_EXCLUDE_DEFAULT,
  SIZE_INDEX_DEFAULT,
} = require('../utils/constants');
const {
  parseMessageCli,
  computeCostService,
  PORT_MAX,
  PORT_DEFAULT,
} = require('../types/interfaces');
const { existsSync, writeFileSync } = require('fs');
const { getConfigFilePath } = require('../utils/lib');
const Yaml = require('../utils/yaml');

const yaml = new Yaml();

/**
 * @typedef {import('../tools/ws').Options} Options
 * @typedef {import('../tools/ws').CommandOptions} CommandOptions
 * @typedef {import('../types/interfaces').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('../types/interfaces').ConfigFile} ConfigFile
 * @typedef {import('../tools/ws').Session} Session
 * @typedef {import('../types/interfaces').ServiceType} ServiceType
 */
/**
 * @template T
 * @typedef {import('../tools/ws').WSMessageCli<T>} WSMessageCli<T>
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

    const connId = v4();
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
          await this.handleCommonMessages(connId, rawMessage);
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
    return services.find((item) => item.value === service);
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

    let install = '';
    /**
     * @type {string | undefined}
     */
    let build;
    let start = '';
    let version = '';
    /**
     * @type {number[]}
     */
    let ports = [];

    const node = this.getService('node', services);
    if (!node) {
      console.error('Unexpected error. Service is temporarily unavailable.');
      return;
    }

    if (this.options.yes) {
      writeFileSync(
        this.configFile,
        yaml.stringify({
          services: {
            node1: {
              type: 'node',
              version: node.versions[0],
              size: sizes[SIZE_INDEX_DEFAULT].name,
              commands: {
                install: INSTALL_COMMAND_DEFAULT,
                build: BUILD_COMMAND_DEFAULT,
                start: START_COMMAND_DEFAULT,
              },
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

    const service = await inquirer.list(
      'Select service',
      services.map((item) => `${item.value} (${item.name})`),
      0
    );
    const size = await inquirer.list(
      'Select size of service',
      sizes.map((item) => this.getCostString(item, { sizes, baseCost, baseValue })),
      SIZE_INDEX_DEFAULT
    );

    if (service === 'node') {
      version = await inquirer.list(
        'Select NodeJS version',
        node.versions.map((item) => item.toString()),
        0
      );

      install = await inquirer.input('Specify "install" command', INSTALL_COMMAND_DEFAULT);

      const useBuild = await inquirer.confirm('Is needed to use "build" command?', true);

      if (useBuild) {
        build = await inquirer.input('Specify "build" command', BUILD_COMMAND_DEFAULT);
      }

      start = await inquirer.input('Specify "start" command', START_COMMAND_DEFAULT);

      ports = await this.getPorts();
    }
    this.services[`${service}${this.index}`] = {
      type: service,
      size,
      version,
      commands: {
        install,
        build,
        start,
      },
      ports,
      environment: {
        PORT: ports[0].toString(),
      },
    };

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
  async handler({ connId }) {
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
      });
      return;
    }
    console.info('This project has already been initialized');
    process.exit(0);
  }
};
