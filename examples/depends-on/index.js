// @ts-check
import http from 'http';

// If this service depends on service 'node0'
const host = 'NODE0_HOST';
const url = `http://${process.env[host]}:3000`;

// Create a local server to receive data from
const server = http.createServer(async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  console.info('Request', req.headers);
  console.info('Send request to env host', host, url);
  const data = await new Promise((resolve) => {
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        console.info('Success request', d);
        resolve(d);
      })
      .catch((e) => {
        console.error('Failed to send request to', e);
      });
  });
  res.end(
    JSON.stringify({
      data,
    })
  );
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log('Server is listenning at port ', port);
});
