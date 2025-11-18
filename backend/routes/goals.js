const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /goals?user_id=1
router.get('/', async (req, res) => {
  try {
    const userId = req.query.user_id ? Number(req.query.user_id) : 1;
    // inspect columns to support slightly different schemas (name vs title, deadline vs target_date)
    const [cols] = await pool.query('SHOW COLUMNS FROM goals');
    const fields = (cols || []).map(c => c.Field);
    const nameField = fields.includes('name') ? 'name' : (fields.includes('title') ? 'title' : 'name');
    const deadlineField = fields.includes('deadline') ? 'deadline' : (fields.includes('target_date') ? 'target_date' : 'deadline');

    // only include deleted_at filter if column exists
    const whereDeleted = fields.includes('deleted_at') ? ' AND deleted_at IS NULL' : '';
    const sql = `SELECT id, user_id, ${nameField} AS name, target_amount, current_amount, ${deadlineField} AS deadline, created_at FROM goals WHERE user_id = ?${whereDeleted} ORDER BY created_at DESC`;
    const [rows] = await pool.query(sql, [userId]);
    res.json(rows);
  } catch (err) {
    console.error('goals list error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /goals/schema - helpful for debugging schema mismatches
router.get('/schema', async (req, res) => {
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM goals');
    res.json((cols || []).map(c => c.Field));
  } catch (err) {
    console.error('goals schema error', err);
    res.status(500).json({ error: 'Failed to read goals schema' });
  }
});

// POST /goals  { user_id, name, target_amount, current_amount?, deadline? }
router.post('/', async (req, res) => {
  const b = req.body || {};
  let userId = b.user_id ? Number(b.user_id) : 1;
  let name = b.name ? String(b.name).trim() : null;
  let target = b.target_amount != null ? Number(b.target_amount) : null;
  let current = b.current_amount != null ? Number(b.current_amount) : 0;
  let deadline = b.deadline ? String(b.deadline) : null;

  try {
    if(!name || target === null || isNaN(target)) return res.status(400).json({ error: 'name and target_amount required' });

    const sql = `INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, created_at) VALUES (?, ?, ?, ?, ?, NOW())`;
    const [r] = await pool.query(sql, [userId, name, target, current, deadline]);
    res.status(201).json({ id: r.insertId, success: true });
  } catch (err) {
    console.error('goals create error', err);
    // If table schema doesn't match, try to be helpful: inspect columns and retry insert using available fields
    if (err && err.code === 'ER_BAD_FIELD_ERROR') {
      try {
        const [cols] = await pool.query('SHOW COLUMNS FROM goals');
        const fields = (cols || []).map(c => c.Field);
        console.error('goals table columns:', fields);

        // mapping candidates: if server expects 'name' but table uses another column, try common alternatives
        let nameField = fields.includes('name') ? 'name' : null;
        const altNameCandidates = ['title','goal','goal_name','label'];
        if (!nameField) {
          for (const cand of altNameCandidates) {
            if (fields.includes(cand)) { nameField = cand; break; }
          }
        }

        let deadlineField = fields.includes('deadline') ? 'deadline' : null;
        const altDeadlineCandidates = ['target_date','due_date','target_date'];
        if (!deadlineField) {
          for (const cand of altDeadlineCandidates) {
            if (fields.includes(cand)) { deadlineField = cand; break; }
          }
        }

        // desired columns and values (we'll map keys to actual field names)
        const desired = {
          user_id: userId,
          name: name,
          target_amount: target,
          current_amount: current,
          deadline: deadline
        };

        // Build insert using intersection of desired keys and actual fields.
        const insertFields = [];
        const placeholders = [];
        const values = [];

        for (const key of Object.keys(desired)) {
          if (key === 'name') {
            if (nameField) {
              insertFields.push(nameField);
              placeholders.push('?');
              values.push(desired.name);
            }
          } else if (key === 'deadline') {
            if (deadlineField) {
              insertFields.push(deadlineField);
              placeholders.push('?');
              values.push(desired.deadline);
            }
          } else if (fields.includes(key)) {
            insertFields.push(key);
            placeholders.push('?');
            values.push(desired[key]);
          }
        }

        // if created_at exists and wasn't included, set it to NOW()
        if (fields.includes('created_at') && !insertFields.includes('created_at')) {
          insertFields.push('created_at');
          placeholders.push('NOW()');
        }

        if (insertFields.length === 0) {
          return res.status(500).json({ error: 'No compatible columns found in goals table', columns: fields });
        }

        const retrySql = `INSERT INTO goals (${insertFields.join(',')}) VALUES (${placeholders.join(',')})`;
        console.log('Retrying goals insert with SQL:', retrySql, 'values:', values);
        const [r2] = await pool.query(retrySql, values);
        return res.status(201).json({ id: r2.insertId, success: true, usedColumns: insertFields });
      } catch (inner) {
        console.error('failed to retry goals insert', inner);
        return res.status(500).json({ error: 'Goals table schema mismatch', message: err.sqlMessage, sql: err.sql, columns: (inner && inner.columns) || null });
      }
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /goals/:id/contribute { user_id, amount }
router.post('/:id/contribute', async (req, res) => {
  try {
    const goalId = Number(req.params.id);
    const b = req.body || {};
    const amt = b.amount != null ? Number(b.amount) : null;
    if(!goalId || amt === null || isNaN(amt)) return res.status(400).json({ error: 'goal id and amount required' });
    // Record contribution and update goal in a transaction.
    // Detect which contributions table exists (support common names).
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // detect table name
      let contributionTable = null;
      const checkNames = ['goal_contribution','goals_contribution','goal_contributions','goals_contributions'];
      for (const name of checkNames) {
        const [rows] = await conn.query("SHOW TABLES LIKE ?", [name]);
        if (rows && rows.length) { contributionTable = name; break; }
      }
      if (!contributionTable) {
        throw new Error('No contribution table found (expected one of: ' + checkNames.join(',') + ')');
      }

      // Inspect contribution table columns and build compatible INSERT
      const [contribColsRows] = await conn.query('SHOW COLUMNS FROM \`' + contributionTable + '\`');
      const contribCols = (contribColsRows || []).map(c => c.Field);
      const insertFields = [];
      const placeholders = [];
      const values = [];

      // helper to push a field if it exists
      const pushIfExists = (fieldName, val, useNowForCreatedAt=false) => {
        if (contribCols.includes(fieldName)) {
          insertFields.push('`' + fieldName + '`');
          if (useNowForCreatedAt) {
            placeholders.push('NOW()');
          } else {
            placeholders.push('?');
            values.push(val);
          }
        }
      };

      const userId = b.user_id ? Number(b.user_id) : null;
      const note = b.note ? String(b.note) : null;

      pushIfExists('goal_id', goalId);
      pushIfExists('user_id', userId);
      pushIfExists('amount', amt);
      pushIfExists('note', note);
      // prefer to set created_at via NOW() if the column exists and we didn't include it explicitly
      if (contribCols.includes('created_at')) {
        insertFields.push('`created_at`');
        placeholders.push('NOW()');
      }

      if (insertFields.length === 0) {
        throw new Error('No compatible columns found in contribution table ' + contributionTable);
      }

      const insertSql = `INSERT INTO \`${contributionTable}\` (${insertFields.join(',')}) VALUES (${placeholders.join(',')})`;
      console.log('Inserting contribution into', contributionTable, 'SQL:', insertSql, 'values:', values);
      const [insRes] = await conn.query(insertSql, values);
      console.log('Contribution insert result:', insRes && insRes.insertId ? { insertId: insRes.insertId } : insRes);

      // Update the aggregated current_amount on goals table
      const updateSql = `UPDATE goals SET current_amount = current_amount + ? WHERE id = ?`;
      const [r] = await conn.query(updateSql, [amt, goalId]);
      console.log('Goals update result:', r && typeof r.affectedRows !== 'undefined' ? { affectedRows: r.affectedRows } : r);

      await conn.commit();
      res.json({ success: true, affectedRows: r.affectedRows, contributionInsertId: insRes && insRes.insertId });
    } catch (inner) {
      try { await conn.rollback(); } catch(e){}
      console.error('contribute transaction error', inner);
      return res.status(500).json({ error: 'Failed to record contribution', detail: inner.message || String(inner) });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('goals contribute error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
