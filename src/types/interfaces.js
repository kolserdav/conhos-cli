/**
 * @typedef {'node'} ServiceType
 */

/**
 * @typedef { 'pico' | 'nano' | 'micro' | 'mili' | 'santi' | 'deci' |
 *  'deca' | 'hecto' | 'kilo' | 'mega' | 'giga' | 'tera'} ServiceSize
 */

/**
 * @typedef {{
 *  services: {
 *    name: string;
 *    index: number;
 *    size: string;
 *    version: number;
 *    commands: {
 *      install: string;
 *      start: string;
 *      build?: string;
 *    }?;
 *    ports: number[];
 *    environment: Record<string, string>;
 *  }[]
 *  exclude: string[]
 * }} ConfigFile
 */

/**
 * @typedef {object} WSMessageDataCli
 * @property {any} any
 * @property {string} setSocket
 * @property {string} test
 * @property {string} login
 * @property {boolean} checkToken
 * @property {null} message
 * @property {{
 *  num: number;
 *  project: string;
 *  last: boolean;
 *  chunk: Uint8Array
 *  config: ConfigFile | null
 * }} deploy
 * @property {null} getDeployData
 * @property {{
 *  services: {
 *    value: string;
 *    name: string;
 *    versions: string[];
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
 */

/**
 * @typedef {'info' | 'warn' | 'error'} Status
 */

/**
 * @template T
 * @typedef {{
 *  status: Status;
 *  type: 'login' | 'setSocket' | 'test' | 'checkToken' |
 *  'deploy' | 'deployData' | 'getDeployData' | 'message';
 *  message: string;
 *  lang: 'en';
 *  data: T;
 *  token: string | null;
 * }} WSMessageCli
 */

/**
 *
 * @param {string} serviceSize
 * @param {Omit<WSMessageDataCli['deployData'], 'services'>} options
 */
function computeCostService(serviceSize, { sizes, baseCost, baseValue }) {
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
function parseMessageCli(msg) {
  let data = null;
  try {
    data = JSON.parse(msg);
  } catch (e) {
    console.error('Failed parse message', e);
  }
  return data;
}

const PORT_DEFAULT = 3000;
const PROTOCOL_CLI = 'cli';
const NODE_VERSIONS = [18, 20, 21];
const PORT_MAX = 65535;

module.exports = {
  computeCostService,
  parseMessageCli,
  PROTOCOL_CLI,
  NODE_VERSIONS,
  PORT_MAX,
  PORT_DEFAULT,
};
