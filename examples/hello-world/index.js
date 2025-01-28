// @ts-check
import http from 'http';

// Create a local server to receive data from
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  console.info('Request', req.headers);
  if (req.url === '/ds') {
    process.exit(0);
  }
  res.end(
    JSON.stringify({
      data: 'Hello World 48!',
    })
  );
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log('Server is listenning at port ', port);
});
