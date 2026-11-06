/******************************************************************************************
 * Repository: Conhos cli
 * File name: registry.js
 * Author: Sergei Kolmiller
 * Email: <kolserdav@conhos.ru>
 * License: MIT
 * License text: See LICENSE file
 * Copyright: kolserdav, All rights reserved (c)
 * Create Date: Fri Oct 23 2026 22:22:33 GMT+0700 (Krasnoyarsk Standard Time)
 ******************************************************************************************/
import chalk from 'chalk';
import WS from '../connectors/ws.js';
import {
  getRegistryAuthOrigin,
  getRegistryOrigin,
  getRegistryProxyOrigin,
  readDockerConfig,
  parseMessageCli,
  getRegistryDomain,
} from '../utils/lib.js';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { resolve } from 'path';
import { mkdir } from 'fs/promises';
import { CLI_COMMANDS } from '../types/interfaces.js';
import { PACKAGE_NAME, REGISTRY_DOMAIN } from '../utils/constants.js';

/**
 * @typedef {import('../connectors/ws.js').WSProps} WSProps
 * @typedef {import('../types/interfaces.js').Options} Options
 * @typedef {import('../types/interfaces.js').WSMessageDataCli} WSMessageDataCli
 * @typedef {import('conhos-vscode').Status} Status
 */

/**
 * @template {keyof WSMessageDataCli} T
 * @typedef {import('../types/interfaces.js').WSMessageCli<T>} WSMessageCli<T>
 */

/**
 * @typedef {{
 *  error: string;
 *  repositories: string[];
 * }} RegistryResponse
 */

/**
 * @typedef {{
 *   error?: string;
 *   token: string;
 *   access_token: string;
 *   expires_in: number;
 *   issued_at: string;
 * }} RegistryAuthResponse
 * @typedef { 'build'  } RegistrySubcommand
 */

export default class Registry extends WS {
  /**
   * @type {RegistrySubcommand | null}
   */
  subCommand = null;

  /**
   * @param {RegistrySubcommand | null} subCommand
   * @param {Options} options
   * @param {WSProps} props
   */
  constructor(subCommand, options, props) {
    super(options, CLI_COMMANDS.registry, props);
    this.subCommand = subCommand;
    this.checkOptions();
  }

  /**
   * @private
   */
  checkOptions() {
    if (this.subCommand === 'build' && !this.options.name) {
      this.console.warn('Option "name" is required for build', '-n|--name [string]');
      return this.exit(2);
      return;
    }
  }

  listener() {
    this.withoutCheck = true;
    if (!this.conn) {
      return;
    }
    const ws = this;
    this.conn.on('message', async (d) => {
      const rawMessage = /** @type {typeof parseMessageCli<any>} */ (parseMessageCli)(d.toString());
      if (rawMessage === null) {
        return;
      }
      const { type } = rawMessage;
      /**
       * @type {keyof WSMessageDataCli}
       */
      const _type = type;
      switch (_type) {
        default:
          await this.handleCommonMessages(rawMessage);
      }
    });
  }

  /**
   * @public
   * @type {WS['handler']}
   */
  handler({ sessionExists }) {
    if (!sessionExists) {
      this.console.info('Session is no exists', 'Run "conhos login" first');
      this.exit(2);
      return;
    }
    switch (this.subCommand) {
      case 'build':
        this.build();
        break;
      default:
        this.console.warn('Default command not implement', this.subCommand);
    }
  }

  /**
   * @private
   */
  async build() {
    const registryUrl = getRegistryDomain();
    const { name } = this.options;
    if (!name) {
      return;
    }

    this.console.info('Check registry token', '...');
    const dockerConfig = readDockerConfig();
    if (!dockerConfig) {
      this.console.warn('Docker config file is not exists', `Run '${PACKAGE_NAME} login' first`);
      this.exit(1);
      return;
    }
    if (!dockerConfig.auths) {
      this.console.warn(
        'Docker config file has wrong format',
        `Remove it and run '${PACKAGE_NAME} login' then`
      );
      this.exit(1);
      return;
    }
    const registryOrigin = getRegistryOrigin();
    if (!dockerConfig.auths[registryOrigin]) {
      this.console.warn(
        'Docker config file has no registry token',
        `Run '${PACKAGE_NAME} login' first`
      );
      this.exit(1);
      return;
    }
    if (!dockerConfig.auths[registryOrigin].auth) {
      this.console.warn(
        'Docker config file has wrong registry token section',
        `Run '${PACKAGE_NAME} login' first`
      );
      this.exit(1);
      return;
    }
    const token = atob(dockerConfig.auths[registryOrigin].auth).split(':');

    const loginCode = await new Promise((resolve) => {
      const cmd = spawn(
        'docker',
        ['login', REGISTRY_DOMAIN, '--username', token[0], '--password-stdin'],
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: {
            ...process.env,
            FORCE_COLOR: '1',
          },
        }
      );

      cmd.stdin.write(token[1]);
      cmd.stdin.end();

      cmd.on('error', (e) => {
        this.console.error('Failed to login docker', e.message);
        return this.exit(1);
      });

      cmd.on('close', (code) => {
        resolve(code);
      });
    });

    if (loginCode !== 0) {
      this.console.warn(
        `Registry token expired, open our Hub to authenticate via Conhos to refresh session`,
        getRegistryOrigin()
      );
      this.exit(1);
    }

    const tmpDir = tmpdir();
    const cacheDir = resolve(tmpDir, name);
    let command = [
      'buildx',
      'build',
      '-f',
      this.options.file || 'Dockerfile',
      '--platform',
      'linux/amd64',
      '--tag',
      `${registryUrl}/${this.userId}/${name}:${this.options.tag || 'latest'}`,
    ];
    this.console.info('Run command', command.join(' '));

    const cachePath = this.options.cacheDir || cacheDir;
    await mkdir(cachePath, { recursive: true }).catch((err) => {
      this.console.error('Failed to create tmp dir for cache', err);
    });

    if (this.options.cache) {
      command = command.concat([
        '--cache-from',
        `type=local,src=${cachePath}`,
        '--cache-to',
        `type=local,dest=${cachePath},mode=max`,
      ]);
    }
    command = command.concat(['--output', '"type=registry"', this.options.context || '.']);
    const code = await new Promise((resolve) => {
      const cmd = spawn('docker', command, {
        stdio: 'inherit',
        env: {
          ...process.env,
          FORCE_COLOR: '1',
        },
      });

      cmd.on('error', (e) => {
        this.console.error('Failed to build image', e.message);
        return this.exit(1);
      });

      cmd.on('close', (code) => {
        resolve(code);
      });
    });

    if (code !== 0) {
      this.console.warn('Build exit with non success code, see errors above', '');
      if (this.options.cache) {
        this.console.warn(
          'You use "cache" option, maybe you need to create "docker-container" engine builder first:',
          'docker buildx create --name cache-builder --driver docker-container --use'
        );
      }
    } else {
      this.console.info(
        `Successfully build and upload image '${name}'`,
        `${getRegistryOrigin()}/harbor/projects`
      );
    }
    return this.exit(code);
  }

  /**
   * @param {{
   *  username: string;
   *  password: string;
   * }} param0
   * @returns {Promise<RegistryAuthResponse>}
   */
  async auth({ username, password }) {
    const params = new URLSearchParams();
    params.set('service', 'docker-registry');
    params.set('username', username);
    params.set('password', password);
    params.set('scope', `registry:${username}/*:*`);

    return new Promise((resolve) => {
      fetch(`${getRegistryAuthOrigin()}/auth`, {
        method: 'POST',
        body: params,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      })
        .then((r) => r.json())
        .then((data) => {
          resolve(data);
        });
    });
  }
}
