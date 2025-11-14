import Fastify from 'fastify';
import { routes } from "routes";

const fastify = Fastify();

const start = async () => {
  fastify.addHook("onRequest", (request, reply, done) => {
    reply.header('Access-Control-Allow-Origin', '*');
    // 允许的请求方法
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    // 允许的请求头
    reply.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    if (request.method === 'OPTIONS') {
      reply.status(204).send();
      return;
    }
    done();
  });
  fastify.register(import('@fastify/multipart'), {
    limits: {
      fieldNameSize: 200,
      fieldSize: 20480,
      fields: 10,
      fileSize: 4 * 1024 * 1024 * 1024,
      files: 9,
      headerPairs: 2000,
      parts: 1000
    }
  });
  routes.forEach(r => fastify.route(r));

  fastify.listen({ port: +process.env.HTTP_PORT, host: '0.0.0.0' }, (err, address) => {
    console.log(`server listening on ${address}`);
    
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  });
};

start();