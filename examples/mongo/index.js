// @ts-check
import { MongoClient } from 'mongodb';
import http from 'http';

const host = 'MONGO0_HOST';
const dbName = 'admin';

// Create a local server to receive data from
const server = http.createServer(async (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  console.info('Request', req.headers);
  const url = `mongodb://${process.env[host]}:27017/${dbName}`;

  res.end(
    JSON.stringify({
      data: await getDocs(url),
    })
  );
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log('Server is listenning at port ', port);
});


/**
 * @param {string} url
 * @returns
 */
async function getDocs(url) {
  console.info('Connecting to mongo', url);
  const client = new MongoClient(url, {
    auth: {
      username: process.env.MONGO_USERNAME,
      password: process.env.MONGO_PASSWORD
    }
  });
  let error = '';
  await client.connect().catch((e) => {
    const mess = 'Failed to connect mongo';
    console.error(mess, e);
    error = `${mess}: ${e.message}`;
  });
  if (error) {
    return error;
  }
  console.log('Connected successfully to server');
  const db = client.db(dbName);
  const collection = db.collection('documents');

  await collection.insertOne({hello: 'World!'}).catch((e) => {
    const mess = 'Failed to insert'
    console.error(mess, e);
    error = `${mess}: ${e.message}`
  });
  if (error) {
    return error;
  }
  const res = await collection.find().toArray();
  await client.close();
  return res;
}
