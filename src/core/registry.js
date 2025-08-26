import Console from 'console';
import chalk from 'chalk';
import WS from '../connectors/ws.js';
import {
  console,
  exit,
  getRegistryAuthOrigin,
  getRegistryOrigin,
  getRegistryProxyOrigin,
  readDockerConfig,
  parseMessageCli,
  getRegistryDomain,
} from '../utils/lib.js';
import { spawn } from 'child_process';

/**
 * @typedef {import("../connectors/ws.js").Options} Options
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
 */

export default class Registry extends WS {
  /**
   * @param {import('../connectors/ws.js').Options} options
   */
  constructor(options) {
    super(options);
    this.checkOptions();
  }

  /**
   * @private
   */
  checkOptions() {
    if (!this.options.list && !this.options.build) {
      console.warn('One of options are required', '--build | --list');
      exit(2);
      return;
    }
    if (this.options.build && this.options.list) {
      console.warn('Two options are not allowed to use together', '--build & --list');
      exit(2);
      return;
    }
    if (this.options.build && !this.options.name) {
      console.warn('Option "name" is required for build', '-n|--name [string]');
      exit(2);
      return;
    }
  }

  listener() {
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
      console.info('Session is no exists', 'Run "conhos login" first');
      exit(2);
      return;
    }
    if (this.options.list) {
      this.list();
    } else if (this.options.build) {
      this.build();
    }
  }

  /**
   * @returns {Promise<void>}
   */

  async list() {
    const dockerConfig = readDockerConfig();
    if (!dockerConfig) {
      console.warn('Unauthorized', "Run 'conhos login' first");
      exit(1);
      return;
    }

    const registryOrigin = getRegistryOrigin();
    if (!dockerConfig.auths[registryOrigin]) {
      console.warn('Unauthorized', "Run 'conhos login' first");
      exit(1);
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
      console.error('Failed to auth in registry', auth.error);
      exit(1);
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
      console.error('Failed to get repositories', res.error);
      exit(1);
      return;
    }
    console.info('Repositories:', '', '');
    Console.log(`${res.repositories.join('\n')}`);
    exit(0);
  }

  /**
   * @private
   */
  async build() {
    const registryUrl = getRegistryDomain();
    const { name } = this.options;
    const code = await new Promise((resolve) => {
      const cmd = spawn('docker', [
        'buildx',
        'build',
        '-f',
        'Dockerfile',
        '--platform',
        'linux/amd64',
        '--tag',
        `${registryUrl}/${this.userId}/${name}:latest`,
        '--cache-from',
        `type=registry,ref=${registryUrl}/${this.userId}/${name}:cache`,
        '--cache-to',
        `type=registry,ref=${registryUrl}/${this.userId}/${name}:cache,mode=max`,
        '--output',
        '"type=registry"',
        '.',
      ]);
      cmd.stdout.on('data', (d) => {
        const mess = d.toString().trim();
        if (mess) {
          Console.log(mess);
        }
      });

      cmd.stderr.on('data', (d) => {
        let mess = d.toString().trim();
        /**
         * @type {string[][]}
         */
        const errors = Array.from(mess.matchAll(/ERROR: (.+)/g));
        if (errors) {
          errors.forEach((item) => {
            item.forEach((_item) => {
              mess = mess.replace(_item, chalk.red(_item));
            });
          });
        }
        if (mess) {
          Console.warn(mess);
        }
      });

      cmd.on('error', (e) => {
        console.error('Failed to build image', e.message);
        exit(1);
      });

      cmd.on('exit', (code) => {
        resolve(code || 0);
      });
    });

    if (code !== 0) {
      console.warn('Build exit with non success code, see errors above', '');
    } else {
      console.info('Successfully build and upload image', name);
    }
    exit(code);
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
