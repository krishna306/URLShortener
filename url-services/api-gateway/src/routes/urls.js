const axios = require('axios');

const URL_SERVICE_URL = process.env.URL_SERVICE_URL;

module.exports = async function (app) {
    app.get('/', async (request, reply) => {
        try {
            const response = await axios.get(`${URL_SERVICE_URL}/urls`);
            return reply.code(response.status).send(response.data);
        } catch (error) {
            if (error.response) {
                return reply.code(error.response.status).send(error.response.data);
            }
            return reply.code(502).send({ error: 'url-service unavailable' });
        }
    });
};
