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
 * @typedef { 'build' | 'list' } RegistrySubcommand
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
      case 'list':
        this.list();
        break;
      default:
        this.console.warn('Default command not implement', this.subCommand);
    }
  }

  /**
   * @returns {Promise<void>}
   */

  async list() {
    const dockerConfig = readDockerConfig();
    if (!dockerConfig) {
      this.console.warn('Unauthorized', "Run 'conhos login' first");
      this.exit(1);
      return;
    }

    const registryOrigin = getRegistryOrigin();
    if (!dockerConfig.auths[registryOrigin]) {
      this.console.warn('Unauthorized', "Run 'conhos login' first");
      this.exit(1);
      return;
    }

    const authStr = Buffer.from(dockerConfig.auths[registryOrigin].auth, 'base64').toString(
      'utf-8'
    );
    const autArr = authStr.split(':');
    const username = autArr[0];
    const password = autArr[1];

    const auth = await this.auth({ username, password });
    if (auth.error) {
      this.console.error('Failed to auth in registry', auth.error);
      this.exit(1);
      return;
    }
    const res = await new Promise((resolve) => {
      fetch(`${getRegistryProxyOrigin()}/catalog?username=${username}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
        method: 'GET',
      })
        .then((r) => {
          return r.json();
        })
        .then((data) => {
          resolve(data);
        });
    });
    if (res.error) {
      this.console.error('Failed to get repositories', res.error);
      this.exit(1);
      return;
    }
    this.console.info('Repositories:', '', '');
    this.console.Log(`${res.repositories.join('\n')}`);
    this.exit(0);
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
    const tmpDir = tmpdir();
    const cacheDir = resolve(tmpDir, name);
    await mkdir(cacheDir, { recursive: true }).catch((err) => {
      this.console.error('Failed to create tmp dir for cache', err);
    });
    let command = [
      'buildx',
      'build',
      '-f',
      this.options.file || 'Dockerfile',
      '--platform',
      'linux/amd64',
      '--tag',
      `${registryUrl}/${this.userId}/${name}:latest`,
    ];
    if (this.options.cache) {
      command = command.concat([
        '--cache-from',
        `type=local,src=${this.options.cacheDir || cacheDir}`,
        '--cache-to',
        `type=local,dest=${this.options.cacheDir || cacheDir},mode=max`,
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
    } else {
      this.console.info('Successfully build and upload image', name);
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
