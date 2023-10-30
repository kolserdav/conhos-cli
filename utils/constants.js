// @ts-check

const dotenv = require("dotenv");
const os = require("os");
const pack = require("../package.json");

dotenv.config();
const LOGIN_PAGE =
  process.env.LOGIN_PAGE || "http://localhost:3000/account/sign-in";

const SERVER_ADDRESS = process.env.SERVER_ADDRESS || "http://localhost:3001";

const WEBSOCKET_ADDRESS =
  process.env.WEBSOCKET_ADDRESS || "http://localhost:3002";

const CRYPTO_PASSWORD = process.env.CRYPTO_PASSWORD || "strong-string";

const CRYPTO_SALT = process.env.CRYPTO_SALT || "strong-string";

const DEBUG = process.env.DEBUG === "1";

const CRYPTO_IV = process.env.CRYPTO_IV || "string";

const LANG = "en";
// deps app
const QUERY_STRING_CONN_ID = "conn";

const HOME_DIR = os.homedir();
const PACKAGE_VERSION = pack.version;
const PACKAGE_NAME = pack.name;
const SESSION_FILE_NAME = "auth";
const PACKAGES_DIR_NAME = "packages";

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
};
