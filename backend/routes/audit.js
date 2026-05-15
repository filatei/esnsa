const express = require('express');
const { query } = require('../db');
const requireAuth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();
router.use(requireAuth, requireRole('DIRECTOR','ADMIN'));

router.get('/', async (req, res) => {
  const { user_id, action, limit = 100, offset = 0 } = req.query;
  let sql = `SELECT al.*, u.officer_id, u.name AS user_name FROM audit_log al LEFT JOIN users u ON al.user_id = u.id WHERE 1=1`;
  const params = [];
  if (user_id) { params.push(user_id); sql += ` AND al.user_id = $${params.length}`; }
  if (action)  { params.push(`%${action}%`); sql += ` AND al.action ILIKE $${params.length}`; }
  sql += ` ORDER BY al.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
  params.push(limit, offset);
  try {
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

module.exports = router;
