// @ts-check
const { Command } = require('commander');
const fs = require('fs');
const { PACKAGE_VERSION, PACKAGE_NAME } = require('./utils/constants');

const Login = require('./core/login');
const Deploy = require('./core/deploy');
const { getPackagePath, console } = require('./utils/lib');
const Init = require('./core/init');

const packageHomeDir = getPackagePath();
if (!fs.existsSync(packageHomeDir)) {
  fs.mkdirSync(packageHomeDir);
}

console.info(`Starting "${PACKAGE_NAME}" v${PACKAGE_VERSION} ...`);
console.info('Package data dir:', packageHomeDir, '\n');

const program = new Command();

program
  .enablePositionalOptions()
  .usage(`[options] <command>`)
  .name(PACKAGE_NAME)
  .version(PACKAGE_VERSION, '-v, --version')
  .description('Hosting client');

program
  .command('login')
  .description('Login via browser')
  .option('-c, --crypt', 'encrypt session token with password')
  .option('-r, --remove', 'remove session token from this device')
  .action(async (options) => {
    new Login(options);
  });

program
  .command('deploy')
  .description('Upload files and run app in cloud')
  .action(async (options) => {
    new Deploy(options);
  });

program
  .command('init')
  .description('Set up project configuration')
  .option('-y, --yes', 'default for all')
  .action(async (options) => {
    new Init(options);
  });
program.parse();
