import { tmpdir } from 'os';
import chalk from 'chalk';
import Console from 'console';
import path from 'path';
import { HOME_DIR, PACKAGE_NAME, DEBUG, CWD } from './constants.js';
import { existsSync, readFileSync } from 'fs';

/**
 * @typedef {number | null} StatusCode
 */

/**
 * @typedef {{
 *  test?: boolean
 * }} Options
 */

export const console = {
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  log: (...args) => {
    if (DEBUG) {
      Console.log(...args);
    }
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  info: (...args) => {
    Console.info(...args);
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  warn: (...args) => {
    Console.warn(...args);
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  error: (...args) => {
    Console.error(...args);
  },
};

/**
 * @param {string} url
 * @returns {Promise<any>}
 */
export async function openBrowser(url) {
  const open = (await import('open')).default;
  return open(url);
}

/**
 *
 * @param {string} postfix
 * @returns
 */
export function getPackagePath(postfix = '') {
  return path.normalize(`${HOME_DIR}/.${PACKAGE_NAME}/${postfix}`);
}

/**
 *
 * @param {string} title
 */
export function stdoutWriteStart(title) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(title);
}

/**
 *
 * @returns {any}
 */
export function getPackage() {
  const cwd = process.cwd();
  const data = readFileSync(path.resolve(cwd, 'package.json')).toString();
  return JSON.parse(data);
}

/**
 *
 * @param {string} packageName
 * @returns {string}
 */
export function getTmpArchive(packageName) {
  return path.resolve(tmpdir(), `${PACKAGE_NAME}_${packageName}.tgz`);
}

/**
 *
 * @returns {string}
 */
export function getConfigFilePath() {
  let fileYml = path.resolve(CWD, `${PACKAGE_NAME}.yaml`);
  if (!existsSync(fileYml)) {
    fileYml = fileYml.replace(/yaml$/, 'yml');
  }
  return fileYml;
}
