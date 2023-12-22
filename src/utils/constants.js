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
export const LOGIN_PAGE = process.env.LOGIN_PAGE || 'http://localhost:3000/account/sign-in';

export const SERVER_ADDRESS = process.env.SERVER_ADDRESS || 'http://localhost:3001';

export const WEBSOCKET_ADDRESS = process.env.WEBSOCKET_ADDRESS || 'http://localhost:3002';

export const CRYPTO_PASSWORD = process.env.CRYPTO_PASSWORD || 'strong-string';

export const CRYPTO_SALT = process.env.CRYPTO_SALT || 'strong-string';

export const DEBUG = process.env.DEBUG === '1';

export const CRYPTO_IV = process.env.CRYPTO_IV || 'string';

export const LANG = 'en';
// deps app
export const QUERY_STRING_CONN_ID = 'conn';

export const HOME_DIR = os.homedir();
export const CWD = process.cwd();
export const PACKAGE_VERSION = pack.version;
export const PACKAGE_NAME = pack.name;
export const SESSION_FILE_NAME = 'auth';
export const PACKAGES_DIR_NAME = 'packages';
/**
 * @type {ServiceSize}
 */
export const SERVICE_SIZE_DEFAULT = 'micro';

export const CURRENCY = 'RUB';
export const COMMAND_DEFAULT = 'sh -c "echo Starting service... && npm install && npm run start"';
export const CONFIG_EXCLUDE_DEFAULT = ['dist'];
export const EXPLICIT_EXCLUDE = ['.git', '.vscode', 'node_modules'];
export const SIZE_INDEX_DEFAULT = 3;
