const express = require('express');
const prisma = require('../lib/prisma');
const publisher = require('../lib/redisPublisher');
const { recordClickEvent } = require('../lib/clickEvents');

const router = express.Router();

router.post('/resolve/:code', async (req, res) => {
    const shortCode = req.params.code;
    const cacheKey = `url:${shortCode}`;

    let longUrl = await publisher.get(cacheKey);

    if (!longUrl) {
        const url = await prisma.url.findUnique({
            where: { shortCode }
        });

        if (!url) {
            return res.status(404).json({ error: 'Not found' });
        }

        longUrl = url.longUrl;
        await publisher.set(cacheKey, longUrl, { EX: 3600 });
    }

    publisher
        .incr(`clicks:${shortCode}`)
        .catch((err) => console.error('Failed to incr click count:', err));

    const { referrer, userAgent } = req.body || {};
    recordClickEvent({ shortCode, referrer, userAgent })
        .catch((err) => console.error('Failed to record click event:', err));

    res.json({ longUrl });
});

module.exports = router;
