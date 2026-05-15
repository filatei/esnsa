const express = require('express');
const { query } = require('../db');
const requireAuth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT s.*,
        COUNT(m.id) FILTER (WHERE m.is_read = false) AS unread_count
      FROM stakeholders s
      LEFT JOIN messages m ON m.to_stakeholder = s.id
      GROUP BY s.id ORDER BY s.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

router.put('/:id', requireRole('DIRECTOR','ANALYST'), async (req, res) => {
  const { status, contact_name, contact_email, notes } = req.body;
  try {
    const result = await query(
      `UPDATE stakeholders SET status=$1, contact_name=$2, contact_email=$3, notes=$4, last_contact=NOW()
       WHERE id=$5 RETURNING *`,
      [status, contact_name, contact_email, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

module.exports = router;
