// @ts-check

const dotenv = require("dotenv");
const os = require("os");
const package = require("../package.json");

dotenv.config();
const LOGIN_PAGE =
  process.env.LOGIN_PAGE || "http://localhost:3000/account/sign-in";

const WEBSOCKET_ADDRESS =
  process.env.WEBSOCKET_ADDRESS || "http://localhost:3002";

const CRYPTO_PASSWORD = process.env.CRYPTO_PASSWORD || "strong-string";

const CRYPTO_SALT = process.env.CRYPTO_SALT || "strong-string";

/**
 * @type {0 | 1 | 2 | 3}
 */
const LOG_LEVEL_DEFAULT = 2;

const logLevel = parseInt(process.env.LOG_LEVEL || `${LOG_LEVEL_DEFAULT}`, 10);

const LOG_LEVEL = Number.isNaN(logLevel) ? LOG_LEVEL_DEFAULT : logLevel;

const CRYPTO_IV = process.env.CRYPTO_IV || "string";

const LANG = "en";
// deps app
const QUERY_STRING_CONN_ID = "conn";

const HOME_DIR = os.homedir();
const PACKAGE_VERSION = package.version;
const PACKAGE_NAME = package.name;
const SESSION_FILE_NAME = "auth";

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
  LOG_LEVEL,
};
