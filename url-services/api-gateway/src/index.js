require('dotenv').config();

const Fastify = require('fastify');
const cors = require('@fastify/cors');

const app = Fastify({ logger: false });

app.register(cors);

app.get('/health', async () => ({ status: 'ok' }));

app.register(require('./routes/shorten'), { prefix: '/api/shorten' });
app.register(require('./routes/urls'), { prefix: '/api/urls' });
app.register(require('./routes/stats'), { prefix: '/api/urls' });
app.register(require('./routes/redirect'));

const PORT = Number(process.env.PORT) || 4000;

app.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
    console.log(`API Gateway (Fastify) is listening on port ${PORT}`);
}).catch((err) => {
    console.error(err);
    process.exit(1);
});
