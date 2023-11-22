async function user_routes(fastify, options) {
    /**
     * @returns user_id, user_name
     */
    fastify.get('/user/auth', { onRequest: [fastify.authorization] }, async(request, reply) => {
        reply.status(200).send({
            ok: true,
            data: request.user
        });
    });

    /**
     * @return user_id
     */
    fastify.get('/user/check/:user_id', async(request, reply) => {
        const data = request.params.user_id;

        const mariaDatabase = fastify.mariadb;
        const connection = await mariaDatabase.getConnection();

        const res = await mariaDatabase.query(
            fastify.queryManager.selectCheckUserId,
            [data]
        );

        connection.release();

        reply.status(200).send({
            ok: true,
            user_id: res[0]?.user_id
        });
    });

    /**
     * @params user_id, user_password
     * @return token
     */
    fastify.post('/user/signin', async(request, reply) => {
        const data = request.body;
        
        var message = {
            status: 200,
            ok: true,
            token: null
        }

        const cryptoHash = {
            userPassword: fastify.crypto.createHash('sha256').update(data.user_password + fastify.accessKey.userSign).digest('hex')
        }

        const mariaDatabase = fastify.mariadb;
        const connection = await mariaDatabase.getConnection();

        const userInfo = await mariaDatabase.query(
            fastify.queryManager.selectUserInfo,
            [data.user_id, cryptoHash.userPassword]
        );

        connection.release();

        await userInfo[0]? message.token = fastify.jwt.sign({
            user_id: userInfo[0].user_id,
            user_name: userInfo[0].user_name,
            exp: fastify.jwtOption.exp()
        }) : (
            message.status = 401,
            message.ok = false
        );

        reply.status(message.status).send({
            ok: message.ok,
            token: message.token
        });
    });

    /**
     * @params user_id, user_name, user_password
     */
    fastify.post('/user/signup', async(request, reply) => {
        const data = request.body;

        var message = {
            ok: true
        }

        const cryptoHash = {
            accountAddressKey: fastify.crypto.createHash('sha256').update(data.user_id + fastify.accessKey.accountAddress).digest('hex'),
            userPassword: fastify.crypto.createHash('sha256').update(data.user_password + fastify.accessKey.userSign).digest('hex')
        }

        const mariaDatabase = fastify.mariadb;
        const connection = await mariaDatabase.getConnection();

        const checkId = await mariaDatabase.query(
            fastify.queryManager.selectCheckUserId,
            [data.user_id]
        );

        if(!checkId[0]?.user_id) {
            await mariaDatabase.query(
                fastify.queryManager.insertUserInfo,
                [data.user_id, data.user_name, cryptoHash.userPassword]
            );
        
            await mariaDatabase.query(
                fastify.queryManager.insertNewAccount,
                [cryptoHash.accountAddressKey, data.user_id]
            );
        } else message.ok = false;

        connection.release();

        reply.status(200).send({ ok: message.ok });
    });
}

module.exports = user_routes;