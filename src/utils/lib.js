const { tmpdir } = require('os');
const { spawn } = require('child_process');
const { HOME_DIR, PACKAGE_NAME, DEBUG, CWD } = require('./constants');
const Console = require('console');
const path = require('path');
const { existsSync } = require('fs');

/**
 * @typedef {number | null} StatusCode
 */

/**
 * @typedef {{
 *  test?: boolean
 * }} Options
 */

const console = {
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
 * @param {string} ex
 * @param {string[]} args
 * @param {{
 *  quiet?: boolean
 * }} options
 * @returns {Promise<StatusCode>}
 */
async function spawnCommand(ex, args, { quiet } = {}) {
  return new Promise((resolve) => {
    const command = spawn(ex, args);
    command.on('error', (e) => {
      console.error('Command failed', e);
    });
    command.stdout.on('data', (data) => {
      if (!quiet) {
        console.log(`stdout: ${data}`);
      }
    });

    command.stderr.on('data', (data) => {
      if (!quiet) {
        console.log(`stderr: ${data}`);
      }
    });

    command.on('close', (code) => {
      if (!quiet) {
        console.log(`command "${ex} ${args.join(' ')}" exited with code ${code}`);
      }
      resolve(code);
    });
  });
}

/**
 * @param {string} url
 * @returns {Promise<any>}
 */
async function openBrowser(url) {
  const open = (await import('open')).default;
  return open(url);
}

/**
 *
 * @param {string} postfix
 * @returns
 */
function getPackagePath(postfix = '') {
  return path.normalize(`${HOME_DIR}/.${PACKAGE_NAME}/${postfix}`);
}

/**
 *
 * @param {string} title
 */
function stdoutWriteStart(title) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(title);
}

function getPackage() {
  const cwd = process.cwd();
  return require(path.resolve(cwd, 'package.json'));
}

function getTmpArchive() {
  return path.resolve(tmpdir(), `${PACKAGE_NAME}_${getPackage().name}.tgz`);
}

/**
 *
 * @returns {string}
 */
function getConfigFilePath() {
  let fileYml = path.resolve(CWD, `${PACKAGE_NAME}.yaml`);
  if (!existsSync(fileYml)) {
    fileYml = fileYml.replace(/yaml$/, 'yml');
  }
  return fileYml;
}

module.exports = {
  openBrowser,
  getPackagePath,
  console,
  getPackage,
  getTmpArchive,
  stdoutWriteStart,
  getConfigFilePath,
};
