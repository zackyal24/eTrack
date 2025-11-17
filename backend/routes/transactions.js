const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /transactions?limit=20&user_id=1
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id ? Number(req.query.user_id) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const sql = `
      SELECT t.id, t.occurred_at, t.description, t.amount, t.type, c.name AS category
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = ? AND t.deleted_at IS NULL
      ORDER BY t.occurred_at DESC
      LIMIT ?
    `;
    const [rows] = await pool.query(sql, [userId, limit]);
    res.json(rows);
  } catch (err) {
    console.error('transactions list error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /transactions
// Body: { user_id?, type: 'income'|'expense', amount, occurred_at: 'YYYY-MM-DD', category: 'name', description?, payment_type? }
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const userId = body.user_id ? Number(body.user_id) : 1;
    const type = body.type || 'expense';
    const amount = body.amount != null ? Number(body.amount) : null;
    const occurred_at = body.occurred_at || new Date().toISOString().slice(0,10);
    const categoryName = body.category ? String(body.category).trim() : 'Uncategorized';
    const description = body.description ? String(body.description) : null;
    const payment_type = body.payment_type ? String(body.payment_type) : null;

    if(amount === null || isNaN(amount)) return res.status(400).json({ error: 'amount is required' });

    // find or create category (categories may be per-user)
    const [catRows] = await pool.query('SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL) LIMIT 1', [categoryName, userId]);
    let categoryId = null;
    if(catRows && catRows.length > 0){
      categoryId = catRows[0].id;
    } else {
      // include user_id when creating category to satisfy FK constraints if present
      const [r] = await pool.query('INSERT INTO categories (user_id, name) VALUES (?, ?)', [userId, categoryName]);
      categoryId = r.insertId;
    }

    const insertSql = `
      INSERT INTO transactions (user_id, category_id, amount, type, occurred_at, description, payment_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await pool.query(insertSql, [userId, categoryId, amount, type, occurred_at, description, payment_type]);
      return res.status(201).json({ id: result.insertId, success: true });
    } catch (insErr) {
      // If the schema doesn't have payment_type we may get ER_BAD_FIELD_ERROR (1054).
      // Retry without the payment_type column for compatibility with older schemas.
      if (insErr && insErr.code === 'ER_BAD_FIELD_ERROR') {
        try {
          const altSql = `
            INSERT INTO transactions (user_id, category_id, amount, type, occurred_at, description)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          const [result2] = await pool.query(altSql, [userId, categoryId, amount, type, occurred_at, description]);
          return res.status(201).json({ id: result2.insertId, success: true, note: 'insert-without-payment_type' });
        } catch (altErr) {
          console.error('transactions POST retry error', altErr);
          return res.status(500).json({ error: 'Internal server error' });
        }
      }
      console.error('transactions POST insert error', insErr);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } catch (err) {
    console.error('transactions POST error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
