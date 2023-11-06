const dotenv = require('dotenv');
const os = require('os');
const pack = require('../../package.json');

/**
 * @typedef {import('../types/interfaces').ServiceSize} ServiceSize
 */

dotenv.config();
const LOGIN_PAGE = process.env.LOGIN_PAGE || 'http://localhost:3000/account/sign-in';

const SERVER_ADDRESS = process.env.SERVER_ADDRESS || 'http://localhost:3001';

const WEBSOCKET_ADDRESS = process.env.WEBSOCKET_ADDRESS || 'http://localhost:3002';

const CRYPTO_PASSWORD = process.env.CRYPTO_PASSWORD || 'strong-string';

const CRYPTO_SALT = process.env.CRYPTO_SALT || 'strong-string';

const DEBUG = process.env.DEBUG === '1';

const CRYPTO_IV = process.env.CRYPTO_IV || 'string';

const LANG = 'en';
// deps app
const QUERY_STRING_CONN_ID = 'conn';

const HOME_DIR = os.homedir();
const CWD = process.cwd();
const PACKAGE_VERSION = pack.version;
const PACKAGE_NAME = pack.name;
const SESSION_FILE_NAME = 'auth';
const PACKAGES_DIR_NAME = 'packages';
/**
 * @type {ServiceSize}
 */
const SERVICE_SIZE_DEFAULT = 'micro';

const CURRENCY = 'RUB';
const INSTALL_COMMAND_DEFAULT = 'npm i';
const BUILD_COMMAND_DEFAULT = 'npm run build';
const START_COMMAND_DEFAULT = 'npm run start';
const CONFIG_EXCLUDE_DEFAULT = ['dist'];
const EXPLICIT_EXCLUDE = ['.git', '.vscode', 'node_modules'];
const SIZE_INDEX_DEFAULT = 3;

module.exports = {
  LOGIN_PAGE,
  WEBSOCKET_ADDRESS,
  LANG,
  QUERY_STRING_CONN_ID,
  CRYPTO_IV,
  CRYPTO_PASSWORD,
  CRYPTO_SALT,
  HOME_DIR,
  PACKAGE_NAME,
  PACKAGE_VERSION,
  SESSION_FILE_NAME,
  DEBUG,
  PACKAGES_DIR_NAME,
  SERVER_ADDRESS,
  CWD,
  SERVICE_SIZE_DEFAULT,
  CURRENCY,
  INSTALL_COMMAND_DEFAULT,
  BUILD_COMMAND_DEFAULT,
  START_COMMAND_DEFAULT,
  CONFIG_EXCLUDE_DEFAULT,
  EXPLICIT_EXCLUDE,
  SIZE_INDEX_DEFAULT,
};
