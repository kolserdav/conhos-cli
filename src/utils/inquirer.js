/******************************************************************************************
 * Repository: Conhos cli
 * File name: inquirer.js
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Sun Sep 01 2024 13:12:51 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import inquirer from 'inquirer';
import { console } from './lib.js';

/**
 * @typedef {import('conhos-vscode').ServiceSize} ServiceSize
 */

export default class Inquirer {
  /**
   * @public
   * @param {string} name
   * @returns {Promise<string>}
   */
  async promptPassword(name) {
    const prompt = inquirer.createPromptModule();
    return new Promise((resolve) => {
      prompt({ type: 'password', name, mask: '*' }).then((d) => {
        resolve(d[name]);
      });
    });
  }

  /**
   * @public
   * @param {string} name
   * @param {string[]} choices
   * @param {number} def
   * @returns {Promise<string>}
   */
  async list(name, choices, def, all = false) {
    const prompt = inquirer.createPromptModule();
    return new Promise((resolve) => {
      prompt({ type: 'list', name, choices, default: def }).then((d) => {
        let result = d[name];
        if (!all) {
          const value = d[name].match(/[a-z_]+/);
          result = value[0];
        }
        resolve(result);
      });
    });
  }

  /**
   * @public
   * @param {string} name
   * @param {{key: string; name: string;  value: 'overwrite' | 'default' | 'none'}[]} choices
   * @returns {Promise<string>}
   */
  async promptServiceCommand(name, choices) {
    const prompt = inquirer.createPromptModule();
    return new Promise((resolve) => {
      prompt({ type: 'list', name, choices, default: 'd' }).then((d) => {
        resolve(d[name]);
      });
    });
  }

  /**
   * @public
   * @param {string} name
   * @param {string | number} def
   * @param {(d: any) => boolean | string} validate
   * @returns {Promise<string>}
   */
  async input(name, def, validate = () => true) {
    const prompt = inquirer.createPromptModule();
    return new Promise((resolve) => {
      prompt({ type: 'input', name, default: def, validate }).then((d) => {
        resolve(d[name] || def);
      });
    });
  }

  /**
   * @public
   * @param {string} name
   * @param {string | number} def
   * @param {{key: string; value: string}[]} choices
   * @param {(d: any) => boolean | string} validate
   * @returns {Promise<string>}
   */
  async expand(name, def, choices, validate = () => true) {
    console.info('\nList all options', 'H');
    const prompt = inquirer.createPromptModule();
    return new Promise((resolve) => {
      prompt({ type: 'expand', name, default: def, choices, validate }).then((d) => {
        resolve(d[name]);
      });
    });
  }

  /**
   * @public
   * @param {string} name
   * @param {boolean} def
   * @returns {Promise<boolean>}
   */
  async confirm(name, def) {
    const prompt = inquirer.createPromptModule();
    return new Promise((resolve) => {
      prompt({ type: 'confirm', name, default: def }).then((d) => {
        resolve(d[name]);
      });
    });
  }
}
