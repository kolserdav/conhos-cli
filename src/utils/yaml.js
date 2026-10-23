/******************************************************************************************
 * Repository: Conhos cli
 * File name: yaml.js
 * Author: Sergei Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Fri Oct 23 2026 22:22:33 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import { parse, stringify } from 'yaml';
import { console } from './lib.js';

/**
 * @typedef {import('conhos-vscode').ConfigFile} ConfigFile
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
