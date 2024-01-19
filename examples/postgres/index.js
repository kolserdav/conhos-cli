import http from 'http';
import { Client } from 'pg';
import { PORT_DEFAULT } from '../../src/types/interfaces.js';

const client = new Client({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  ssl: true,
});

(async () => {
  await client.connect();
  const res = await client.query('SELECT $1::text as connected', [
    'Connection to postgres successful!',
  ]);
  console.log(res.rows[0].connected);
  await client.end();
})();

// Create a local server to receive data from
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  console.info('Request', req.headers);
  res.end(
    JSON.stringify({
      data: 'Hello World!',
    })
  );
});

const port = process.env.PORT || PORT_DEFAULT;
server.listen(port, () => {
  console.log('Server is listenning at port', port);
});
