/**
 * @typedef {'node' | 'redis'} ServiceType
 * @typedef {'http' | 'ws'} PortType
 */

/**
 * @typedef { 'pico' | 'nano' | 'micro' | 'mili' | 'santi' | 'deci' |
 *  'deca' | 'hecto' | 'kilo' | 'mega' | 'giga' | 'tera'} ServiceSize
 */

/**
 * @typedef {{
 *  service: string;
 *  domains: Record<string, string>;
 * }} NewDomains
 */

/**
 * @type {PortType[]}
 */
export const PORT_TYPES = ['http', 'ws'];

/**
 * @typedef {{
 *  project: string;
 *  services: Record<string, {
 *    type: ServiceType;
 *    size: string;
 *    image: string;
 *    command?: string;
 *    ports: {
 *      port: number;
 *      type: PortType
 *    }[];
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

export const PORT_DEFAULT = 3000;
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
 * @param {ConfigFile} config
 * @returns {string | null}
 */
export function checkConfig(config) {
  /**
   * @type {string | null}
   */
  let res = null;
  Object.keys(config.services).every((item) => {
    const { domains } = config.services[item];
    if (domains) {
      Object.keys(domains).every((_item) => {
        const domain = domains[_item];
        if (domain.length > DOMAIN_MAX_LENGTH) {
          res = `Maximum allowed domain length is ${DOMAIN_MAX_LENGTH}. Domain "${domain}" is too long: ${domain.length}`;
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
