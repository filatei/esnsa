const express = require('express');
const bcrypt  = require('bcryptjs');
const { query } = require('../db');
const requireAuth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();
router.use(requireAuth, requireRole('ADMIN','DIRECTOR'));

/* Admin stats — must be declared before /:id routes */
router.get('/stats', async (req, res) => {
  try {
    const [uStats, aStats, recent] = await Promise.all([
      query(`
        SELECT
          COUNT(*)                                                         AS total,
          COUNT(*) FILTER (WHERE is_active)                               AS active,
          COUNT(*) FILTER (WHERE NOT is_active)                           AS suspended,
          COUNT(*) FILTER (WHERE role = 'ADMIN')                          AS admins,
          COUNT(*) FILTER (WHERE role = 'DIRECTOR')                       AS directors,
          COUNT(*) FILTER (WHERE role = 'ANALYST')                        AS analysts,
          COUNT(*) FILTER (WHERE role = 'OFFICER')                        AS officers,
          COUNT(*) FILTER (WHERE role = 'LIAISON')                        AS liaisons,
          COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '24 hours') AS logged_in_today
        FROM users
      `),
      query(`
        SELECT
          COUNT(*)                                                                      AS events_today,
          COUNT(*) FILTER (WHERE action ILIKE '%LOGIN%' AND action NOT ILIKE '%FAIL%') AS logins_today,
          COUNT(*) FILTER (WHERE action ILIKE '%FAIL%' OR action ILIKE '%INVALID%')    AS failed_today
        FROM audit_log
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `),
      query(`
        SELECT al.id, al.action, al.created_at, al.ip_address, u.officer_id
        FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC LIMIT 10
      `),
    ]);
    res.json({ ...uStats.rows[0], ...aStats.rows[0], recent_activity: recent.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

router.get('/', async (req, res) => {
  const { search } = req.query;
  try {
    let sql = 'SELECT id, officer_id, name, role, clearance, is_active, last_login, created_at FROM users';
    const params = [];
    if (search) {
      params.push(`%${search.toUpperCase()}%`);
      sql += ` WHERE officer_id ILIKE $1 OR UPPER(name) ILIKE $1`;
    }
    sql += ' ORDER BY created_at ASC';
    const result = await query(sql, params);
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
