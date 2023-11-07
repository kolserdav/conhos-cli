const { parse, stringify } = require('yaml');

/**
 * @typedef {import('../types/interfaces').ConfigFile} ConfigFile
 */

module.exports = class Yaml {
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
    return stringify(data).replace('indexComment:', '#');
  }
};
