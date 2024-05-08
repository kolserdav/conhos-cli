import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {import('../types/interfaces.js').ServiceSize} ServiceSize
 */

const packStr = readFileSync(path.resolve(__dirname, '../../package.json')).toString();
const pack = JSON.parse(packStr);

dotenv.config();
export const LOGIN_PAGE = process.env.LOGIN_PAGE || 'https://conhos.ru/account/sign-in';
if (process.env.LOGIN_PAGE) {
  console.warn(
    'warn',
    'Default login page address have changed by LOGIN_PAGE to:',
    process.env.LOGIN_PAGE
  );
}

export const SERVER_ADDRESS = process.env.SERVER_ADDRESS || 'https://server.conhos.ru';
if (process.env.SERVER_ADDRESS) {
  console.warn(
    'warn',
    'Default server address have changed by SERVER_ADDRESS to:',
    process.env.SERVER_ADDRESS
  );
}

export const CRYPTO_PASSWORD = process.env.CRYPTO_PASSWORD || 'strong-string';

export const CRYPTO_SALT = process.env.CRYPTO_SALT || 'strong-string';

export const DEBUG = process.env.DEBUG === '1';

export const CRYPTO_IV = process.env.CRYPTO_IV || 'string';

/**
 * @borrows app
 */
export const QUERY_STRING_CONN_ID = 'conn';

export const HOME_DIR = os.homedir();
export const CWD = process.cwd();
export const PACKAGE_VERSION = pack.version;
export const PACKAGE_NAME = pack.name;
export const CONFIG_FILE_NAME = `${PACKAGE_NAME}.yml`;
export const CONFIG_FILE_NAME_A = `${PACKAGE_NAME}.yaml`;
export const SESSION_FILE_NAME = 'auth';
export const PACKAGES_DIR_NAME = 'packages';
/**
 * @type {ServiceSize}
 */
export const SERVICE_SIZE_DEFAULT = 'micro';

export const CURRENCY = 'RUB';
export const COMMAND_DEFAULT = 'cd examples/hello-world && npm i && npm run start';
export const EXPLICIT_EXCLUDE = ['.git', '.vscode'];
export const EXCLUDE_NODE = ['node_modules'];
export const EXCLUDE_RUST = ['target'];
export const SIZE_INDEX_DEFAULT = 3;
export const CACHE_FILE_NAME = '.cache.json';
