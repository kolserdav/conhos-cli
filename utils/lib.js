// @ts-check
const { spawn } = require("child_process");

/**
 * @typedef {number | null} StatusCode
 */

/**
 * @typedef {{
 *  test?: boolean
 * }} Options
 */

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

module.exports = { openBrowser };
