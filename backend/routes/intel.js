const express = require('express');
const { query } = require('../db');
const requireAuth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { classification, source, limit = 50 } = req.query;
  let sql = 'SELECT ii.*, u.name AS logged_by_name FROM intel_items ii LEFT JOIN users u ON ii.logged_by = u.id WHERE 1=1';
  const params = [];
  if (classification) { params.push(classification); sql += ` AND ii.classification = $${params.length}`; }
  if (source)         { params.push(source);         sql += ` AND ii.source = $${params.length}`; }
  sql += ` ORDER BY ii.logged_at DESC LIMIT $${params.length+1}`;
  params.push(limit);
  try {
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

router.post('/', requireRole('DIRECTOR','ANALYST'), async (req, res) => {
  const { classification, source, content, related_threat } = req.body;
  try {
    const result = await query(
      `INSERT INTO intel_items (classification, source, content, related_threat, logged_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [classification, source, content, related_threat || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

router.put('/:id/action', async (req, res) => {
  try {
    const result = await query(
      'UPDATE intel_items SET is_actioned = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

module.exports = router;
