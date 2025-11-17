const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /reports/donut?type=expense&month=YYYY-MM&user_id=1
router.get('/donut', async (req, res) => {
  try {
    const userId = req.query.user_id ? Number(req.query.user_id) : 1;
    const type = req.query.type || 'expense';
    const month = req.query.month || new Date().toISOString().slice(0,7); // YYYY-MM

    const sql = `
      SELECT c.name AS category, SUM(t.amount) AS total
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = ? AND t.type = ?
        AND DATE_FORMAT(t.occurred_at, '%Y-%m') = ?
        AND t.deleted_at IS NULL
      GROUP BY c.name
      ORDER BY total DESC
    `;

    const [rows] = await pool.query(sql, [userId, type, month]);
    res.json(rows);
  } catch (err) {
    console.error('reports/donut error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /reports/summary?start=YYYY-MM-DD&end=YYYY-MM-DD&user_id=1
router.get('/summary', async (req, res) => {
  try {
    const userId = req.query.user_id ? Number(req.query.user_id) : 1;
    const start = req.query.start;
    const end = req.query.end;
    if(!start || !end) return res.status(400).json({error: 'start and end required (YYYY-MM-DD)'});

    const sql = `
      SELECT DATE_FORMAT(occurred_at, '%Y-%m-01') AS month_start,
             type,
             SUM(amount) AS total
      FROM transactions
      WHERE user_id = ? AND occurred_at BETWEEN ? AND ? AND deleted_at IS NULL
      GROUP BY month_start, type
      ORDER BY month_start
    `;
    const [rows] = await pool.query(sql, [userId, start, end]);
    res.json(rows);
  } catch (err) {
    console.error('reports/summary error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
