import { tmpdir } from 'os';
import chalk from 'chalk';
import Console from 'console';
import path from 'path';
import {
  HOME_DIR,
  PACKAGE_NAME,
  DEBUG,
  CWD,
  CONFIG_FILE_NAME,
  UPLOAD_CHUNK_SIZE,
} from './constants.js';
import { createReadStream, existsSync, readFileSync, stat } from 'fs';
import { request } from 'http';

/**
 * @typedef {number | null} StatusCode
 * @typedef {import('../types/interfaces.js').Status} Status
 * @typedef {import('../types/interfaces.js').UploadFileBody} UploadFileBody
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
    Console.error('error:', chalk.red(args[0]), getBrightUnderline(args[1]), ...args.slice(2));
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
 *
 * @param {string} value
 * @param {number} index
 * @param {string[]} array
 * @returns
 */
export const filterUnique = (value, index, array) => {
  return array.indexOf(value) === index;
};

/**
 * @param {{
 *  filePath: string
 *  url: string;
 *  service: string;
 *  fileName: string;
 * }} param0
 * @returns {Promise<{
 *  status: Status
 *  message: string;
 *  code: number | undefined;
 * }>}
 */
export async function uploadFile({ filePath, url, service, fileName }) {
  console.log(`Upload file "${service}"`, fileName);
  const file = createReadStream(filePath, { highWaterMark: UPLOAD_CHUNK_SIZE });

  const allSize = await new Promise((resolve) => {
    stat(filePath, (err, data) => {
      if (err) {
        console.error('Failed to get stat of file', err);
        resolve(0);
        return;
      }
      const { size } = data;
      resolve(size);
    });
  });

  return new Promise((resolve) => {
    const req = request(url, { method: 'POST', headers: { 'Content-Type': 'binary' } }, (res) => {
      let message = '';
      let size = 0;
      res.on('data', (chunk) => {
        const _l = parseInt(chunk, 10);
        if (Number.isNaN(_l)) {
          message += chunk.toString();
          return;
        }
        size += _l;
        const percent = parseInt(((100 * size) / allSize).toFixed(0));
        stdoutWriteStart(`${service}|${fileName} uploading: ${percent}%`);
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode === 201 ? 'info' : 'error',
          code: res.statusCode,
          message,
        });
      });
    });

    file.on('data', (chunk) => {
      req.write(chunk);
    });

    file.on('end', () => {
      req.write('0');
      file.close();
    });
  });
}
