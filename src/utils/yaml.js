import { parse, stringify } from 'yaml';

/**
 * @typedef {import('../types/interfaces.js').ConfigFile} ConfigFile
 */

export default class Yaml {
  /**
   * @public
   * @param {string} data
   * @returns {ConfigFile}
   */
  parse(data) {
    return parse(data);
  }

  /**
   * @public
   * @param {ConfigFile} data
   * @return {string}
   */
  stringify(data) {
    return stringify(data);
  }
}
