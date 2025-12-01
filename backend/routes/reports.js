const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// helper to detect a field from a list of candidates
async function detectTransactionFields() {
  const [cols] = await pool.query('SHOW COLUMNS FROM transactions');
  const fields = (cols || []).map(c => c.Field);

  // common candidates for the type field
  const typeCandidates = ['type','tx_type','transaction_type','kind'];
  let typeField = typeCandidates.find(c => fields.includes(c)) || 'type';

  // common candidates for the date column
  const dateCandidates = ['occurred_at','transaction_date','date','created_at'];
  let dateField = dateCandidates.find(c => fields.includes(c)) || 'occurred_at';

  const hasDeleted = fields.includes('deleted_at');
  const hasCategoryId = fields.includes('category_id');

  return { typeField, dateField, hasDeleted, hasCategoryId };
}

// GET /reports/donut?type=expense&month=YYYY-MM&user_id=1
router.get('/donut', async (req, res) => {
  try {
    const userId = req.query.user_id ? Number(req.query.user_id) : 1;
    const type = req.query.type || 'expense';
    const month = req.query.month || new Date().toISOString().slice(0,7); // YYYY-MM

    const info = await detectTransactionFields();

    // build WHERE parts depending on detected columns
    const whereParts = ['t.user_id = ?'];
    const params = [userId];

    whereParts.push(`t.\`${info.typeField}\` = ?`);
    params.push(type);

    // month filter using DATE_FORMAT on detected date field
    whereParts.push(`DATE_FORMAT(t.\`${info.dateField}\`, '%Y-%m') = ?`);
    params.push(month);

    if (info.hasDeleted) whereParts.push('t.deleted_at IS NULL');

    // category join: prefer categories.name but fall back to category_id label
    const joinClause = info.hasCategoryId ? 'JOIN categories c ON c.id = t.category_id' : '';

    const sql = `SELECT ${info.hasCategoryId ? 'c.name' : 't.category_id'} AS category, SUM(t.amount) AS total
      FROM transactions t
      ${joinClause}
      WHERE ${whereParts.join(' AND ')}
      GROUP BY category
      ORDER BY total DESC`;

    const [rows] = await pool.query(sql, params);
    res.json(rows.map(r => ({ category: r.category, total: r.total })));
  } catch (err) {
    console.error('reports/donut error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Debug endpoint: returns detected transaction fields (helpful for local schema diagnosis)
router.get('/debug', async (req, res) => {
  try {
    const info = await detectTransactionFields();
    // Also return actual columns list for visibility
    const [cols] = await pool.query('SHOW COLUMNS FROM transactions');
    const fields = (cols || []).map(c => c.Field);
    res.json({ detected: info, columns: fields });
  } catch (err) {
    console.error('reports/debug error', err);
    res.status(500).json({ error: 'Failed to read transactions schema' });
  }
});

// GET /reports/summary?start=YYYY-MM-DD&end=YYYY-MM-DD&user_id=1
router.get('/summary', async (req, res) => {
  try {
    const userId = req.query.user_id ? Number(req.query.user_id) : 1;
    const start = req.query.start;
    const end = req.query.end;
    if(!start || !end) return res.status(400).json({error: 'start and end required (YYYY-MM-DD)'});

    const info = await detectTransactionFields();

    const whereParts = ['user_id = ?'];
    const params = [userId];
    whereParts.push(`\`${info.dateField}\` BETWEEN ? AND ?`);
    params.push(start, end);
    if (info.hasDeleted) whereParts.push('deleted_at IS NULL');

        const sql = `SELECT DATE_FORMAT(\`${info.dateField}\`, '%Y-%m-01') AS month_start,
            \`${info.typeField}\` AS type,
            SUM(amount) AS total
      FROM transactions
      WHERE ${whereParts.join(' AND ')}
          GROUP BY month_start, ${info.typeField}
      ORDER BY month_start`;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('reports/summary error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
