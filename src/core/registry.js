import WS from '../connectors/ws.js';

/**
 * @typedef {import('../connectors/ws.js').Options} Options
 */

export default class Registry extends WS {
  /**
   * @param {import('../connectors/ws.js').Options} options
   */
  constructor(options) {
    super(options);
  }
}
