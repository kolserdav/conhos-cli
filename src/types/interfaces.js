/**
 * @typedef {'node' | 'redis'} ServiceType
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
 * @typedef {{
 *  project: string;
 *  services: Record<string, {
 *    active: boolean;
 *    type: ServiceType;
 *    size: string;
 *    image: string;
 *    command?: string;
 *    ports: Port[];
 *    domains?: NewDomains['domains'],
 *    environment: string[] | Record<string, string | number>;
 *  }>
 *  exclude: string[]
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
 *  tail: number | undefined
 * }} getLogs
 * @property {{
 *  last: boolean;
 *  text: string;
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
 *  lang: 'en';
 *  data: WSMessageDataCli[T];
 *  token: string | null;
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
 * @typedef {{msg: string; data: string; exit: boolean;}} CheckConfigResult
 * @param {ConfigFile} config
 * @returns {CheckConfigResult | null}
 */
export function checkConfig(config) {
  /**
   * @type {CheckConfigResult | null}
   */
  let res = null;
  Object.keys(config.services).every((item) => {
    const { domains, ports } = config.services[item];

    // Check ports
    ports.forEach((item) => {
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
    return true;
  });
  return res;
}
