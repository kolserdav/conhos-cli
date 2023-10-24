// @ts-check
const { Command } = require("commander");
const { LOGIN_PAGE, WEBSOCKET_ADDRESS } = require("./utils/constants");
const package = require("./package.json");
const { openBrowser } = require("./utils/lib");
const WS = require("./utils/ws");

const program = new Command();
program
  .enablePositionalOptions()
  .usage(`[options] <command>`)
  .version(package.version, "-v, --version")
  .description("Hosting client");

program
  .command("login")
  .description("login via browser")
  .action(async (options) => {
    const ws = new WS(WEBSOCKET_ADDRESS, "login");
    openBrowser(LOGIN_PAGE);
  });
program.parse();
