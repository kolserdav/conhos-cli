import http from 'http';
import pkg from 'pg';
const { Client } = pkg;

// Create a local server to receive data from
const server = http.createServer(async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  console.info('Request', req.headers);

  let result = null;

  try {
    const client = new Client({
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    });
    await client.connect().catch((err) => {
      console.error('Failed to connect to database', err);
    });
    result = await client.query('SELECT $1::text as connected', [
      'Connection to postgres successful!',
    ]);
    await client.end();
  } catch (e) {
    console.error(e);
  }

  res.end(
    JSON.stringify({
      data: result,
    })
  );
});

const port = process.env.PORT;
server.listen(port, () => {
  console.log('Server is listenning at port', port);
});
