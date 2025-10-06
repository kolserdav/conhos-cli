import http2 from 'http2';
process.env.IS_SERVER = 'true';
import Deploy from '../core/deploy.js';
import { readFileSync } from 'fs';

/**
 * @typedef {import('../utils/lib.js').EmitterData} EmitterData
 * @typedef {import('conhos-vscode').Status} Status
 * @typedef {import('../connectors/ws.js').default} WS
 * @typedef {import('../connectors/ws.js').Options} Options
 * @typedef {{
 *    error?: string;
 *    message?: string;
 *    code?: number;
 *  }} ResponseBody
 * @typedef {{
 *  command?: 'deploy' | 'logs' | 'exec'
 *  options: Options
 *  }} RequestBody
 */

class Server {
  constructor() {
    this.start();
  }

  /**
   *
   * @param {{
   *  res: http2.Http2ServerResponse<http2.Http2ServerRequest>;
   *  statusCode: http2.Http2ServerResponse<http2.Http2ServerRequest>['statusCode'];
   *  body: ResponseBody
   * }} options
   */
  response({ res, body, statusCode }) {
    res.statusCode = statusCode;
    res.end(JSON.stringify(body));
  }

  /**
   * @private
   */
  async start() {
    /**
     * @type {any}
     */
    const key = process.env.SSL_CERT_KEY;
    /**
     * @type {any}
     */
    const cert = process.env.SSL_CERT;
    const serverOptions = {
      key: readFileSync(key),
      cert: readFileSync(cert),
    };
    const server = http2.createSecureServer(serverOptions, async (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      if (req.method !== 'POST') {
        return this.response({ res, body: { error: 'Method not allowed' }, statusCode: 405 });
      }

      let bodyChunks = '';

      req.on('data', (chunk) => {
        bodyChunks += chunk.toString();
      });

      await new Promise((resolve) => {
        req.on('end', () => {
          resolve(0);
        });
      });

      /**
       * @type {RequestBody | null}
       */
      let body = null;
      try {
        body = JSON.parse(bodyChunks);
      } catch (err) {
        console.error('Failed to parse body', err);
      }
      if (body === null) {
        return this.response({ res, body: { error: 'Bad request' }, statusCode: 400 });
      }

      const { command } = body;
      if (!command) {
        return this.response({
          res,
          body: { error: 'Command property required in body' },
          statusCode: 400,
        });
      }

      /**
       * @type {WS | null}
       */
      let instance = null;

      switch (command) {
        case 'deploy':
          instance = new Deploy({ ssl: true, interractive: false }, true);
          break;
        default:
          console.warn('Default case command', command);
      }

      /**
       * @type {number | undefined}
       */
      let code = undefined;
      if (instance) {
        code = await new Promise((resolve) => {
          /**
           *
           * @param {EmitterData} data
           * @returns
           */
          const handler = (data) => {
            const { code } = data;
            if (code !== undefined) {
              instance.console._eventEmitter.removeListener('message', handler);
              resolve(code);
              return;
            }
            res.write(JSON.stringify(data) + '\n');
          };
          instance.console._eventEmitter.on('message', handler);
          instance.start();
        });
      }

      return this.response({
        res,
        body: { message: code ? 'Error' : 'Success', code },
        statusCode: code ? 500 : 201,
      });
    });

    const PORT = 3000;

    server.listen(PORT, () => {
      console.log(`Cli server running on http://localhost:${PORT}`);
    });
  }
}

new Server();
