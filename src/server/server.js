import http2 from 'http2';
import Deploy from '../core/deploy.js';
import { readFileSync } from 'fs';
import Exec from '../core/exec.js';
import Logs from '../core/logs.js';
import Project from '../core/project.js';
import Service from '../core/service.js';
import { CLI_COMMANDS } from '../types/interfaces.js';

/**
 * @typedef {import('../types/interfaces.js').CliServerResponse} CliServerResponse
 * @typedef {import('../types/interfaces.js').CliServerRequestBody} CliServerRequestBody
 * @typedef {import('../types/interfaces.js').EmitterData} EmitterData
 * @typedef {import('conhos-vscode').Status} Status
 * @typedef {import('../connectors/ws.js').default} WS
 * @typedef {import('../types/interfaces.js').Options} Options
 */

export default class Server {
  /**
   * @private
   * @type {Options}
   */
  options;

  /**
   * @param {Options} options
   */
  constructor(options) {
    this.options = options;
    this.start();
  }

  /**
   *
   * @param {{
   *  res: http2.Http2ServerResponse<http2.Http2ServerRequest>;
   *  statusCode: http2.Http2ServerResponse<http2.Http2ServerRequest>['statusCode'];
   *  body: Omit<CliServerResponse, 'end'>
   * }} options
   */
  response({ res, body, statusCode }) {
    res.statusCode = statusCode;
    res.end(JSON.stringify({ ...body, end: 'end' }));
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

      /**
       * @type {WS | null}
       */
      let instance = null;
      const code = await new Promise((resolve) => {
        /**
         *
         * @param {EmitterData} data
         * @returns
         */
        const handler = (data) => {
          const { code } = data;
          if (code !== undefined) {
            if (instance) {
              closeConnection();
            } else {
              console.error('Instance not found in handler', '');
            }
            resolve(code);
            return;
          }
          this.write(res, { ...data, end: 'end' });
        };

        const closeConnection = () => {
          if (instance) {
            instance.console._eventEmitter.removeListener('message', handler);
          }
        };

        req.on('data', (chunk) => {
          const chunkStr = chunk.toString();
          /**
           * @type {CliServerRequestBody | null}
           */
          let body = null;
          try {
            body = JSON.parse(chunkStr);
          } catch (err) {
            console.error('Failed to parse body', err);
          }

          if (body === null) {
            return this.response({ res, body: { error: 'Bad request' }, statusCode: 400 });
          }

          const { command, cwd, options, argument, event } = body;
          if (!command) {
            return this.response({
              res,
              body: { error: 'Command property required in body' },
              statusCode: 400,
            });
          }

          /**
           * @type {keyof typeof CLI_COMMANDS}
           */
          let com = CLI_COMMANDS.deploy;
          switch (command) {
            case 'deploy':
              instance = new Deploy(options || {}, { withoutStart: true, cwd });
              com = CLI_COMMANDS.deploy;
              break;
            case 'exec':
              if (!event) {
                if (!argument) {
                  return this.response({
                    res,
                    body: { error: 'Argument property required for exec' },
                    statusCode: 400,
                  });
                }
                instance = new Exec(options || {}, { withoutStart: true, cwd }, argument);
              } else if (instance?.rl) {
                instance.rl.emit('line', event.command);
              }
              com = CLI_COMMANDS.exec;
              break;
            case 'logs':
              if (!argument) {
                return this.response({
                  res,
                  body: { error: 'Argument property required for logs' },
                  statusCode: 400,
                });
              }
              instance = new Logs(options || {}, { withoutStart: true, cwd }, argument);
              com = CLI_COMMANDS.logs;
              break;
            case 'project':
              instance = new Project(options || {}, { withoutStart: true, cwd });
              com = CLI_COMMANDS.project;
              break;
            case 'service':
              instance = new Service(options || {}, { withoutStart: true, cwd });
              com = CLI_COMMANDS.service;
              break;
            default:
              console.warn('Default case command', command);
          }

          if (instance && !event) {
            instance.console._eventEmitter.on('message', handler);
            instance.start(com);
          }
        });

        req.on('end', () => {
          closeConnection();
        });
      });

      return this.response({
        res,
        body: { message: code ? 'Error' : 'Success', code },
        statusCode: code ? 500 : 201,
      });
    });

    const PORT = 3000;

    server.on('error', (err) => {
      console.error('Server error:', err);
    });

    server.on('sessionError', (err) => {
      console.error('HTTP/2 session error:', err);
    });

    server.listen(PORT, () => {
      console.log(`Cli server running on http://localhost:${PORT}`);
    });
  }

  /**
   * @private
   * @param {http2.Http2ServerResponse<http2.Http2ServerRequest>} res
   * @param {CliServerResponse} data
   */
  write(res, data) {
    res.write(JSON.stringify(data) + '\n');
  }
}
