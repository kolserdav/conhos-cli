/******************************************************************************************
 * Repository: Conhos cli
 * File name: lib.js
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Sun Sep 01 2024 13:12:51 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import chalk from 'chalk';
import Console from 'console';
import path from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import {
  HOME_DIR,
  PACKAGE_NAME,
  DEBUG,
  CWD,
  CONFIG_FILE_NAME,
  DOCKER_CONFIG_PATH,
  LOGIN_PAGE,
  REGISTRY_AUTH_SUBDOMAIN,
  REGISTRY_PROXY_SUBDOMAIN,
  REGISTRY_SUBDOMAIN,
  REGISTRY_DOMAIN,
} from './constants.js';
import { ERROR_LOG_PREFIX } from 'conhos-vscode/dist/constants.js';
import { createLastStreamMessage } from 'conhos-vscode/dist/lib.js';
import EventEmitter from 'events';

/**
 * @template T
 * @param {*} data
 * @returns {T}
 */
export function as(data) {
  return data;
}

/**
 * @typedef {import('../types/interfaces.js').EmitterData} EmitterData
 * @typedef {number | null} StatusCode
 * @typedef {import('conhos-vscode').Status} Status
 * @typedef {import('conhos-vscode').UploadFileBody} UploadFileBody
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
      if (process.env.IS_SERVER === 'true') {
        /**
         * @type {EmitterData}
         */
        const data = {
          progress: {
            status: 'info',
            args,
          },
        };
        console._eventEmitter.emit('message', data);
      } else {
        Console.log('debug:', chalk.gray(args[0]), getBrightUnderline(args[1]), ...args.slice(2));
      }
    }
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  info: (...args) => {
    if (process.env.IS_SERVER === 'true') {
      /**
       * @type {EmitterData}
       */
      const data = {
        progress: {
          status: 'info',
          args,
        },
      };
      console._eventEmitter.emit('message', data);
    } else {
      Console.info(
        'info:',
        chalk.cyanBright(args[0]),
        getBrightUnderline(args[1]),
        ...args.slice(2)
      );
    }
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  warn: (...args) => {
    if (process.env.IS_SERVER === 'true') {
      /**
       * @type {EmitterData}
       */
      const data = {
        progress: {
          status: 'warn',
          args,
        },
      };
      console._eventEmitter.emit('message', data);
    } else {
      Console.warn(
        'warning:',
        chalk.yellow(args[0]),
        getBrightUnderline(args[1]),
        ...args.slice(2)
      );
    }
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  error: (...args) => {
    if (process.env.IS_SERVER === 'true') {
      /**
       * @type {EmitterData}
       */
      const data = {
        progress: {
          status: 'error',
          args,
        },
      };
      console._eventEmitter.emit('message', data);
    } else {
      Console.error(
        ERROR_LOG_PREFIX,
        chalk.red(args[0]),
        getBrightUnderline(args[1]),
        ...args.slice(2)
      );
    }
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  Log: (...args) => {
    if (process.env.IS_SERVER === 'true') {
      /**
       * @type {EmitterData}
       */
      const data = {
        progress: {
          status: 'log',
          args,
        },
      };
      console._eventEmitter.emit('message', data);
    } else {
      Console.log(args.join(' '));
    }
  },
  /**
   *
   * @param  {...any} args
   * @returns {void}
   */
  Warn: (...args) => {
    if (process.env.IS_SERVER === 'true') {
      /**
       * @type {EmitterData}
       */
      const data = {
        progress: {
          status: 'log',
          args,
        },
      };
      console._eventEmitter.emit('message', data);
    } else {
      Console.warn(args.join(' '));
    }
  },
  _eventEmitter: new EventEmitter(),
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
 * @param {string | null} homedir
 * @param {string} postfix
 * @returns
 */
export function getPackagePath(homedir, postfix) {
  return path.normalize(`${homedir || HOME_DIR}/.${PACKAGE_NAME}/${postfix}`);
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
  let output = title;
  const { columns } = process.stdout;
  if (output.length > columns) {
    output = output.substring(0, columns > 4 ? columns - 4 : columns);
    output += ' ...';
  }
  process.stdout.write(output);
}

/**
 * @returns {string}
 * @param {string | undefined} cwd
 */
export function getPackageName(cwd = undefined) {
  const packageJsonPath = path.resolve(cwd || CWD, 'package.json');
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
 * @param {string | undefined} cwd
 */
export function getConfigFilePath(cwd = undefined) {
  let fileYml = path.resolve(cwd || CWD, CONFIG_FILE_NAME);
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

/**
 * @param {{ url: string; maxSize: number }} param0
 * @returns {Promise<string>}
 */
export async function getFile({ url, maxSize }) {
  return new Promise((_resolve, reject) => {
    fetch(url)
      .then((response) => {
        if (!response.ok) {
          return reject(new Error(`HTTP error! status: ${response.status}`));
        }

        let totalBytes = 0;
        /**
         * @type {string[]}
         */
        const chunks = [];
        const decoder = new TextDecoder();
        const { body } = response;

        if (!body) {
          reject(new Error('Response body is unused'));
          return;
        }

        const reader = body.getReader();

        const readStream = () => {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                const finalString = chunks.join('') + decoder.decode();
                return _resolve(finalString);
              }

              totalBytes += value.length;
              if (totalBytes > maxSize) {
                return reject(
                  new Error(`Response size exceeds the maximum limit of ${maxSize} bytes`)
                );
              }
              chunks.push(decoder.decode(value, { stream: true }));
              readStream();
            })
            .catch(reject);
        };
        readStream();
      })
      .catch(reject);
  });
}

/**
 * @template {keyof import('../connectors/ws.js').WSMessageDataCli} T
 * @param {string} msg
 * @returns {import('../connectors/ws.js').WSMessageCli<T> | null}
 */
export function parseMessageCli(msg) {
  let data = null;
  try {
    data = JSON.parse(msg);
  } catch (e) {
    console.error('error', 'Failed parse message', e);
  }
  return data;
}

/**
 * @typedef {{
 *  auths: Record<string, {
 *    auth: string
 * }>
 * }} DockerConfig
 */

export function readDockerConfig() {
  if (!existsSync(DOCKER_CONFIG_PATH)) {
    return null;
  }
  const data = readFileSync(DOCKER_CONFIG_PATH);
  /**
   * @type {DockerConfig | null}
   */
  let res = null;
  try {
    res = JSON.parse(data.toString());
  } catch (e) {
    console.error('Failed to parse docker config file', e);
  }
  return res;
}

/**
 *
 * @param {{
 *   domain: string;
 *   userId: string;
 *   token: string;
 * }} param0
 * @param {DockerConfig} dockerConfig
 */
export function createDockerConfig({ domain, userId, token }, dockerConfig) {
  const config = structuredClone(dockerConfig);
  config.auths = {
    ...dockerConfig.auths,
    [domain]: {
      auth: Buffer.from(`${userId}:${token}`, 'utf-8').toString('base64'),
    },
  };
  writeFileSync(DOCKER_CONFIG_PATH, JSON.stringify(config, null, 4));
}

export function getAppDomain() {
  return LOGIN_PAGE.replace(/https?:\/\//, '').replace(/\/.+/, '');
}

export function getRegistryOrigin() {
  return `https://${REGISTRY_DOMAIN || getRegistryDomain()}`;
}

export function getRegistryDomain() {
  return `${REGISTRY_SUBDOMAIN}.conhos.ru`;
}

export function getRegistryProxyOrigin() {
  return `https://${REGISTRY_PROXY_SUBDOMAIN}.conhos.ru`;
}

export function getRegistryAuthOrigin() {
  return `https://${REGISTRY_AUTH_SUBDOMAIN}.conhos.ru`;
}
