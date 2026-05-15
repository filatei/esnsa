const express   = require('express');
const Anthropic  = require('@anthropic-ai/sdk');
const { query } = require('../db');
const requireAuth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();
router.use(requireAuth);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/brief/generate
router.post('/generate', requireRole('DIRECTOR','ANALYST'), async (req, res) => {
  const { brief_type = 'DAILY_SITREP', date, prepared_for } = req.body;
  const briefDate = date || new Date().toISOString().split('T')[0];

  try {
    // Pull active data
    const threats = await query(
      "SELECT * FROM threats WHERE status IN ('ACTIVE','MONITORING') ORDER BY severity DESC, logged_at DESC"
    );
    const intel = await query(
      "SELECT * FROM intel_items WHERE logged_at > NOW() - INTERVAL '24 hours' ORDER BY classification DESC, logged_at DESC"
    );
    const metrics = await getDashboardMetrics();

    const refNumber = Math.floor(Math.random() * 9000) + 1000;
    const briefTypeLabel = brief_type.replace(/_/g, ' ');

    const promptText = `You are the AI Analysis Engine for the Nigerian Office of the National Security Adviser, Directorate of Energy Security.

Generate a formal classified ${briefTypeLabel} for ${briefDate}.
Prepared for: ${req.user.name} (Clearance: ${req.user.clearance})

ACTIVE THREATS (${threats.rows.length} incidents):
${threats.rows.map(t => `- ${t.incident_id}: ${t.type} at ${t.location}, ${t.state} — Severity: ${t.severity}, Status: ${t.status}, Estimated Loss: ${t.loss_estimate}`).join('\n')}

INTELLIGENCE ITEMS (last 24 hours — ${intel.rows.length} items):
${intel.rows.map(i => `- [${i.classification}] ${i.source}: ${i.content}`).join('\n')}

PRODUCTION METRICS:
- Current production: ${metrics.production_bpd} bpd (target: ${metrics.target_bpd} bpd)
- Estimated daily revenue loss: $${metrics.daily_loss_usd}M
- Active threats: ${metrics.active_threats}
- Incidents MTD: ${metrics.incidents_mtd}
- Response rate: ${metrics.response_rate}%

Write the brief using EXACTLY this structure. Use plain text, no markdown:

CLASSIFICATION: SECRET
DATE: ${briefDate}
REF: ONSA/ES/SITREP/${refNumber}
PREPARED BY: ESNSA AI Analysis Engine
FOR: ${req.user.name}

1. EXECUTIVE SUMMARY
[3-4 sentences — headline situation for the Director]

2. CRITICAL & HIGH SEVERITY INCIDENTS
[Cover CRITICAL incidents first, then HIGH — 2-3 sentences each]

3. INTELLIGENCE HIGHLIGHTS
[Top 2-3 SECRET/CONFIDENTIAL intel items requiring action]

4. PRODUCTION & REVENUE IMPACT
[Quantify losses, production deficit, fiscal impact — 2-3 sentences]

5. RECOMMENDED ACTIONS
[3-5 numbered, specific, actionable directives for the Director]

6. 24-HOUR WATCH LIST
[2-3 specific situations to monitor in the next 24 hours]

7. NEXT BRIEF
[State when next brief will be generated]

Keep tone: authoritative, precise, senior government document.`;

    const message = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages:   [{ role: 'user', content: promptText }],
    });

    const content = message.content[0].text;

    // Save brief
    const savedBrief = await query(
      `INSERT INTO briefs (brief_type, classification, prepared_for, generated_by, content, threat_snapshot, intel_snapshot)
       VALUES ($1,'SECRET',$2,$3,$4,$5,$6) RETURNING *`,
      [
        brief_type,
        prepared_for || req.user.id,
        req.user.id,
        content,
        JSON.stringify(threats.rows),
        JSON.stringify(intel.rows),
      ]
    );

    await query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id) VALUES ($1,'GENERATE_BRIEF','brief',$2)`,
      [req.user.id, savedBrief.rows[0].id]
    );

    res.json({ brief: savedBrief.rows[0], content });
  } catch (err) {
    console.error('[BRIEF/GENERATE]', err);
    res.status(500).json({ error: err.message || 'BRIEF GENERATION FAILED' });
  }
});

// GET /api/brief/history
router.get('/history', async (req, res) => {
  try {
    const result = await query(
      `SELECT b.id, b.brief_type, b.classification, b.status, b.generated_at,
              u.name AS generated_by_name
       FROM briefs b LEFT JOIN users u ON b.generated_by = u.id
       ORDER BY b.generated_at DESC LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

// GET /api/brief/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM briefs WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'BRIEF NOT FOUND' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

// PUT /api/brief/:id/status
router.put('/:id/status', requireRole('DIRECTOR','ANALYST'), async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['GENERATED','REVIEWED','SENT','ARCHIVED'];
  if (!validStatuses.includes(status))
    return res.status(400).json({ error: 'INVALID STATUS' });
  try {
    const extra = status === 'REVIEWED' ? ', reviewed_at = NOW()' : status === 'SENT' ? ', sent_at = NOW()' : '';
    const result = await query(
      `UPDATE briefs SET status = $1${extra} WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

async function getDashboardMetrics() {
  const active  = await query("SELECT COUNT(*) FROM threats WHERE status IN ('ACTIVE','MONITORING')");
  const mtd     = await query("SELECT COUNT(*) FROM threats WHERE logged_at > date_trunc('month', NOW())");
  const total   = await query('SELECT COUNT(*) FROM threats');
  const resolved= await query("SELECT COUNT(*) FROM threats WHERE status IN ('CONTAINED','RESOLVED')");
  const rate    = total.rows[0].count > 0
    ? Math.round((resolved.rows[0].count / total.rows[0].count) * 100)
    : 100;
  return {
    active_threats:  parseInt(active.rows[0].count),
    incidents_mtd:   parseInt(mtd.rows[0].count),
    response_rate:   rate,
    production_bpd:  '1,670,000',
    target_bpd:      '2,060,000',
    daily_loss_usd:  '24.5',
  };
}

module.exports = router;
