'use strict'

const fastify = require('fastify')({
    exposeHeadRoutes: true,
    logger: true
});

/** config */
const server_config = require('./server_config.json');
const database_config = require('./database/database_config.json');
/** */

/** decorate */
const queryLoader = require('./utils/queryLoader');
const queryManager = queryLoader('./database/queries.sql');
fastify.decorate('queryManager', queryManager);
fastify.decorate('crypto', require('crypto'));
fastify.decorate('accessKey', {
  userSign: server_config.USER_SIGN_KEY,
  accountAddress: server_config.ACCOUNT_ADDRESS_KEY
});

const jwtOption = require('./utils/jwt');
fastify.decorate('jwtOption', jwtOption);
fastify.decorate('authorization', async(request, reply) => {
    await request.jwtVerify();
});
/** */

/** module plug-in */
fastify.register(require('@fastify/cors'), {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
});

fastify.register(require('fastify-mariadb'), {
  promise: true,
  connectionString: database_config.CONNECTION_STRING,
  connectionLimit: database_config.CONNECTION_POOL
});

fastify.register(require('fastify-socket.io'), {
  cors: {
    origin: "*"
  }
});

fastify.register(require('@fastify/jwt'), {
  secret: server_config.JWT_TOKEN_SECRET_KEY
});
/** */

/** api plug-in */
fastify.register(require('./api/user'));
fastify.register(require('./api/account'));
fastify.register(require('./api/trade'));
fastify.register(require('./api/asset'));
fastify.register(require('./socket.io/init'));
/** */

fastify.get('/', async(request, reply) => {
  reply.status(200).send({ ok: true });
})

fastify.setErrorHandler(function(error, request, reply) {
  if(error) {
    switch(error.statusCode) {
      case 401:
        reply.status(401).send({ ok: false });
        break;
      default:
        reply.status(500).send({ ok: false });
    }
  }
});

fastify.listen({ port: server_config.PORT, host: server_config.HOST }, function(error, address) {
  if (error) {
    fastify.log.error(error);
    process.exit(1);
  }
});