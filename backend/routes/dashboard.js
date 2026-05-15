const express = require('express');
const { query } = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/metrics', async (req, res) => {
  try {
    const active   = await query("SELECT COUNT(*) FROM threats WHERE status IN ('ACTIVE','MONITORING')");
    const mtd      = await query("SELECT COUNT(*) FROM threats WHERE logged_at > date_trunc('month', NOW())");
    const agencies = await query("SELECT COUNT(DISTINCT agency_name) FROM threat_agencies ta JOIN threats t ON ta.threat_id = t.id WHERE t.status IN ('ACTIVE','MONITORING')");
    const total    = await query('SELECT COUNT(*) FROM threats');
    const resolved = await query("SELECT COUNT(*) FROM threats WHERE status IN ('CONTAINED','RESOLVED')");
    const rate = total.rows[0].count > 0
      ? Math.round((resolved.rows[0].count / total.rows[0].count) * 100)
      : 100;

    res.json({
      active_threats:   parseInt(active.rows[0].count),
      production_bpd:   1670000,
      target_bpd:       2060000,
      daily_loss_usd:   24500000,
      incidents_mtd:    parseInt(mtd.rows[0].count),
      response_rate:    rate,
      agencies_active:  parseInt(agencies.rows[0].count) || 6,
    });
  } catch (err) {
    console.error('[DASHBOARD/METRICS]', err);
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

module.exports = router;
