const webSocket = require('ws');
const upbit_config = require('./upbit_config.json');

/** UPbit WebSocket module */
const ws = new webSocket('wss://api.upbit.com/websocket/v1');
ws.on('open', () => {
    const option = [
        {
          "ticket": upbit_config.TICKET
        },
        {
          "type": "ticker",
          "codes": [
            "KRW-BTC", "KRW-ETH", "KRW-XRP", "KRW-ADA", "KRW-DOGE"
          ]
        },
        {
          "format": "DEFAULT"
        }
      ]
    ; 
    ws.send(JSON.stringify(option));
});
/** */

async function socket_routes(fastify, option) {
  fastify.ready().then(() => {
    fastify.io.setMaxListeners(upbit_config.UPBIT_MAX_LISTENERS);
    fastify.io.on('connection', async(socket) => {
      socket.emit('ok', true);
    });
    ws.on('message', (data) => {
      const res = JSON.parse(data.toString());
      fastify.io.emit('coin-data', res);
    });
  });
}

module.exports = socket_routes;