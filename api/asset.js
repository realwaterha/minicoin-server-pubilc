async function asset_routes(fastify, options) {
    /**
     * @return sum_order
     */
    fastify.get('/asset/sum/:user_id', { onRequest: [fastify.authorization] }, async(request, reply) => {
        const data = request.params.user_id;
        
        const mariaDatabase = fastify.mariadb;
        const connection = await mariaDatabase.getConnection();
        
        var res = await mariaDatabase.query(
            fastify.queryManager.selectSumAsset,
            [data]
        );

        connection.release();

        if(res[0]?.sum_order == null) res = null;
        
        reply.status(200).send({
            ok: true,
            data: res});
    });

    /**
     * @returns rank, user_name, total_cash
     */
    fastify.get('/asset/rank', async(request, reply) => {   
        const mariaDatabase = fastify.mariadb;
        const connection = await mariaDatabase.getConnection();
        
        const res = await mariaDatabase.query(
            fastify.queryManager.selectUserRank
        );
        
        connection.release();

        reply.status(200).send({
            ok: true,
            data: res
        });
    });
}

module.exports = asset_routes;