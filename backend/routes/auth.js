const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const { query }= require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { officer_id, password } = req.body;
  if (!officer_id || !password)
    return res.status(400).json({ error: 'OFFICER ID AND ACCESS CODE REQUIRED' });

  try {
    const result = await query(
      'SELECT * FROM users WHERE officer_id = $1 AND is_active = true',
      [officer_id.toUpperCase()]
    );
    if (!result.rows.length)
      return res.status(401).json({ error: 'AUTHENTICATION FAILED' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ error: 'AUTHENTICATION FAILED' });

    // Update last_login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Audit log
    const ip = req.ip || req.connection?.remoteAddress;
    await query(
      `INSERT INTO audit_log (user_id, action, ip_address, user_agent, details)
       VALUES ($1, 'LOGIN', $2, $3, $4)`,
      [user.id, ip, req.headers['user-agent'] || '', JSON.stringify({ officer_id })]
    );

    const payload = {
      id:         user.id,
      officer_id: user.officer_id,
      name:       user.name,
      role:       user.role,
      clearance:  user.clearance,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.json({ token, user: payload });
  } catch (err) {
    console.error('[AUTH/LOGIN]', err);
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress;
    await query(
      `INSERT INTO audit_log (user_id, action, ip_address)
       VALUES ($1, 'LOGOUT', $2)`,
      [req.user.id, ip]
    );
    res.json({ message: 'SESSION TERMINATED' });
  } catch (err) {
    console.error('[AUTH/LOGOUT]', err);
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, officer_id, name, role, clearance, last_login FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

module.exports = router;
