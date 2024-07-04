// @ts-check
import { Command } from 'commander';
import fs from 'fs';
import { PACKAGE_VERSION, PACKAGE_NAME } from './utils/constants.js';
import Login from './core/login.js';
import Deploy from './core/deploy.js';
import { getPackagePath, console } from './utils/lib.js';
import Init from './core/init.js';
import Logs from './core/logs.js';

const packageHomeDir = getPackagePath();
if (!fs.existsSync(packageHomeDir)) {
  fs.mkdirSync(packageHomeDir);
}

console.info(`Starting "${PACKAGE_NAME}" v${PACKAGE_VERSION} ...`, '');
console.info('Package data dir:', packageHomeDir);

const program = new Command();

program.configureOutput({
  writeErr: (str) => {
    if (/^Usage:/.test(str)) {
      console.warn('Wrong command\n', str);
    } else {
      console.error(str.replace('error: ', '').replace('\n', ''), '');
    }
  },
});

program
  .enablePositionalOptions()
  .usage(`[options] <command> [options]`)
  .name(PACKAGE_NAME)
  .version(PACKAGE_VERSION, '-v, --version')
  .description('Hosting client');

program
  .command('login')
  .usage(`[options] <command> [options]`)
  .description('Login via browser')
  .option('-c, --crypt', 'encrypt session token with password')
  .option('-r, --remove', 'remove session token from this device')
  .action(async (options) => {
    new Login({ ...options, isLogin: true });
  });

program
  .command('deploy')
  .description('Upload files and run app in cloud')
  .option('-c, --clear-cache', 'Clear cache before upload to upload all files')
  .action(async (options) => {
    new Deploy(options);
  });

program
  .command('logs')
  .usage(`[options] <service_name> [options]`)
  .description('Show logs of the service')
  .option('-f, --follow', 'Looking forward to the next logs')
  .option('-t, --timestamps', 'Show timestamps')
  .option('-c, --clear', 'Clear service logs')
  .option(
    '--since <time>',
    'Show logs since timestamp (e.g. 2013-01-02T13:23:37Z) or relative (e.g. 42m for 42 minutes)'
  )
  .option(
    '--until <time>',
    'Show logs before a timestamp (e.g. 2013-01-02T13:23:37Z) or relative (e.g. 42m for 42 minutes)'
  )
  .option('-n, --tail <number_of_lines>', 'Number of lines to show from the end of the logs')
  .argument('<service_name>', 'The name of target service')
  .action(async (arg, options) => {
    new Logs(options, arg);
  });

program
  .command('init')
  .usage(`[options] <command> [options]`)
  .description('Set up project configuration')
  .option('-y, --yes', 'default for all')
  .action(async (options) => {
    new Init(options);
  });
program.parse();
