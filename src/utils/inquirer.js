const { SERVICE_SIZE_DEFAULT } = require('./constants');

const inquirer = import('inquirer');

/**
 * @typedef {import('../types/interfaces').ServiceSize} ServiceSize
 */

module.exports = class Inquirer {
  /**
   * @param {string} name
   * @returns {Promise<string>}
   */
  async promptPassword(name) {
    const prompt = (await inquirer).createPromptModule();
    return new Promise((resolve) => {
      prompt({ type: 'password', name, mask: '*' }).then((d) => {
        resolve(d[name]);
      });
    });
  }

  /**
   * @param {string} name
   * @param {string[]} choices
   * @param {number} def
   * @returns {Promise<string>}
   */
  async list(name, choices, def) {
    const prompt = (await inquirer).createPromptModule();
    return new Promise((resolve) => {
      prompt({ type: 'list', name, choices, default: def }).then((d) => {
        const value = d[name].match(/\w+/);
        resolve(value[0]);
      });
    });
  }

  /**
   * @param {string} name
   * @param {{key: string; name: string;  value: 'overwrite' | 'default' | 'none'}[]} choices
   * @returns {Promise<string>}
   */
  async promptServiceCommand(name, choices) {
    const prompt = (await inquirer).createPromptModule();
    return new Promise((resolve) => {
      prompt({ type: 'list', name, choices, default: 'd' }).then((d) => {
        resolve(d[name]);
      });
    });
  }

  /**
   * @param {string} name
   * @param {string | number} def
   * @param {(d: any) => boolean | string} validate
   * @returns {Promise<string>}
   */
  async input(name, def, validate = () => true) {
    const prompt = (await inquirer).createPromptModule();
    return new Promise((resolve) => {
      prompt({ type: 'input', name, default: def, validate }).then((d) => {
        resolve(d[name]);
      });
    });
  }

  /**
   * @param {string} name
   * @param {boolean} def
   * @returns {Promise<string>}
   */
  async confirm(name, def) {
    const prompt = (await inquirer).createPromptModule();
    return new Promise((resolve) => {
      prompt({ type: 'confirm', name, default: def }).then((d) => {
        resolve(d[name]);
      });
    });
  }
};
