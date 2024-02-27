import { parse, stringify } from 'yaml';
import { console } from './lib.js';

/**
 * @typedef {import('../types/interfaces.js').ConfigFile} ConfigFile
 */

export default class Yaml {
  /**
   * @public
   * @param {string} data
   * @returns {ConfigFile | null}
   */
  parse(data) {
    /**
     * @type {ConfigFile | null}
     */
    let res = null;
    try {
      res = parse(data);
    } catch (err) {
      console.error('Failed to parse config', '', err);
    }
    return res;
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
