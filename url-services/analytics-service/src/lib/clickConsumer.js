const { createClient } = require('redis');
const prisma = require('./prisma');

// Reads click events from a Redis Stream using a consumer group.
//
// Why a stream and not pub/sub: pub/sub delivers to whoever is listening right
// now and forgets the message. A stream stores events, and a consumer group
// remembers how far this service has read. If analytics-service is asleep
// (Render free plan) or crashed, events wait in Redis and are read on wake-up.
//
// Delivery is "at least once": an event is acknowledged (XACK) only after it is
// saved to Postgres. If the save fails, the event stays "pending" and is
// retried. If the save succeeds but XACK fails, it can be saved twice.
const STREAM = 'stream:clicks';
const GROUP = 'analytics';
// A fixed name, so after a restart we can see the pending events of the
// previous run. With several replicas each would need its own name, plus
// XAUTOCLAIM to take over a dead replica's pending events.
const CONSUMER = process.env.CONSUMER_NAME || 'analytics-1';
const BATCH_SIZE = 500;

const redis = createClient({ url: process.env.REDIS_URL });
redis.on('error', (err) => console.error('Redis consumer error:', err));

let ready = null;
function init() {
    if (!ready) {
        ready = (async () => {
            await redis.connect();
            try {
                // '0' = the group starts from the beginning of the stream, so events
                // published before analytics ever ran are not skipped.
                await redis.xGroupCreate(STREAM, GROUP, '0', { MKSTREAM: true });
                console.log(`Created consumer group "${GROUP}" on ${STREAM}`);
            } catch (err) {
                if (!String(err.message).includes('BUSYGROUP')) throw err; // already exists = fine
            }
        })().catch((err) => {
            ready = null; // allow a retry on the next drain
            throw err;
        });
    }
    return ready;
}

function toRow(message) {
    const clickedAt = new Date(message.clickedAt);
    return {
        shortCode: message.shortCode,
        // Use the time of the click, not the time we read it. Events can sit in
        // the stream for minutes while this service sleeps.
        clickedAt: isNaN(clickedAt) ? new Date() : clickedAt,
        referrer: message.referrer || null,
        userAgent: message.userAgent || null
    };
}

async function readBatch(id) {
    const result = await redis.xReadGroup(GROUP, CONSUMER, { key: STREAM, id }, { COUNT: BATCH_SIZE });
    return result && result[0] ? result[0].messages : [];
}

// id '0' = events already delivered to us but never acknowledged.
// id '>' = events never delivered to anyone in the group.
// Only check '0' at startup and after a failure, to save Redis commands.
let checkPending = true;

async function drainOnce() {
    await init();
    let saved = 0;

    const ids = checkPending ? ['0', '>'] : ['>'];
    for (const id of ids) {
        while (true) {
            const messages = await readBatch(id);
            if (messages.length === 0) break;

            const rows = messages.map((m) => toRow(m.message)).filter((r) => r.shortCode);
            if (rows.length > 0) {
                await prisma.click.createMany({ data: rows });
            }
            await redis.xAck(STREAM, GROUP, messages.map((m) => m.id));
            saved += rows.length;

            if (messages.length < BATCH_SIZE) break;
        }
    }

    checkPending = false;
    if (saved > 0) console.log(`Saved ${saved} click(s) from ${STREAM}`);
    return saved;
}

// Single-flight: if a drain is already running, callers share it instead of
// reading the same events twice in parallel.
let running = null;
function drainClicks() {
    if (!running) {
        running = drainOnce()
            .catch((err) => {
                checkPending = true;
                throw err;
            })
            .finally(() => {
                running = null;
            });
    }
    return running;
}

function startClickConsumer(intervalMs = 5000) {
    drainClicks().catch((err) => console.error('Initial click drain failed:', err.message));
    setInterval(() => {
        drainClicks().catch((err) => console.error('Click drain failed:', err.message));
    }, intervalMs);
    console.log(`Click consumer reading ${STREAM} every ${intervalMs}ms`);
}

module.exports = { startClickConsumer, drainClicks };
