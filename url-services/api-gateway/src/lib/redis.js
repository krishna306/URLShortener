const { createClient } = require('redis');

const redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => console.error('Redis client error:', err));
redis.connect();

module.exports = redis;
