const express = require('express');
const prisma = require('../lib/prisma');
const { drainClicks } = require('../lib/clickConsumer');

const router = express.Router();

router.get('/:code', async (req, res) => {
    const shortCode = req.params.code;

    // On Render this request is often what woke the service up. Catch up on the
    // events that queued while it slept, so the stats aren't stale. If Redis is
    // down, still answer from whatever is already in Postgres.
    // The 3s cap matters: node-redis queues commands while disconnected, so
    // without it a Redis outage would make this request hang forever.
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timed out after 3s')), 3000));
    await Promise.race([drainClicks(), timeout])
        .catch((err) => console.error('Drain before stats failed:', err.message));

    const [totalClicks, topReferrers, clicksByDay] = await Promise.all([
        prisma.click.count({ where: { shortCode } }),

        prisma.click.groupBy({
            by: ['referrer'],
            where: { shortCode },
            _count: { _all: true }
        }),

        prisma.$queryRaw`
            SELECT DATE("clickedAt") as date, COUNT(*)::int as count
            FROM "Click"
            WHERE "shortCode" = ${shortCode}
            GROUP BY DATE("clickedAt")
            ORDER BY date DESC
            LIMIT 7
        `
    ]);

    res.json({
        shortCode,
        totalClicks,
        clicksByDay,
        topReferrers: topReferrers
            .map((r) => ({ referrer: r.referrer, count: r._count._all }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
    });
});

module.exports = router;
