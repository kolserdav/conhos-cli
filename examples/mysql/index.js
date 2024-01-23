import http from 'http';
import mysql from 'mysql2';

// Create a local server to receive data from
const server = http.createServer(async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  console.info('Request', req.headers);

  let result = null;

  const client = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  await new Promise((resolve, reject) => {
    client.connect(function (err) {
      if (err) {
        reject(err);
      }
      resolve('Connected!');
    });
  }).catch((err) => {
    console.error('Failed to connect mysql', err);
    return 1;
  });

  result = await new Promise((resolve, reject) => {
    client.query('SELECT TABLE_NAME FROM information_schema.tables', function (err, result) {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  }).catch((err) => {
    console.error('Failed to mysql query', err);
  });

  await new Promise((resolve, reject) => {
    client.end((err) => {
      if (err) {
        reject(err);
      }
      resolve(0);
    });
  }).catch((err) => {
    console.error('Failed to close mysql connection', err);
  });

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
