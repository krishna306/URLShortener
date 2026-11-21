const axios = require('axios');
const redis = require('../lib/redis');
const { recordClickEvent } = require('../lib/clickEvents');

const URL_SERVICE_URL = process.env.URL_SERVICE_URL;
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;

module.exports = async function (app) {
    app.get('/:shortCode', async (request, reply) => {
        const { shortCode } = request.params;
        const referrer = request.headers['referer'] || null;
        const userAgent = request.headers['user-agent'] || null;

        try {
            const cached = await redis.get(`url:${shortCode}`);
            if (cached) {
                redis
                    .incr(`clicks:${shortCode}`)
                    .catch((err) => console.error('Failed to incr click count:', err));
                recordClickEvent({ shortCode, referrer, userAgent })
                    .catch((err) => console.error('Failed to record click event:', err));
                return reply.redirect(cached);
            }
        } catch (err) {
            console.error('Redis lookup failed, falling back to url-service:', err);
        }

        try {
            const response = await axios.post(
                `${URL_SERVICE_URL}/internal/resolve/${shortCode}`,
                { referrer, userAgent },
                { headers: INTERNAL_TOKEN ? { 'x-internal-token': INTERNAL_TOKEN } : {} }
            );
            return reply.redirect(response.data.longUrl);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return reply.code(404).send({ error: 'Short URL not found' });
            }
            return reply.code(502).send({ error: 'url-service unavailable' });
        }
    });
};
