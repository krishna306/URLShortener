const express = require('express');
const cors = require('cors');
const app = express();
const urlsRouter = require('./routes/urls');
const internalRouter = require('./routes/internal');
const { startClickFlusher } = require('./lib/clickFlusher');
const requireInternalToken = require('./middleware/requireInternalToken');

app.use(cors());
app.use(express.json());
app.use('/urls', urlsRouter);
app.use('/internal', requireInternalToken, internalRouter);
const PORT = process.env.PORT || 4001;

app.get('/health', (req, res) => {
    res.json({status:"ok"});
});

startClickFlusher(Number(process.env.CLICK_FLUSH_INTERVAL_MS) || 10000);

app.listen(PORT, () => {
    console.log(`URL Service is listening on port ${PORT}`);
});