const express = require('express');
const { query } = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT m.*, u.name AS from_name, u.officer_id,
             s.name AS to_stakeholder_name
      FROM messages m
      LEFT JOIN users u ON m.from_user = u.id
      LEFT JOIN stakeholders s ON m.to_stakeholder = s.id
      ORDER BY m.sent_at DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

router.post('/', async (req, res) => {
  const { to_stakeholder, subject, body, classification, related_threat } = req.body;
  try {
    const result = await query(
      `INSERT INTO messages (from_user, to_stakeholder, subject, body, classification, related_threat)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, to_stakeholder, subject, body, classification || 'RESTRICTED', related_threat || null]
    );
    await query(
      'UPDATE stakeholders SET last_contact = NOW() WHERE id = $1',
      [to_stakeholder]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    await query('UPDATE messages SET is_read = true WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

module.exports = router;
