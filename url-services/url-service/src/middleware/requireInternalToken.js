const crypto = require('crypto');

// On Render's free plan every service gets a public URL, so /internal/* can be
// reached by anyone on the internet. A shared secret between the gateway and
// url-service proves the caller is the gateway.
const TOKEN = process.env.INTERNAL_TOKEN;

if (!TOKEN) {
    console.warn('INTERNAL_TOKEN is not set: /internal routes are unprotected (OK for local dev only)');
}

function requireInternalToken(req, res, next) {
    if (!TOKEN) return next();

    const given = Buffer.from(req.get('x-internal-token') || '');
    const expected = Buffer.from(TOKEN);

    // timingSafeEqual takes the same time whether the first or last byte differs,
    // so an attacker can't guess the token one character at a time by timing us.
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

module.exports = requireInternalToken;
