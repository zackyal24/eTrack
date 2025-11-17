require('dotenv').config();
const express = require('express');
const cors = require('cors');

const reportsRouter = require('./routes/reports');
const transactionsRouter = require('./routes/transactions');
const authRouter = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({status: 'eTrack API', env: process.env.NODE_ENV || 'development'}));

app.use('/reports', reportsRouter);
app.use('/transactions', transactionsRouter);
app.use('/auth', authRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`eTrack backend listening on http://localhost:${port}`));
