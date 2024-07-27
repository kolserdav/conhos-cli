import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {import('../types/interfaces.js').ServiceSize} ServiceSize
 * @typedef {'rust' | 'php'} NoCommandDefault
 * @typedef {Record<import('../types/interfaces.js').ServiceTypeCustom, string>} CommandDefault
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
/**
 * @type {CommandDefault}
 */
export const COMMAND_DEFAULT = {
  node: 'npm i && npm run start',
  python: 'pip install -r requirements.txt && python main.py',
  golang: 'go build -o main && ./main',
  php: 'php-fpm',
  rust: 'cargo build --release && ./target/release/main',
};
export const EXPLICIT_EXCLUDE = ['.git', '.vscode'];
/**
 * @type {Record<import('../types/interfaces.js').ServiceTypeCustom, string[]>}
 */
export const EXCLUDE_DEFAULT = {
  node: ['node_modules'],
  rust: ['target'],
  python: ['venv', '.venv'],
  golang: ['vendor'],
  php: ['vendor'],
};

export const SIZE_INDEX_DEFAULT = 3;
export const CACHE_FILE_NAME = '.cache.json';
export const CLOUD_LOG_PREFIX = '<cloud>';
export const UPLOAD_PERCENT_DIFF = 3;
export const UPLOAD_CHUNK_SIZE = 64 * 1024;
export const UPLOAD_SPEED_INTERVAL = 2000;
