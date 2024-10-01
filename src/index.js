/******************************************************************************************
 * Repository: Conhos cli
 * File name: index.js
 * Author: Sergey Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Sun Sep 01 2024 13:12:51 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
// @ts-check
import { Command } from 'commander';
import fs from 'fs';
import { PACKAGE_VERSION, PACKAGE_NAME } from './utils/constants.js';
import Login from './core/login.js';
import Deploy from './core/deploy.js';
import { getPackagePath, console } from './utils/lib.js';
import Init from './core/init.js';
import Logs from './core/logs.js';
import IP from './core/ip.js';

process.on('SIGABRT', (sig) => {
  console.warn('Received abort signal', sig);
  process.exit(1);
});

process.on('SIGTERM', (sig) => {
  console.warn('Received term signal', sig);
  process.exit(1);
});

process.on('SIGTERM', (sig) => {
  console.warn('Received signal', sig);
  //process.exit(1);
});

const packageHomeDir = getPackagePath();
if (!fs.existsSync(packageHomeDir)) {
  fs.mkdirSync(packageHomeDir);
}

console.info(`Starting "${PACKAGE_NAME}" v${PACKAGE_VERSION} ...`, '');
console.log('Package data dir:', packageHomeDir);

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
  .usage('[options] <command> [options]')
  .name(PACKAGE_NAME)
  .version(PACKAGE_VERSION, '-v, --version')
  .description('Hosting client');

program
  .command('login')
  .usage('[options] <command> [options]')
  .description('Login via browser')
  .option('-c, --crypt', 'encrypt session token with password')
  .option('-r, --remove', 'remove session token from this device')
  .action(async (options) => {
    new Login({ ...options, isLogin: true });
  });

program
  .command('deploy')
  .description('Upload files and run app in cloud')
  .option(
    '--no-interractive',
    'If you are asked to confirm the deletion of the service, the script will automatically answer "yes"'
  )
  .option('-c, --clear-cache', 'Clear cache before upload to upload all files')
  .action(async (options) => {
    new Deploy(options);
  });

program
  .command('ip')
  .description('Get project node IP')
  .action(async (options) => {
    new IP(options);
  });

program
  .command('logs')
  .usage('[options] <service_name> [options]')
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
  .usage('[options] <command> [options]')
  .description('Set up project configuration')
  .option('-y, --yes', 'default for all')
  .action(async (options) => {
    new Init(options);
  });

program.parse();
