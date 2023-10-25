// @ts-check
const { Command } = require("commander");
const fs = require("fs");
const {
  WEBSOCKET_ADDRESS,
  PACKAGE_VERSION,
  PACKAGE_NAME,
  SESSION_FILE_NAME,
} = require("./utils/constants");

const WS = require("./utils/ws");
const { getPackagePath, readUserValue } = require("./utils/lib");

const packageHomeDir = getPackagePath();
if (!fs.existsSync(packageHomeDir)) {
  fs.mkdirSync(packageHomeDir);
}

console.log(packageHomeDir);

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
  .option("-c, --crypt", "encrypt your session with password")
  .action(async (options) => {
    const ws = new WS(WEBSOCKET_ADDRESS, "login", {
      crypt: options.crypt,
    });
  });
program.parse();
