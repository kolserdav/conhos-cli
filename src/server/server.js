import http from 'http';
process.env.IS_SERVER = 'true';
import Deploy from '../core/deploy.js';

/**
 * @typedef {import('../connectors/ws.js').Options} Options
 * @typedef {{
 *    error?: string;
 *    message?: string;
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
   *  res: http.ServerResponse<http.IncomingMessage> & {
   *   req: http.IncomingMessage;
   *  };
   *  statusCode: http.ServerResponse<http.IncomingMessage>['statusCode'];
   *  body: ResponseBody
   * }} options
   */
  response({ res, body, statusCode }) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  }

  /**
   * @private
   */
  async start() {
    const server = http.createServer(async (req, res) => {
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
       *
       * @param {string | number | null | undefined} code
       * @returns {never}
       */
      function exit(code) {
        /**
         * @type {never}
         */
        // @ts-ignore
        const nev = 0;
        return nev;
      }
      process.exit = exit;

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

      switch (command) {
        case 'deploy':
          const dep = new Deploy({ ssl: true, interractive: false }, true);
          dep.console._eventEmitter.on('message', (d) => {
            console.log(1, d);
          });
          dep.start();
          break;
        default:
          console.warn('Default case command', command);
      }

      await new Promise(() => {
        setInterval(() => {}, 1000);
      });

      return this.response({ res, body: { message: 'Hello World!' }, statusCode: 200 });
    });

    const PORT = 3000;

    server.listen(PORT, () => {
      console.log(`Cli server running on http://localhost:${PORT}`);
    });
  }
}

new Server();
