const publisher = require('./redisPublisher');

// Click events go to a Redis Stream instead of pub/sub.
// Pub/sub drops a message if no subscriber is listening at that moment; a stream
// keeps it until analytics-service reads and acknowledges it. That matters on
// Render's free plan, where analytics-service sleeps after 15 idle minutes.
// The key must NOT start with "clicks:" or the click flusher's SCAN would match it.
const CLICK_STREAM = 'stream:clicks';
const MAX_STREAM_LENGTH = 100000; // cap memory; Upstash free has ~256 MB

function recordClickEvent({ shortCode, referrer, userAgent }) {
    // Stream fields must be strings, so leave out the ones we don't have.
    const event = { shortCode, clickedAt: new Date().toISOString() };
    if (referrer) event.referrer = String(referrer);
    if (userAgent) event.userAgent = String(userAgent);

    return publisher.xAdd(CLICK_STREAM, '*', event, {
        TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold: MAX_STREAM_LENGTH }
    });
}

module.exports = { recordClickEvent, CLICK_STREAM };
