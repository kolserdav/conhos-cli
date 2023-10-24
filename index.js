// @ts-check
const { spawn, exec } = require("child_process");
const dotenv = require("dotenv");
const package = require("./package.json");

/**
 * @typedef {number | null} StatusCode
 */

/**
 * @typedef {{
 *  test?: boolean
 * }} Options
 */

dotenv.config();
const LOGIN_PAGE =
  process.env.LOGIN_PAGE || "http://localhost:3000/account/sign-in";

/**
 *
 * @param {Command} program
 * @returns {Options}
 */
function parseOpts(program) {
  return program.opts();
}

/**
 * @param {string} ex
 * @param {string[]} args
 * @returns {Promise<StatusCode>}
 */
async function execCommand(ex, args) {
  return new Promise((resolve) => {
    exec(`${ex} ${args.join(" ")}`, (error, stdout, stderr) => {
      console.log(1, error);
      console.log(2, stdout);
      console.log(3, stderr);
      resolve(error === null ? 0 : 1);
    });
  });
}

/**
 * @param {string} ex
 * @param {string[]} args
 * @param {{
 *  quiet?: boolean
 * }} options
 * @returns {Promise<StatusCode>}
 */
async function spawnCommand(ex, args, { quiet } = {}) {
  return new Promise((resolve) => {
    const command = spawn(ex, args);
    command.on("error", (e) => {
      console.error("Command failed", e);
    });
    command.stdout.on("data", (data) => {
      if (!quiet) {
        console.log(`stdout: ${data}`);
      }
    });

    command.stderr.on("data", (data) => {
      if (!quiet) {
        console.log(`stderr: ${data}`);
      }
    });

    command.on("close", (code) => {
      if (!quiet) {
        console.log(
          `command "${ex} ${args.join(" ")}" exited with code ${code}`
        );
      }
      resolve(code);
    });
  });
}

/**
 * @param {string} url
 * @returns {Promise<StatusCode>}
 */
async function openBrowser(url) {
  const start =
    process.platform == "darwin"
      ? "open"
      : process.platform == "win32"
      ? "start"
      : "xdg-open";
  return spawnCommand(start, [url]);
}

const { Command } = require("commander");
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
    openBrowser(LOGIN_PAGE);
  });
program.parse();

console.log(1, program.opts());
