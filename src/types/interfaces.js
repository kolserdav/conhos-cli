/**
 * @typedef {import('cache-changed').CacheItem} CacheItem
 * @typedef {'%'} NotPermitedServiceNameSymbols
 * @typedef {'node' | 'rust'} ServiceTypeCustom
 * @typedef {'redis' | 'postgres' | 'mysql' | 'adminer'} ServiceTypeCommon
 * @typedef {'adminer'} ServiceTypeCommonPublic
 * @typedef {ServiceTypeCommon | ServiceTypeCustom} ServiceType
 */

export const ENVIRONMENT_SWITCH = {
  redis: {
    password: 'REDIS_PASSWORD',
  },
  mysql: {
    rootPassword: 'MYSQL_ROOT_PASSWORD',
  },
};

// Switch services
/**
 * @type {Record<ServiceTypeCommon, string | null>}
 */
export const ENVIRONMENT_EXCLUDED_CUSTOM = {
  redis: 'REDIS_HOST',
  postgres: 'POSTGRES_HOST',
  mysql: 'MYSQL_ROOT_HOST',
  adminer: null,
};
/**
 * @type {Record<ServiceTypeCommon, string[]>}
 */
export const ENVIRONMENT_REQUIRED_COMMON = {
  redis: [ENVIRONMENT_SWITCH.redis.password],
  postgres: ['POSTGRES_PASSWORD', 'POSTGRES_USER', 'POSTGRES_DB'],
  adminer: [],
  mysql: [ENVIRONMENT_SWITCH.mysql.rootPassword, 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'],
};

/**
 * @template T
 * @param {any} data
 * @returns {T}
 */
export function as(data) {
  return data;
}

/**
 * @type {ServiceTypeCustom[]}
 */
export const SERVICES_CUSTOM = ['node', 'rust'];

/**
 * @type {ServiceTypeCommon[]}
 */
export const SERVICES_COMMON = ['redis', 'postgres', 'adminer', 'mysql'];

/**
 * @type {ServiceTypeCommonPublic[]}
 */
export const SERVICES_COMMON_PUBLIC = ['adminer'];

/**
 * @type {any[]}
 */
const _SERVICES_COMMON = SERVICES_COMMON;

/**
 * @type {ServiceType[]}
 */
const SERVICE_TYPES = _SERVICES_COMMON.concat(SERVICES_CUSTOM);

/**
 * @typedef {'http' | 'ws'} PortType
 * @typedef { 'pico' | 'nano' | 'micro' | 'mili' | 'santi' | 'deci' |
 *  'deca' | 'hecto' | 'kilo' | 'mega' } ServiceSize
 * @typedef {{
 *  serviceName: string;
 *  domains: Record<string, string>;
 *  public: boolean;
 *  serviceType: ServiceType;
 *  serviceId: string | null;
 * }} NewDomains
 * @typedef {{
 *  port: number;
 *  type: PortType;
 *  location?: string;
 *  timeout?: string;
 * }} Port
 */

const DEFAULT_WS_ADDRESS = 'wss://ws.conhos.ru';
export const WEBSOCKET_ADDRESS = process.env.WEBSOCKET_ADDRESS || DEFAULT_WS_ADDRESS;
if (DEFAULT_WS_ADDRESS !== WEBSOCKET_ADDRESS && process.env.NODE_ENV === 'production') {
  console.warn(
    'warn',
    'Default websocket address have changed by WEBSOCKET_ADDRESS to:',
    process.env.WEBSOCKET_ADDRESS
  );
}

/**
 * @type {Port}
 */
export const PORT_DEFAULT = {
  port: 3000,
  type: 'http',
};

/**
 * @type {PortType[]}
 */
export const PORT_TYPES = ['http', 'ws'];

/**
 * @typedef {'custom' | 'common'} ServiceKind
 */

/**
 * @typedef {{
 *  project: string;
 *  server?: {
 *    node_name: string;
 *    api_key: string;
 *  }
 *  services: Record<string, {
 *    active: boolean;
 *    type: ServiceType;
 *    size: ServiceSize;
 *    version: string;
 *    public: boolean;
 *    pwd?: string;
 *    exclude?: string[]
 *    command?: string;
 *    ports?: Port[];
 *    depends_on?: string[];
 *    domains?: NewDomains['domains'],
 *    environment?: string[];
 *  }>
 * }} ConfigFile
 */

/**
 * @typedef {{userId: string;}} Identity
 */

/**
 * @typedef {'info' | 'warn' | 'error'} Status
 */

/**
 * @typedef {object} WSMessageDataCli
 * @property {any} any
 * @property {string} setSocketCli
 * @property {{
 *  version: string;
 * }} setSocketServer
 * @property {string} loginCli
 * @property {string} loginServer
 * @property {{
 *  checked: boolean;
 *  project: string | null;
 *  errMess?: string;
 * }} checkTokenCli
 * @property {{
 *  project: string | null
 * }} checkTokenServer
 * @property {{
 *  msg: string | number;
 *  end: boolean;
 * }} message
 * @property {{
 *  projectDeleted: boolean;
 *  config: ConfigFile;
 * }} prepareDeployServer
 * @property {{
 *  exclude: string[] | undefined;
 *  pwd: string;
 *  service: string;
 *  cache: CacheItem[];
 *  pwdServer: string;
 *  active: boolean;
 * }} prepareDeployCli
 * @property {{
 *  num: number;
 *  chunk: Uint8Array;
 *  service: string;
 *  file: string;
 * }} deployServer
 * @property {{
 *  service: string;
 *  skip: boolean;
 *  last: boolean; // last service
 *  latest: boolean; // latest file of service
 *  file: string;
 *  num: number;
 * }} deployEndServer
 * @property {{
 *  service: string;
 *  files: string[];
 *  cwd: string;
 *  last: boolean;
 * }} deployDeleteFilesServer
 * @property {{
 *  service: string;
 *  files: string[];
 *  cwd: string;
 *  last: boolean;
 * }} deployDeleteFilesCli
 * @property {{
 *  nodeName?: string;
 * }} getDeployData
 * @property {{
 *  services: {
 *    type: ServiceType;
 *    name: string;
 *    images: string;
 *    tags: string[]
 * }[];
 *  sizes: {
 *    name: string;
 *    memory: {
 *     name: string;
 *     value: number;
 *    };
 *    cpus: number;
 *    storage: string;
 *  }[];
 *  baseValue: number;
 *  baseCost: number;
 *  nodePublic: boolean;
 * }} deployData
 * @property {{
 *  watch: boolean;
 *  timestamps: boolean;
 *  project: string;
 *  serviceName: string;
 *  since: string | undefined;
 *  until: string | undefined;
 *  tail: number | undefined;
 *  clear: boolean;
 *  config: ConfigFile | null
 * }} getLogs
 * @property {{
 *  last: boolean;
 *  text: string;
 *  num: number;
 * }} logs
 *  @property {{
 *  project: string;
 * }} remove
 * @property {{
 *  containerName: string;
 *  serviceName: string;
 *  serviceType: ServiceTypeCommon;
 * }} acceptDeleteCli
 * @property {{
 *  containerName: string;
 *  accept: boolean;
 * }} acceptDeleteServer
 * @property {NewDomains[]} setDomains
 * @property {{num: number; service: string; file: string;}} uploadProcess
 */

/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {{
 *  status: Status;
 *  type: T;
 *  packageName: string;
 *  message: string;
 *  userId: string;
 *  data: WSMessageDataCli[T];
 *  token: string | null;
 *  connId: string;
 * }} WSMessageCli
 */

export const PROTOCOL_CLI = 'cli';
export const PORT_MAX = 65535;
export const DOMAIN_MAX_LENGTH = 77;

/**
 *
 * @param {ServiceSize} serviceSize
 * @param {Omit<WSMessageDataCli['deployData'], 'services' | 'nodePublic'>} options
 */
export function computeCostService(serviceSize, { sizes, baseCost, baseValue }) {
  const currValueItem = sizes.find((item) => item.name === serviceSize);
  if (!currValueItem) {
    console.error('Failed to get cost of service for', serviceSize);
    return null;
  }
  const {
    memory: { value },
  } = currValueItem;
  const month = parseInt((value / (baseValue / (baseCost * 100))).toFixed(0));
  const hour = month / 30 / 24;
  const minute = hour / 60;
  return { month, hour, minute };
}

/**
 * @template T
 * @param {string} msg
 * @returns {WSMessageCli<T> | null}
 */
export function parseMessageCli(msg) {
  let data = null;
  try {
    data = JSON.parse(msg);
  } catch (e) {
    console.error('Failed parse message', e);
  }
  return data;
}

/**
 * @param {ServiceType} type
 */
export const isCustomService = (type) => {
  return SERVICES_CUSTOM.indexOf(/** @type {typeof as<ServiceTypeCustom>} */ (as)(type)) !== -1;
};

/**
 * @param {ServiceType} type
 * @returns {ServiceTypeCommon | null}
 */
export const isCommonService = (type) => {
  const _type = /** @type {typeof as<ServiceTypeCommon>} */ (as)(type);
  if (SERVICES_COMMON.indexOf(_type) !== -1) {
    return _type;
  }
  return null;
};

/**
 * @param {string} item
 * @returns {string | null}
 */
const getEnvironmentValue = (item) => {
  /**
   * @type {string | null}
   */
  let res = null;
  const nameReg = /^[A-Za-z0-9_]+=/;
  if (nameReg.test(item)) {
    res = item.replace(nameReg, '');
  }
  return res;
};

/**
 * @param {string} name
 * @returns {string | null}
 */
const getEnvironmentName = (name) => {
  /**
   * @type {string | null}
   */
  let res = null;
  const nameReg = /^[A-Za-z0-9_]+=/;
  if (nameReg.test(name)) {
    res = name.replace(/=.*/, '');
  }
  return res;
};

/**
 * @param {string[]} environment
 * @param {string} name
 * @returns {string | null}
 */
export const findEnvironmentValue = (environment, name) => {
  /**
   * @type {string | null}
   */
  let res = null;
  environment.forEach((item) => {
    const _name = getEnvironmentName(item);
    if (_name === name) {
      res = item.replace(/^[A-Za-z0-9_]+=/, '');
    }
  });
  return res;
};

/**
 *
 * @param {Record<string, string | null>} record
 * @param {string} name
 * @returns
 */
export const checkRecord = (record, name) => {
  let check = false;
  const keys = Object.keys(record);
  keys.forEach((t) => {
    if (name) {
      if (record[/** @type {typeof as<ServiceType>} */ (as)(t)] === name) {
        check = true;
      }
    }
  });
  return check;
};

/**
 * @param {string} variable
 * @returns {{
 *  name: string;
 *  value: string;
 * } | null}
 */
export const parseEnvironmentVariable = (variable) => {
  const name = getEnvironmentName(variable);
  const value = getEnvironmentValue(variable);
  if (!name || !value) {
    return null;
  }
  return {
    name,
    value,
  };
};

/**
 * @param {string} name
 * @returns {boolean}
 */
export const checkEnvironmentRequired = (name) => {
  let check = false;
  Object.keys(ENVIRONMENT_REQUIRED_COMMON).forEach((item) => {
    ENVIRONMENT_REQUIRED_COMMON[/** @type {typeof as<ServiceTypeCommon>} */ (as)(item)].forEach(
      (_item) => {
        if (_item === name) {
          check = true;
        }
      }
    );
  });
  return check;
};

/**
 * @param {ServiceType} type
 */
export const isCommonServicePublic = (type) => {
  return (
    SERVICES_COMMON_PUBLIC.indexOf(/** @type {typeof as<ServiceTypeCommonPublic>} */ (as)(type)) !==
    -1
  );
};

/**
 * @typedef {{msg: string; data: string; exit: boolean;}} CheckConfigResult
 * @param {ConfigFile} config
 * @returns {CheckConfigResult[]}
 */
export function checkConfig({ services, server }) {
  /**
   * @type {CheckConfigResult[]}
   */
  let res = [];

  // Check server
  if (server) {
    if (!server.node_name) {
      res.push({
        msg: 'Property is required for parameter "server"',
        data: 'node_name',
        exit: true,
      });
      return res;
    }
  }

  // Check services field
  if (!services) {
    res.push({
      msg: 'Required field is missing',
      data: 'services',
      exit: true,
    });
    return res;
  }

  const serviceKeys = Object.keys(services);

  // Check services lenght
  if (serviceKeys.length === 0) {
    res.push({
      msg: 'Services list can not be empty',
      data: 'Add at least one service',
      exit: true,
    });
    return res;
  }

  const CHECKS = {
    noOne: false,
  };

  serviceKeys.forEach((item) => {
    const {
      domains,
      ports,
      type,
      environment,
      version,
      command,
      public: _public,
      depends_on,
      active,
      pwd,
    } = services[item];

    // Check service name
    if (/%/.test(item)) {
      res.push({
        msg: "Service name contains the not allowed symbol: '%'",
        data: `"${item}"`,
        exit: true,
      });
    }

    // Check service type
    if (SERVICE_TYPES.indexOf(type) === -1) {
      res.push({
        msg: `Service type "${type}" is not allowed`,
        data: `Allowed service types: [${SERVICE_TYPES.join('|')}]`,
        exit: true,
      });
    }

    // Check service public
    if (_public) {
      if (isCommonService(type) && !isCommonServicePublic(type)) {
        res.push({
          msg: `Service "${item}" can not be public`,
          data: `Only services can be public: [${SERVICES_CUSTOM.concat(
            /** @type {typeof as<typeof SERVICES_CUSTOM>} */ (as)(SERVICES_COMMON_PUBLIC)
          ).join('|')}]`,
          exit: true,
        });
      }
    }

    if (!version) {
      // Check service version
      res.push({
        msg: `Version doesn't exists in service "${item}"`,
        data: 'Try to add the field version to the config file',
        exit: true,
      });
    }

    // Check custom services
    if (isCustomService(type)) {
      // Check pwd
      if (!pwd) {
        res.push({
          msg: "Required parameter 'pwd' is missing",
          data: `"${item}"`,
          exit: true,
        });
      }

      // Check ports
      (ports || []).forEach(({ port, type, location }) => {
        if (Number.isNaN(parseInt(port.toString(), 10)) || /\./.test(port.toString())) {
          res.push({
            msg: `Port "${port}" of service "${item}" must be an integer`,
            data: '',
            exit: true,
          });
        }
        if (location) {
          const allowedRegexp = /^[\\//0-9A-Za-z\\-_/]+$/;
          if (!allowedRegexp.test(location)) {
            res.push({
              msg: `Location "${location}" of service "${item}" has unallowed symbols`,
              data: `Allowed regexp ${allowedRegexp}`,
              exit: true,
            });
          }
          const startRegexp = /^\/[a-zA-Z0-9]{1}/;
          if (!startRegexp.test(location)) {
            res.push({
              msg: `Location "${location}" of service "${item}" have wrong start`,
              data: `It must starts with "/", Allowed start regexp ${startRegexp}`,
              exit: true,
            });
          }
          if (/\/{2,}/.test(location)) {
            res.push({
              msg: `Location "${location}" of service "${item}" have two or more slushes together`,
              data: 'Do not use two and more slushes together in location',
              exit: true,
            });
          }
        }
        if (PORT_TYPES.indexOf(type) === -1) {
          res.push({
            msg: `Port type "${type}" of service "${item}" is not allowed`,
            data: `Allowed port types: [${PORT_TYPES.join('|')}]`,
            exit: true,
          });
        }
      });

      // Check domains
      if (domains) {
        Object.keys(domains).forEach((_item) => {
          const domain = domains[_item];
          if (domain.length > DOMAIN_MAX_LENGTH) {
            res.push({
              msg: `Maximum allowed domain length is ${DOMAIN_MAX_LENGTH}. Passed domain is too long: ${domain.length}`,
              data: domain,
              exit: true,
            });
          }
        });
      }

      // Check environment format
      (environment || []).forEach((_item) => {
        const variable = parseEnvironmentVariable(_item);
        if (!variable) {
          res.push({
            msg: `Environment variable ${_item} has wrong format`,
            data: `Try use NAME=value instead of ${_item}`,
            exit: true,
          });
        }
      });

      // Check depends on
      if (active) {
        (depends_on || []).forEach((_item) => {
          if (!(services[_item] || {}).active) {
            res.push({
              msg: `Service "${item}" depends on of missing service "${_item}"`,
              data: `Try remove 'depends_on' item "${_item}" from service "${item}", or set service "${_item}" active`,
              exit: true,
            });
          }
        });
      }

      // Check environment exclude
      (environment || []).forEach((_item) => {
        const variable = parseEnvironmentVariable(_item);
        if (!variable) {
          return;
        }
        const { name } = variable;
        if (name) {
          if (checkRecord(ENVIRONMENT_EXCLUDED_CUSTOM, name)) {
            res.push({
              msg: `Environment variable ${_item} is not allowed here`,
              data: _item,
              exit: true,
            });
          }
        } else {
          res.push({
            msg: `Environment variable ${_item} has wrong format`,
            data: 'Try use NAME=value instead',
            exit: true,
          });
        }
      });
    }

    // Check common services
    if (isCommonService(type)) {
      // Check ports
      if (ports) {
        res.push({
          msg: `Field "ports" is not allowed for service "${item}"`,
          data: `Ports is only allowed for services [${SERVICES_CUSTOM.join('|')}]`,
          exit: true,
        });
      }

      // Check duplicate service type
      serviceKeys.forEach((_item) => {
        if (services[_item].type === type && _item !== item) {
          res.push({
            msg: `Duplicate service "${_item}" with type "${type}"`,
            data: `Only one service in project can have type "${type}"`,
            exit: true,
          });
        }
      });

      // Check command
      if (command) {
        res.push({
          msg: `Field "command" is not allowed for service "${item}"`,
          data: `Command is only allowed for services [${SERVICES_CUSTOM.join('|')}]`,
          exit: true,
        });
      }

      if (active) {
        // Check depends on
        let check = false;
        serviceKeys.forEach((_item) => {
          const { type: _type, depends_on } = services[_item];
          if (isCustomService(_type)) {
            if (!depends_on) {
              return true;
            }

            if (depends_on.indexOf(item) !== -1) {
              check = true;
              return false;
            }
          }
          return true;
        });
        if (!check && !_public && !CHECKS.noOne) {
          CHECKS.noOne = true;
          res.push({
            msg: `You have ${type} service with name "${item}", bun none another service depends on it`,
            data: `Add "depends_on" field with item "${item}" to any custom service`,
            exit: false,
          });
        }
      }

      const commonVaribles =
        ENVIRONMENT_REQUIRED_COMMON[/** @type {typeof as<ServiceTypeCommon>} */ (as)(type)];

      const _commonVariables = structuredClone(commonVaribles);
      // Check required environment
      /**
       * @type {boolean | undefined}
       */
      let check;
      commonVaribles.forEach((_item, index) => {
        (environment || []).forEach((__item) => {
          const variable = parseEnvironmentVariable(__item);
          if (!variable) {
            check = false;
            return;
          }
          const { name } = variable;
          if (name === _item) {
            check = true;
            _commonVariables.splice(index, 1);
          }
        });
      });
      if (typeof check === 'boolean' && !check) {
        res.push({
          msg: `One or more required environment variables for service "${item}" is missing`,
          data: `Required [${_commonVariables.join(' & ')}]`,
          exit: true,
        });
      }

      // Check depends on
      (environment || []).forEach((_item) => {
        const variable = parseEnvironmentVariable(_item);
        if (!variable) {
          return;
        }
        const { name, value } = variable;

        const index = commonVaribles.indexOf(name);
        if (index !== -1) {
          serviceKeys.forEach((__item) => {
            const { type: _type, environment: _environment, depends_on } = services[__item];

            if (!depends_on) {
              return;
            }
            if (depends_on.indexOf(item) === -1) {
              return;
            }

            if (isCustomService(_type)) {
              if (_environment) {
                let check = false;
                /**
                 * @type {string | null}
                 */
                let _envVal = null;
                _environment.forEach((___item) => {
                  const _envName = getEnvironmentName(___item);
                  if (_envName && _envName === name) {
                    check = true;
                    _envVal = getEnvironmentValue(___item);
                  }
                });

                if (!check && name !== ENVIRONMENT_SWITCH.mysql.rootPassword) {
                  res.push({
                    msg: `Service "${item}" provided ${name}, but in a service ${__item} dependent on it is not provided`,
                    data: `Try to add environment variable ${name} to the service ${__item}`,
                    exit: false,
                  });
                }
                if (value !== _envVal && check) {
                  res.push({
                    msg: `Service "${item}" provided ${name}, but in a service ${__item} dependent on it this variable value is not the same`,
                    data: `Your service ${__item} will not be able to connect to service ${item}`,
                    exit: false,
                  });
                }
              }
            }
          });
        }
      });
    }
  });
  return res.sort((a, b) => {
    if (!a.exit && b.exit) {
      return -1;
    }
    return 1;
  });
}
