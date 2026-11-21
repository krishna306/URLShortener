const  {createClient } = require('redis');
const publisher = createClient({
    url : process.env.REDIS_URL
});
publisher.connect();
publisher.on('error', (err) => console.log('Redis Client Error', err));
module.exports = publisher;