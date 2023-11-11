import { parse, stringify } from 'yaml';

/**
 * @typedef {import('../types/interfaces.js').ConfigFile} ConfigFile
 */

export default class Yaml {
  /**
   * @param {string} data
   * @returns {ConfigFile}
   */
  parse(data) {
    return parse(data);
  }

  /**
   * @param {ConfigFile} data
   * @return {string}
   */
  stringify(data) {
    return stringify(data);
  }
}
