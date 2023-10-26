// @ts-check
const { Command } = require("commander");
const fs = require("fs");
const {
  WEBSOCKET_ADDRESS,
  PACKAGE_VERSION,
  PACKAGE_NAME,
} = require("./utils/constants");

const WS = require("./utils/ws");
const { getPackagePath, readUserValue, console } = require("./utils/lib");

const packageHomeDir = getPackagePath();
if (!fs.existsSync(packageHomeDir)) {
  fs.mkdirSync(packageHomeDir);
}

console.info(`Starting "${PACKAGE_NAME}" v${PACKAGE_VERSION} ...`);
console.info("Package data path:", packageHomeDir, "\n");

const program = new Command();

program
  .enablePositionalOptions()
  .usage(`[options] <command>`)
  .name(PACKAGE_NAME)
  .version(PACKAGE_VERSION, "-v, --version")
  .description("Hosting client");

program
  .command("login")
  .description("login via browser")
  .option("-c, --crypt", "encrypt session token with password")
  .action(async (options) => {
    new WS(WEBSOCKET_ADDRESS, "login", {
      crypt: options.crypt,
    });
  });
program.parse();
