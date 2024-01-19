/**
 * @typedef {'node' | 'rust'} ServiceTypeCustom
 * @typedef {'redis' | 'postgres'} ServiceTypeCommon
 * @typedef {ServiceTypeCommon | ServiceTypeCustom} ServiceType
 */

// Switch services
/**
 * @type {Record<ServiceTypeCommon, string>}
 */
export const PASSWORD_ENV_NAME = {
  redis: 'REDIS_PASSWORD',
  postgres: 'POSTGRES_PASSWORD',
};
/**
 * @type {Record<ServiceTypeCommon, string>}
 */
export const ENVIRONMENT_EXCLUDED_CUSTOM = {
  redis: 'REDIS_HOST',
  postgres: 'POSTGRES_HOST',
};
/**
 * @type {Record<ServiceTypeCommon, string[]>}
 */
export const ENVIRONMENT_REQUIRED_FIELDS_CUSTOM = {
  redis: [],
  postgres: [PASSWORD_ENV_NAME.postgres, 'POSTGRES_USER', 'POSTGRES_DB'],
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
export const SERVICES_COMMON = ['redis', 'postgres'];

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
 *  'deca' | 'hecto' | 'kilo' | 'mega' | 'giga' | 'tera'} ServiceSize
 * @typedef {{
 *  service: string;
 *  domains: Record<string, string>;
 * }} NewDomains
 * @typedef {{
 *  port: number;
 *  type: PortType;
 *  timeout?: string;
 * }} Port
 */

export const WEBSOCKET_ADDRESS = process.env.WEBSOCKET_ADDRESS || 'http://localhost:3002';

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
 *  services: Record<string, {
 *    active: boolean;
 *    type: ServiceType;
 *    size: string;
 *    version: string;
 *    command?: string;
 *    ports?: Port[];
 *    depends_on?: string[];
 *    domains?: NewDomains['domains'],
 *    environment?: string[];
 *  }>
 *  exclude?: string[]
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
 * @property {string} setSocket
 * @property {string} test
 * @property {string} login
 * @property {boolean} checkToken
 * @property {{
 *  msg: string | number;
 *  end: boolean;
 * }} message
 * @property {{
 *  num: number;
 *  project: string;
 *  last: boolean;
 *  chunk: Uint8Array;
 *  config: ConfigFile | null;
 *  nodeName?: string;
 * }} deploy
 * @property {null} getDeployData
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
 * }} getLogs
 * @property {{
 *  last: boolean;
 *  text: string;
 *  num: number;
 * }} logs
 *  @property {{
 *  project: string;
 * }} remove
 * @property {NewDomains[]} setDomains
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
 * @param {string} serviceSize
 * @param {Omit<WSMessageDataCli['deployData'], 'services'>} options
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
  const month = parseFloat((value / (baseValue / baseCost)).toFixed(2));
  const rub = month / 30 / 24;
  const hour = parseFloat(rub.toFixed(rub > 1 ? 2 : 3));
  return { month, hour };
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
 */
export const isCommonService = (type) => {
  return SERVICES_COMMON.indexOf(/** @type {typeof as<ServiceTypeCommon>} */ (as)(type)) !== -1;
};

/**
 * @param {string} item
 * @param {string | null} name
 * @returns {string | null}
 */
const getEnvironmentValue = (item, name = null) => {
  /**
   * @type {string | null}
   */
  let res = null;
  const nameReg = name ? new RegExp(`^${name}=`) : /^[A-Za-z0-9_]+=/;
  if (nameReg.test(item)) {
    res = item.replace(nameReg, '');
  }
  return res;
};

/**
 * @param {string} name
 * @returns {string | null}
 */
export const getEnvironmentName = (name) => {
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
 * @param {Record<string, string>} record
 * @param {string} name
 * @returns
 */
export const checkRecord = (record, name) => {
  let check = false;
  const keys = Object.keys(record);
  keys.forEach((t) => {
    if (record[/** @type {typeof as<ServiceType>} */ (as)(t)] === name) {
      check = true;
    }
  });
  return check;
};

/**
 * @typedef {{msg: string; data: string; exit: boolean;}} CheckConfigResult
 * @param {ConfigFile} config
 * @returns {CheckConfigResult | null}
 */
export function checkConfig(config) {
  /**
   * @type {CheckConfigResult | null}
   */
  let res = null;

  // Check services field
  if (!config.services) {
    res = {
      msg: 'Required field is missing',
      data: 'services',
      exit: true,
    };
    return res;
  }

  const serviceKeys = Object.keys(config.services);

  // Check services lenght
  if (serviceKeys.length === 0) {
    res = {
      msg: 'Services list can not be empty',
      data: 'Add at least one service',
      exit: true,
    };
    return res;
  }

  serviceKeys.every((item) => {
    const { domains, ports, type, environment, version } = config.services[item];

    // Check service type
    if (SERVICE_TYPES.indexOf(type) === -1) {
      res = {
        msg: `Service type "${type}" is not allowed`,
        data: `Allowed service types: [${SERVICE_TYPES.join('|')}]`,
        exit: true,
      };
      return res;
    }

    // Check service version
    if (!version) {
      res = {
        msg: `Version doesn't exists in service "${item}"`,
        data: 'Try to add the field version to the config file',
        exit: true,
      };
      return res;
    }

    // Check custom services
    if (isCustomService(type)) {
      // Check ports
      (ports || []).forEach((item) => {
        if (PORT_TYPES.indexOf(item.type) === -1) {
          res = {
            msg: `Port type "${item.type}" is not allowed`,
            data: `Allowed port types: [${PORT_TYPES.join('|')}]`,
            exit: true,
          };
          return false;
        }
        return true;
      });
      if (res) {
        return res;
      }

      // Check domains
      if (domains) {
        Object.keys(domains).every((_item) => {
          const domain = domains[_item];
          if (domain.length > DOMAIN_MAX_LENGTH) {
            res = {
              msg: `Maximum allowed domain length is ${DOMAIN_MAX_LENGTH}. Passed domain is too long: ${domain.length}`,
              data: domain,
              exit: true,
            };
            return false;
          }
          return true;
        });
        if (res !== null) {
          return false;
        }
      }

      // Check environment
      if (environment) {
        environment.forEach((_item) => {
          const envName = getEnvironmentName(_item);
          if (!envName) {
            res = {
              msg: `Environment variable ${_item} has wrong format`,
              data: 'Try use NAME=value instead',
              exit: true,
            };
            return res;
          }
          const envVal = getEnvironmentValue(_item);
          if (envVal) {
            if (checkRecord(ENVIRONMENT_EXCLUDED_CUSTOM, envName)) {
              res = {
                msg: `Environment variable ${_item} is not allowed here`,
                data: _item,
                exit: true,
              };
            }
          } else {
            res = {
              msg: `Environment variable ${_item} has wrong format`,
              data: 'Try use NAME=value instead',
              exit: true,
            };
          }
        });
        if (res) {
          return res;
        }
      }
    }

    // Check common services
    if (isCommonService(type)) {
      let check = false;
      serviceKeys.every((_item) => {
        const { type: _type, depends_on } = config.services[_item];
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
      if (!check) {
        res = {
          msg: `You have ${type} service with name ${item}, bun noone another service depends on it`,
          data: `Add "depends_on" field with item ${item} to any custom service`,
          exit: false,
        };
        return res;
      }
    }

    // Check environment
    if (environment) {
      environment.forEach((_item) => {
        const envName = getEnvironmentName(_item);
        if (envName) {
          const envVal = getEnvironmentValue(_item);
          if (envVal) {
            const variable =
              PASSWORD_ENV_NAME[/** @type {typeof as<ServiceTypeCommon>} */ (as)(type)];
            if (!variable) {
              return;
            }
            if (variable === envName) {
              serviceKeys.every((__item) => {
                const { type: _type, environment: _environment } = config.services[__item];
                if (isCustomService(_type)) {
                  if (_environment) {
                    let check = false;
                    /**
                     * @type {string | null}
                     */
                    let _envVal = null;
                    _environment.forEach((___item) => {
                      const _envName = getEnvironmentName(___item);
                      if (_envName && _envName === envName) {
                        check = true;
                        _envVal = getEnvironmentValue(___item);
                      }
                    });
                    if (!check) {
                      res = {
                        msg: `Service "${item}" provided ${envName}, but in a service ${__item} dependent on it is not provided`,
                        data: `Try to add environment variable ${envName} to the service ${__item}`,
                        exit: true,
                      };
                      return false;
                    }
                    if (envVal !== _envVal) {
                      res = {
                        msg: `Service "${item}" provided ${envName}, but in a service ${__item} dependent on it this variable value is not the same`,
                        data: `Your service ${__item} will not be able to connect to service ${item}`,
                        exit: false,
                      };
                    }
                  }
                }
                return true;
              });
            }
          } else {
            res = {
              msg: `Environment variable ${item} has wrong format`,
              data: 'Try use NAME=value instead',
              exit: true,
            };
          }
        } else {
          res = {
            msg: `Environment variable ${item} has wrong format`,
            data: 'Try use NAME=value instead',
            exit: true,
          };
        }
      });
      if (res) {
        return res;
      }
    }

    return true;
  });
  return res;
}
