import Console from 'console';
import WS from '../connectors/ws.js';
import {
  console,
  exit,
  getRegistryAuthOrigin,
  getRegistryOrigin,
  getRegistryProxyOrigin,
  readDockerConfig,
} from '../utils/lib.js';

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

/**
 * @typedef {import('../connectors/ws.js').Options} Options
 */

export default class Registry extends WS {
  /**
   * @param {import('../connectors/ws.js').Options} options
   */
  constructor(options) {
    super(options);

    if (this.options.list) {
      this.list();
    }
  }

  /**
   * @public
   */
  listener() {}

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
    }
    console.info('Repositories:', '', '');
    Console.log(`${res.repositories.join('\n')}`);
    exit(0);
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
