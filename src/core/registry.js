import WS, { WSInterface } from '../connectors/ws.js';
import { console, exit, getRegistryAuthOrigin, getRegistryOrigin } from '../utils/lib.js';

/**
 * @typedef {{
 *  errors: {
 *    code: string;
 *    message: string;
 *    detail: {
 *      Type: string;
 *      Class: string;
 *      Name: string;
 *      Action: string;
 *    }[]
 *  }[]
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
      this.list().then((res) => {
        console.info(43, res);
      });
    }
  }

  /**
   * @public
   */
  listener() {}

  /**
   * @returns {Promise<RegistryResponse>}
   */
  async list() {
    const res = await this.auth();
    if (res.error) {
      console.error('Failed to auth in registry', res.error);
      exit(1);
    }
    console.info(res.token);
    return new Promise((resolve) => {
      const username = 'ccf92e82-c695-4c6e-8120-85261fc75eaa';
      fetch(`${getRegistryOrigin()}/v2/_catalog?prefix=${username}`, {
        headers: {
          Authorization: `Bearer ${res.token}`,
        },
      })
        .then((r) => {
          console.info('headers', 'd', r);
          return r.json();
        })
        .then((data) => {
          resolve(data);
        });
    });
  }

  /**
   * @returns {Promise<RegistryAuthResponse>}
   */
  async auth() {
    const params = new URLSearchParams();
    const username = 'ccf92e82-c695-4c6e-8120-85261fc75eaa';
    params.set('service', 'docker-registry');
    params.set('username', username);
    params.set(
      'password',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNjZjkyZTgyLWM2OTUtNGM2ZS04MTIwLTg1MjYxZmM3NWVhYSIsInBhc3N3b3JkIjoidGtXaFlLaXpYL2JJN0ZIR3pJbVdycllBUzF3QkFwUEJkR1pibEFVSC9KUXl1c05sbU1tNFRqeXNKOVFvbWRxNEZidTUyWXBBQnFBcXpzWDVyNkt2ckE9PSIsImlhdCI6MTc1NTA5MzMzN30.lyH5VbSN4aIb3IlNFOvcIwEWc6bs6hzsk-KN9k4UU_I'
    );
    params.set('scope', `registry:catalog:*`);

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
