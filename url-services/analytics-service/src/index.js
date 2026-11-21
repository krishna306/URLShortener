const express = require('express');
const cors = require('cors');
const { startClickConsumer } = require('./lib/clickConsumer');
const statsRouter = require('./routes/stats');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/stats', statsRouter);

startClickConsumer(Number(process.env.CLICK_DRAIN_INTERVAL_MS) || 5000);

app.listen(PORT, () => {
    console.log(`Analytics Service is listening on port ${PORT}`);
});