const { query } = require('../db');

/**
 * Logs every authenticated request to audit_log.
 * Attach AFTER requireAuth so req.user is populated.
 */
module.exports = function auditLog(req, res, next) {
  if (!req.user) return next();
  const action = `${req.method} ${req.path}`;
  const ip = req.ip || req.connection?.remoteAddress;
  const ua = req.headers['user-agent'] || '';

  query(
    `INSERT INTO audit_log (user_id, action, ip_address, user_agent)
     VALUES ($1, $2, $3, $4)`,
    [req.user.id, action, ip, ua]
  ).catch(err => console.error('[AUDIT]', err.message));

  next();
};
