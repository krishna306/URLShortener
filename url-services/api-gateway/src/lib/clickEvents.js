const redis = require('./redis');

// Same stream and event shape as url-service/src/lib/clickEvents.js.
// analytics-service reads it with a consumer group.
const CLICK_STREAM = 'stream:clicks';
const MAX_STREAM_LENGTH = 100000;

function recordClickEvent({ shortCode, referrer, userAgent }) {
    const event = { shortCode, clickedAt: new Date().toISOString() };
    if (referrer) event.referrer = String(referrer);
    if (userAgent) event.userAgent = String(userAgent);

    return redis.xAdd(CLICK_STREAM, '*', event, {
        TRIM: { strategy: 'MAXLEN', strategyModifier: '~', threshold: MAX_STREAM_LENGTH }
    });
}

module.exports = { recordClickEvent };
