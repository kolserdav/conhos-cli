import http from 'http';
import { PORT_DEFAULT } from '../../src/types/interfaces.js';
import { createClient } from 'redis';

const REDIS_HELLO_NAME = 'REDIS_HELLO_NAME';

const redis = createClient({
  socket: { host: process.env.REDIS_HOST },
});

(async () => {
  await redis.connect();
  await redis.set(REDIS_HELLO_NAME, `Value from Redis by key ${REDIS_HELLO_NAME}`);
  await redis.disconnect();
})();

// Create a local server to receive data from
const server = http.createServer(async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  console.info('Request', req.headers);

  // Get value from redis
  await redis.connect();
  const data = await redis.get(REDIS_HELLO_NAME);
  await redis.disconnect();
  res.end(
    JSON.stringify({
      data,
    })
  );
});

const port = process.env.PORT || PORT_DEFAULT;
server.listen(port, () => {
  console.log('Server is listenning at port', port);
});
