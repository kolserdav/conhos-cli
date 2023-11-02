/**
 * @typedef {'node'} ServiceType
 */

/**
 * @typedef { 'pico' | 'nano' | 'micro' | 'mili' | 'santi' | 'deci' |
 *  'deca' | 'hecto' | 'kilo' | 'mega' | 'giga' | 'tera'} ServiceSize
 */

/**
 * @typedef {object} WSMessageDataCli
 * @property {any} any
 * @property {string} setSocket
 * @property {string} test
 * @property {string} login
 * @property {boolean} checkTocken
 * @property {null} message
 * @property {{
 *  num: number;
 *  project: string;
 *  last: boolean;
 *  chunk: Uint8Array
 *  options: {
 *    serviceType: string;
 *    serviceSize: string
 *  } | null
 * }} upload
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
 *  'upload' | 'deployData' | 'getDeployData' | 'message';
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

const PROTOCOL_CLI = 'cli';
const NODE_VERSIONS = [18, 20, 21];

module.exports = { computeCostService, parseMessageCli, PROTOCOL_CLI, NODE_VERSIONS };
