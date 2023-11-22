async function account_routes(fastify, option) {
    /**
     * @return account_cash
     */
    fastify.get('/account/cash/:user_id', { onRequest: [fastify.authorization] }, async(request, reply) => {
        const data = request.params.user_id;

        const mariaDatabase = fastify.mariadb;
        const connection = await mariaDatabase.getConnection();

        const res = await mariaDatabase.query(
            fastify.queryManager.selectAccountCash,
            [data]
        );

        connection.release();
        
        reply.status(200).send({
            ok: true,
            data: res[0]?.account_cash
        });
    });
}

module.exports = account_routes;