const axios = require('axios');

const URL_SERVICE_URL = process.env.URL_SERVICE_URL;
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL;

module.exports = async function (app) {
    app.get('/:code/stats', async (request, reply) => {
        const shortCode = request.params.code;

        const [urlResult, analyticsResult] = await Promise.allSettled([
            axios.get(`${URL_SERVICE_URL}/urls/${shortCode}`),
            axios.get(`${ANALYTICS_SERVICE_URL}/stats/${shortCode}`)
        ]);

        if (urlResult.status === 'rejected') {
            return reply.code(404).send({ error: 'Short URL not found' });
        }

        const url = urlResult.value.data;
        const analytics =
            analyticsResult.status === 'fulfilled' ? analyticsResult.value.data : null;

        return {
            shortCode: url.shortCode,
            longUrl: url.longUrl,
            createdAt: url.createdAt,
            clickCount: url.clickCount,
            analytics
        };
    });
};
