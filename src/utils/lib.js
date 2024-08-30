import chalk from 'chalk';
import Console from 'console';
import path from 'path';
import { existsSync, readFileSync } from 'fs';
import { HOME_DIR, PACKAGE_NAME, DEBUG, CWD, CONFIG_FILE_NAME } from './constants.js';
import { ERROR_LOG_PREFIX } from '../types/interfaces.js';

/**
 * @typedef {number | null} StatusCode
 * @typedef {import('../types/interfaces.js').Status} Status
 * @typedef {import('../types/interfaces.js').UploadFileBody} UploadFileBody
 * @typedef {import('./constants.js').CommandDefault} CommandDefault
 */

/**
 * @typedef {{
 *  test?: boolean
 * }} Options
 */

/**
 * @param {any} arg
 */
const getBrightUnderline = (arg) => {
  let _arg = arg;
  if (typeof arg !== 'undefined' && typeof arg === 'object') {
    try {
      const copyArg = { ...arg };
      if (arg.token) {
        copyArg.token = '*******';
      }
      _arg = JSON.stringify(copyArg);
    } catch (e) {
      Console.error('Failed stringify log argument', arg);
    }
  }
  return typeof _arg !== 'undefined'
    ? /https?:\/\//.test(_arg)
      ? chalk.blue(_arg)
      : chalk.white(_arg)
    : undefined;
};

export const console = {
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  log: (...args) => {
    if (DEBUG) {
      Console.log('debug:', chalk.gray(args[0]), getBrightUnderline(args[1]), ...args.slice(2));
    }
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  info: (...args) => {
    Console.info('info:', chalk.cyanBright(args[0]), getBrightUnderline(args[1]), ...args.slice(2));
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  warn: (...args) => {
    Console.warn('warning:', chalk.yellow(args[0]), getBrightUnderline(args[1]), ...args.slice(2));
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  error: (...args) => {
    Console.error(
      ERROR_LOG_PREFIX,
      chalk.red(args[0]),
      getBrightUnderline(args[1]),
      ...args.slice(2)
    );
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
 * @param {number} timeout
 * @returns
 */
export async function wait(timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(0);
    }, timeout);
  });
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
 * @param {string} title
 */
export function stdoutWriteStart(title) {
  if (!process.stdout.clearLine) {
    return;
  }
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(title);
}

/**
 * @returns {string}
 */
export function getPackageName() {
  const cwd = process.cwd();
  const packageJsonPath = path.resolve(cwd, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return path.basename(path.resolve());
  }

  const data = readFileSync(packageJsonPath).toString();

  /**
   * @type {any}
   */
  let pack = {};
  try {
    pack = JSON.parse(data);
  } catch (_) {
    /** */
  }
  return pack.name || path.basename(path.resolve());
}

/**
 * @returns {string}
 */
export function getConfigFilePath() {
  let fileYml = path.resolve(CWD, CONFIG_FILE_NAME);
  if (!existsSync(fileYml)) {
    fileYml = fileYml.replace(/yaml$/, 'yml');
  }
  return fileYml;
}

/**
 * @param {string} packageName
 * @returns {string}
 */
export function getRustCommandDefault(packageName) {
  return `cargo build --release && ./target/release/${packageName}`;
}

/**
 * @param {number} port
 * @param {boolean} fpm
 * @returns {string}
 */
export function getPHPCommandDefault(port, fpm) {
  return fpm ? 'php-fpm' : `php -S 0.0.0.0:${port}`;
}

/**
 *
 * @param {string} value
 * @param {number} index
 * @param {string[]} array
 * @returns
 */
export const filterUnique = (value, index, array) => array.indexOf(value) === index;
