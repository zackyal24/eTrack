const express = require('express');
const router = express.Router();
const pool = require('../db');

// Simple POST /auth/login
// Body: { email, password, name? }
// Behavior: if user exists, validate password; if not, create user. Returns { id, email, name }
router.post('/login', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if(!email || !password) return res.status(400).json({ error: 'email and password required' });

    const [rows] = await pool.query('SELECT id, email, password, name FROM users WHERE email = ? LIMIT 1', [email]);
    if(rows && rows.length > 0){
      const user = rows[0];
      // NOTE: plaintext password comparison for dev only
      if(user.password !== password) return res.status(401).json({ error: 'invalid credentials' });
      return res.json({ id: user.id, email: user.email, name: user.name });
    }

    // create user
    const [r] = await pool.query('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, password, name || null]);
    return res.json({ id: r.insertId, email, name: name || null });
  } catch (err) {
    console.error('auth/login error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
