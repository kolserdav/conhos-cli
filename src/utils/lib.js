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

/**
 * @param {any} arg
 */
const getBrightUnderline = (arg) => {
  let _arg = arg;
  if (arg && typeof arg === 'object') {
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
  return _arg ? chalk.white(_arg) : '';
};

export const console = {
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  log: (...args) => {
    if (DEBUG) {
      Console.log(chalk.gray(args[0]), getBrightUnderline(args[1]), ...args.slice(2));
    }
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  info: (...args) => {
    Console.info(chalk.cyanBright(args[0]), getBrightUnderline(args[1]), ...args.slice(2));
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  warn: (...args) => {
    Console.warn(chalk.yellow(args[0]), getBrightUnderline(args[1]), ...args.slice(2));
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  error: (...args) => {
    Console.error(chalk.red(args[0]), getBrightUnderline(args[1]), ...args.slice(2));
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
 * @returns {string | undefined}
 */
export function getPackageName() {
  const cwd = process.cwd();
  const data = readFileSync(path.resolve(cwd, 'package.json')).toString();

  /**
   * @type {any}
   */
  let pack = {};
  try {
    pack = JSON.parse(data);
  } catch (_) {
    /** */
  }
  return pack.name;
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
