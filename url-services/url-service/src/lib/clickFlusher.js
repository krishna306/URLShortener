const prisma = require('./prisma');
const publisher = require('./redisPublisher');

async function flushClickCounts() {
    const keys = [];
    // COUNT 1000 = fewer SCAN round trips. On Upstash every command counts
    // toward the free 500K/month, and the default COUNT is only 10.
    for await (const batch of publisher.scanIterator({ MATCH: 'clicks:*', COUNT: 1000 })) {
        keys.push(...batch);
    }

    for (const key of keys) {
        const shortCode = key.replace('clicks:', '');
        const count = Number(await publisher.getDel(key));
        if (!(count > 0)) continue;

        try {
            await prisma.url.update({
                where: { shortCode },
                data: { clickCount: { increment: count } }
            });
        } catch (err) {
            if (err.code === 'P2025') {
                // The URL row doesn't exist, so retrying would fail forever.
                console.warn(`Dropping ${count} click(s) for unknown code ${shortCode}`);
                continue;
            }
            // GETDEL already removed the counter. Put the clicks back so the next
            // flush retries them instead of losing them (e.g. Neon was waking up).
            await publisher.incrBy(key, count);
            console.error(`Failed to flush clicks for ${shortCode}, will retry:`, err.message);
        }
    }
}

function startClickFlusher(intervalMs = 10000) {
    setInterval(() => {
        flushClickCounts().catch((err) => console.error('Click flush failed:', err));
    }, intervalMs);
    console.log(`Click flusher running every ${intervalMs}ms`);
}

module.exports = { startClickFlusher, flushClickCounts };
