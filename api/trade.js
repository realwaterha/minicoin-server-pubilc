async function trade_routes(fastify, option) {
    /**
     * @returns coin_name, coin_ea, coin_leverage, avg_order_price, sum_order
     */
    fastify.get('/trade/coin/list/:user_id', { onRequest: [fastify.authorization] }, async(request, reply) => {
        const data = request.params.user_id;
    
        const mariaDatabase = fastify.mariadb;
        const connection = await mariaDatabase.getConnection();
    
        const res = await mariaDatabase.query(
            fastify.queryManager.selectMyCoinList,
            [data]
        );
    
        connection.release();

        reply.status(200).send({
            ok: true,
            data: res
        });
     });

    /**
     * @returns trade_sysdate, coin_name, type_option, coin_ea, order_price, sum_order
     */
    fastify.get('/trade/coin/transactions/:user_id', { onRequest: [fastify.authorization] }, async(request, reply) => {
        const data = request.params.user_id;
    
        const mariaDatabase = fastify.mariadb;
        const connection = await mariaDatabase.getConnection();
    
        const res = await mariaDatabase.query(
            fastify.queryManager.selectUserTransactions,
            [data]
        );
    
        connection.release();
        
        reply.status(200).send({
            ok: true,
            data: res
        });
     });

    /**
     * @field trade_info, user_id, coin_name, coin_leverage, coin_ea, order_price, sum_order, type_option, done
     * @params user_id, coin_name, coin_leverage, order_price, sum_order, type_option
     * @return changeCash
     */
    fastify.post('/trade/coin/buy', { onRequest: [fastify.authorization] }, async(request, reply) => {
        const data = request.body;

        var message = {
            ok: true,
            status: 200,
            changeCash: null
        }

        if(data.type_option != 'buy') message.status = 400;
        
        const cryptoHash = {
            trade_info: fastify.crypto.createHash('sha256').update(new Date() + data.user_id + data.coin_name + data.type_option).digest('hex')
        }

        const mariaDatabase = fastify.mariadb;
        const connection = await mariaDatabase.getConnection();

        const selectAccount = await mariaDatabase.query(
            fastify.queryManager.selectAccountCash,
            data.user_id
        );

        if(selectAccount[0].account_cash < data.sum_order) message.status = 400;

        if(message.status != 400) {
            const coin_ea = data.sum_order / data.order_price;
            message.changeCash = selectAccount[0]?.account_cash - data.sum_order;
    
            await Promise.all([
                mariaDatabase.query(
                    fastify.queryManager.updateSetCash,
                    [message.changeCash, data.user_id]
                ),
    
                mariaDatabase.query(
                    fastify.queryManager.insertNewTrade,
                    [cryptoHash.trade_info, data.user_id, data.coin_name, data.coin_leverage, coin_ea, data.order_price, data.sum_order, data.type_option, 0]
                )
            ]);
        } else message.ok = false;

        connection.release();

        reply.status(message.status).send({
            ok: message.ok,
            data: message.changeCash
        });
    });

    /**
     * @field trade_info, user_id, coin_name, coin_leverage, coin_ea, order_price, sum_order, type_option, done
     * @params user_id, coin_name, coin_leverage, order_price, coin_ea, type_option
     * @return changeCash
     */
    fastify.post('/trade/coin/sell', { onRequest: [fastify.authorization] },async(request, reply) => {
        const data = request.body;

        var message = {
            ok: true,
            status: 200,
            changeCash: null
        }

        if(data.type_option != 'sell') message.status = 400;

        const cryptoHash = {
            trade_info: fastify.crypto.createHash('sha256').update(new Date() + data.user_id + data.coin_name + data.type_option).digest('hex')
        }

        const mariaDatabase = fastify.mariadb;
        const connection = await mariaDatabase.getConnection();
        
        const selectCashCoin = await mariaDatabase.query(
            fastify.queryManager.selectSumCashCoinEa,
            [data.user_id, data.coin_name]
        );

        const exchangeCash = Math.trunc(data.order_price * selectCashCoin[0]?.coin_ea);
        message.changeCash = selectCashCoin[0]?.account_cash + exchangeCash;

        if(message.status != 400) {
            await Promise.all([
                mariaDatabase.query(
                    fastify.queryManager.updateSetCash,
                    [message.changeCash, data.user_id]
                ),
    
                mariaDatabase.query(
                    fastify.queryManager.updateSetTradeDone,
                    [data.user_id, data.coin_name]
                ),
    
                mariaDatabase.query(
                    fastify.queryManager.insertNewTrade,
                    [cryptoHash.trade_info, data.user_id, data.coin_name, data.coin_leverage, selectCashCoin[0].coin_ea, data.order_price, exchangeCash, data.type_option, 1]
                )
            ]);
        } else message.ok = false;

        connection.release();

        reply.status(message.status).send({
            ok: message.ok,
            data: message.changeCash
        });
     });
 }

module.exports = trade_routes;