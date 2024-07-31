// @ts-check
import http from 'http';

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

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log('Server is listenning at port ', port);
});
