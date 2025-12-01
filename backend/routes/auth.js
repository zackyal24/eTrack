const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');

/**
 * REGISTER
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Check existing email
    const [exist] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (exist.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [r] = await pool.query(
      "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)",
      [email, hashed, name || null]
    );

    return res.json({
      message: "Register success",
      userId: r.insertId,
      email,
      name: name || null
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * LOGIN
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      "SELECT id, email, password_hash, name FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      userId: user.id,
      name: user.name,
      email: user.email
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
