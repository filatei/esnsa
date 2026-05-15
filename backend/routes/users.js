const express = require('express');
const bcrypt  = require('bcryptjs');
const { query } = require('../db');
const requireAuth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN','DIRECTOR'));

router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, officer_id, name, role, clearance, is_active, last_login, created_at FROM users ORDER BY created_at ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

router.post('/', async (req, res) => {
  const { officer_id, name, role, clearance, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (officer_id, name, role, clearance, password_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id, officer_id, name, role, clearance',
      [officer_id.toUpperCase(), name, role, clearance, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'OFFICER ID ALREADY EXISTS' });
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

router.put('/:id', async (req, res) => {
  const { name, role, clearance, is_active } = req.body;
  try {
    const result = await query(
      'UPDATE users SET name=$1, role=$2, clearance=$3, is_active=$4, updated_at=NOW() WHERE id=$5 RETURNING id, officer_id, name, role, clearance, is_active',
      [name, role, clearance, is_active, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

router.put('/:id/reset-password', async (req, res) => {
  const { password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, req.params.id]);
    res.json({ message: 'ACCESS CODE RESET SUCCESSFUL' });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

module.exports = router;
