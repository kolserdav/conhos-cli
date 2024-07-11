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
  UPLOAD_PERCENT_DIFF,
} from './constants.js';
import { filesize } from 'filesize';
import { createReadStream, existsSync, readFileSync, stat } from 'fs';
import { request as requestHttps } from 'https';
import { request } from 'http';
import {
  HEADER_CONN_ID,
  UPLOAD_CHUNK_DELIMITER,
  UPLOAD_REQUEST_TIMEOUT,
  UPLOADED_FILE_MESSAGE,
} from '../types/interfaces.js';

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
 * @param {number} size
 * @param {number} curSize
 * @returns {number}
 */
function calculatePercents(size, curSize) {
  const percent = (curSize / size) * 100;
  return parseInt(percent.toFixed(0), 10);
}

/**
 * @param {{
 *  filePath: string
 *  url: string;
 *  service: string;
 *  fileName: string;
 *  connId: string;
 * }} param0
 * @returns {Promise<{
 *  status: Status
 *  message: string;
 *  code: number | undefined;
 * }>}
 */
export async function uploadFile({ filePath, url, service, fileName, connId }) {
  console.log(`Upload file "${service}"`, { fileName, url });

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

  let percent = 0;
  let percentUpload = 0;

  const checkNeedWait = () => percent - percentUpload <= UPLOAD_PERCENT_DIFF;

  const waitRead = async () => {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (checkNeedWait()) {
          clearInterval(interval);
          resolve(0);
        }
      }, 0);
    });
  };

  return new Promise((resolve) => {
    let size = 0;
    const fn = /https:/.test(url) ? requestHttps : request;
    const req = fn(
      url,
      {
        method: 'POST',
        headers: {
          'Transfer-Encoding': 'chunked',
          'content-type': 'application/octet-stream',
          'user-agent': 'client',
          host: url.replace(/https?:\/\//, '').replace(/\/.+$/, ''),
          [HEADER_CONN_ID]: connId,
        },
        rejectUnauthorized: false,
        timeout: UPLOAD_REQUEST_TIMEOUT,
      },
      (res) => {
        let message = '';
        let sizeUpload = 0;
        res.on('data', (msg) => {
          const chunks = msg.toString().split(UPLOAD_CHUNK_DELIMITER);
          const chunk = chunks[chunks.length - 1];
          const _l = parseInt(chunk, 10);
          if (Number.isNaN(_l)) {
            message += chunk;
            return;
          }
          sizeUpload += _l;
          percentUpload = calculatePercents(allSize, sizeUpload);
          if (percent !== 100) {
            percent = calculatePercents(allSize, size);
          }
          stdoutWriteStart(
            `${service}|${fileName} [read: ${percent}%] [uploading: ${percentUpload}% | ${filesize(
              sizeUpload,
              {
                standard: 'jedec',
              }
            ).replace(/\.\d+/, '')}/${filesize(allSize, {
              standard: 'jedec',
            })}]`
          );
        });

        res.on('error', (err) => {
          stdoutWriteStart('');
          console.error('Failed to upload file', { err, url });
          resolve({
            status: 'error',
            code: res.statusCode,
            message: err.message,
          });
        });

        res.on('end', () => {
          resolve({
            status:
              message === UPLOADED_FILE_MESSAGE.replace(UPLOAD_CHUNK_DELIMITER, '')
                ? 'info'
                : 'error',
            code: res.statusCode,
            message,
          });
        });
      }
    );

    const file = createReadStream(filePath, { highWaterMark: UPLOAD_CHUNK_SIZE });
    file.on('data', async (chunk) => {
      if (percent !== 100 && checkNeedWait()) {
        file.pause();
        await waitRead();
        file.resume();
      }
      size += chunk.length;
      req.write(chunk);
    });

    file.on('end', () => {
      file.close();
      req.end();
    });

    file.on('error', (e) => {
      console.error('Failed to read file to upload', e);
    });

    req.on('error', (error) => {
      stdoutWriteStart('');
      console.error('Request failed', { error, url });
      process.exit(1);
    });

    req.on('timeout', () => {
      stdoutWriteStart('');
      console.error('Request timeout exceeded', { url });
      process.exit(1);
    });

    req.on('close', () => {
      req.destroy();
    });
  });
}
