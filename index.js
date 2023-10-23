// @ts-check
const { spawn } = require("child_process");
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
 * @param {string} exec
 * @param {string[]} args
 * @param {{
 *  quiet?: boolean
 * }} options
 * @returns {Promise<StatusCode>}
 */
async function spawnCommand(exec, args, { quiet } = {}) {
  return new Promise((resolve) => {
    const command = spawn(exec, args);
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
          `command "${exec} ${args.join(" ")}" exited with code ${code}`
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
  .description("Hosting client");

program
  .command("login")
  .description("login via browser")
  .action(async (options) => {
    console.log(2, options);
    await openBrowser(LOGIN_PAGE);
  });
program.parse();

console.log(1, parseOpts(program));
