const express = require('express');
const { query } = require('../db');
const requireAuth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();
router.use(requireAuth);

// GET /api/threats
router.get('/', async (req, res) => {
  const { status, severity, limit = 100, offset = 0 } = req.query;
  let sql = 'SELECT * FROM threats WHERE 1=1';
  const params = [];
  if (status)   { params.push(status);   sql += ` AND status = $${params.length}`; }
  if (severity) { params.push(severity); sql += ` AND severity = $${params.length}`; }
  sql += ` ORDER BY logged_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
  params.push(limit, offset);
  try {
    const result = await query(sql, params);
    // Attach agencies to each threat
    for (const t of result.rows) {
      const a = await query('SELECT agency_name FROM threat_agencies WHERE threat_id = $1', [t.id]);
      t.agencies = a.rows.map(r => r.agency_name);
    }
    res.json(result.rows);
  } catch (err) {
    console.error('[THREATS/GET]', err);
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

// GET /api/threats/:id
router.get('/:id', async (req, res) => {
  try {
    const t = await query('SELECT * FROM threats WHERE id = $1', [req.params.id]);
    if (!t.rows.length) return res.status(404).json({ error: 'INCIDENT NOT FOUND' });
    const threat = t.rows[0];
    const a = await query('SELECT agency_name FROM threat_agencies WHERE threat_id = $1', [threat.id]);
    const n = await query(
      `SELECT tn.*, u.name AS author_name FROM threat_notes tn
       LEFT JOIN users u ON tn.author_id = u.id
       WHERE tn.threat_id = $1 ORDER BY tn.created_at ASC`,
      [threat.id]
    );
    threat.agencies = a.rows.map(r => r.agency_name);
    threat.notes    = n.rows;
    res.json(threat);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

// POST /api/threats
router.post('/', requireRole('DIRECTOR','ANALYST'), async (req, res) => {
  const { type, location, state, latitude, longitude, severity, status, loss_estimate, description, agencies } = req.body;
  try {
    // Auto-generate incident_id
    const count = await query('SELECT COUNT(*) FROM threats');
    const num = String(parseInt(count.rows[0].count) + 1).padStart(3, '0');
    const incident_id = `T-${num}`;

    const result = await query(
      `INSERT INTO threats (incident_id, type, location, state, latitude, longitude, severity, status, loss_estimate, description, logged_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [incident_id, type, location, state, latitude, longitude, severity, status || 'ACTIVE', loss_estimate, description, req.user.id]
    );
    const threat = result.rows[0];

    if (agencies?.length) {
      for (const agency of agencies) {
        await query('INSERT INTO threat_agencies (threat_id, agency_name) VALUES ($1,$2) ON CONFLICT DO NOTHING', [threat.id, agency]);
      }
    }

    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id) VALUES ($1,'CREATE_THREAT','threat',$2)`,
      [req.user.id, threat.id]
    );

    threat.agencies = agencies || [];
    res.status(201).json(threat);
  } catch (err) {
    console.error('[THREATS/POST]', err);
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

// PUT /api/threats/:id
router.put('/:id', requireRole('DIRECTOR','ANALYST'), async (req, res) => {
  const { type, location, state, severity, status, loss_estimate, description, agencies } = req.body;
  try {
    const result = await query(
      `UPDATE threats SET type=$1, location=$2, state=$3, severity=$4, status=$5,
       loss_estimate=$6, description=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [type, location, state, severity, status, loss_estimate, description, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'INCIDENT NOT FOUND' });

    if (agencies) {
      await query('DELETE FROM threat_agencies WHERE threat_id = $1', [req.params.id]);
      for (const agency of agencies) {
        await query('INSERT INTO threat_agencies (threat_id, agency_name) VALUES ($1,$2)', [req.params.id, agency]);
      }
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

// POST /api/threats/:id/notes
router.post('/:id/notes', async (req, res) => {
  const { note } = req.body;
  try {
    const result = await query(
      'INSERT INTO threat_notes (threat_id, author_id, note) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, req.user.id, note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

module.exports = router;
