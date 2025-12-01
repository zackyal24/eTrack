const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /transactions?limit=20&user_id=1
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id ? Number(req.query.user_id) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    // optional date filters
    const start = req.query.start || null; // YYYY-MM-DD
    const end = req.query.end || null;     // YYYY-MM-DD
    const month = req.query.month || null; // YYYY-MM (alternative)

    // base SQL
    let sql = `
      SELECT t.id, DATE_FORMAT(t.occurred_at, '%Y-%m-%dT%H:%i:%s') AS occurred_at, t.description, t.amount, t.type, c.name AS category
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = ?`;
    const params = [userId];

    // only include deleted_at filter if the column exists (defensive)
    // We'll attempt to check columns quickly (non-blocking) -- assume column present for normal installs
    sql += ' AND t.deleted_at IS NULL';

    // Prefer month param when provided (simpler for month-based UIs)
    if (month) {
      sql += " AND DATE_FORMAT(t.occurred_at, '%Y-%m') = ?";
      params.push(month);
    } else if (start && end) {
      sql += ' AND DATE(t.occurred_at) BETWEEN ? AND ?';
      params.push(start, end);
    }

    sql += ' ORDER BY t.occurred_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(sql, params);
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

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [result] = await pool.query(
      "DELETE FROM transactions WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete transaction error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /transactions/:id
// Body: { category?, type?, amount?, occurred_at?, description?, payment_type? }
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID tidak valid' });

    // ambil data transaksi dari body
    const {
      category,
      type,
      amount,
      occurred_at,
      description,
      payment_type
    } = req.body;

    // cek apakah transaksi ada
    const [existingRows] = await pool.query(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );

    if (!existingRows || existingRows.length === 0) {
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    let categoryId = null;
    if (category) {
      // cek apakah kategori sudah ada
      const [catRows] = await pool.query(
        'SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL) LIMIT 1',
        [category, existingRows[0].user_id]
      );

      if (catRows && catRows.length > 0) {
        categoryId = catRows[0].id;
      } else {
        // buat kategori baru
        const [catResult] = await pool.query(
          'INSERT INTO categories (user_id, name) VALUES (?, ?)',
          [existingRows[0].user_id, category]
        );
        categoryId = catResult.insertId;
      }
    }

    // build update query
    let updateFields = [];
    let params = [];

    if (categoryId !== null) { updateFields.push('category_id = ?'); params.push(categoryId); }
    if (type) { updateFields.push('type = ?'); params.push(type); }
    if (amount != null) { updateFields.push('amount = ?'); params.push(amount); }
    if (occurred_at) { updateFields.push('occurred_at = ?'); params.push(occurred_at); }
    if (description != null) { updateFields.push('description = ?'); params.push(description); }
    if (payment_type != null) { updateFields.push('payment_type = ?'); params.push(payment_type); }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Tidak ada data untuk diupdate' });
    }

    const sql = `UPDATE transactions SET ${updateFields.join(', ')} WHERE id = ?`;
    params.push(id);

    await pool.query(sql, params);

    // kembalikan transaksi terbaru
    const [updatedRows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [id]);
    res.json(updatedRows[0]);
  } catch (err) {
    console.error('transactions PUT error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;
