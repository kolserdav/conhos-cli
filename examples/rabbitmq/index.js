// @ts-check
import amqplib from 'amqplib';
import http from 'http';

const host = 'RABBITMQ0_HOST';
const queue = 'tasks';

(async () => {
  const conn = await amqplib.connect(
    `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASS}@${process.env[host]}:5672`
  );

  const ch1 = await conn.createChannel();
  await ch1.assertQueue(queue);

  // Listener
  ch1.consume(queue, (msg) => {
    if (msg !== null) {
      console.log('Received:', msg.content.toString());
      ch1.ack(msg);
    } else {
      console.log('Consumer cancelled by server');
    }
  });

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    console.info('Request', req.headers);
    ch1.sendToQueue(queue, Buffer.from(JSON.stringify({ hello: 'World' })));
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
})();
