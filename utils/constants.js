const dotenv = require("dotenv");

dotenv.config();
const LOGIN_PAGE =
  process.env.LOGIN_PAGE || "http://localhost:3000/account/sign-in";

const WEBSOCKET_ADDRESS =
  process.env.WEBSOCKET_ADDRESS || "http://localhost:3002";

const LANG = "en";

module.exports = { LOGIN_PAGE, WEBSOCKET_ADDRESS, LANG };
