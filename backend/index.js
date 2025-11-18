require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const reportsRouter = require('./routes/reports');
const transactionsRouter = require('./routes/transactions');
const authRouter = require('./routes/auth');
const goalsRouter = require('./routes/goals');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend `service` directory so pages like /report.html are available
const servicePath = path.join(__dirname, '..', 'service');
app.use(express.static(servicePath));

app.get('/', (req, res) => res.json({status: 'eTrack API', env: process.env.NODE_ENV || 'development'}));

app.use('/reports', reportsRouter);
app.use('/transactions', transactionsRouter);
app.use('/auth', authRouter);
app.use('/goals', goalsRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`eTrack backend listening on http://localhost:${port}`));
