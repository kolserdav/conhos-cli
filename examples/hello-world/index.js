import http from 'http';
import { PORT_DEFAULT } from '../../src/types/interfaces.js';

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