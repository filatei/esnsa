const CLEARANCE_RANK = {
  'TOP SECRET':    4,
  'SECRET':        3,
  'CONFIDENTIAL':  2,
  'RESTRICTED':    1,
  'SYSTEM':        5,
};

/**
 * requireRole('DIRECTOR', 'ANALYST') — user must have one of these roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'AUTHENTICATION REQUIRED' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'INSUFFICIENT CLEARANCE' });
    }
    next();
  };
}

/**
 * requireClearance('SECRET') — user clearance rank must be >= required level
 */
function requireClearance(level) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'AUTHENTICATION REQUIRED' });
    const userRank     = CLEARANCE_RANK[req.user.clearance] || 0;
    const requiredRank = CLEARANCE_RANK[level] || 0;
    if (userRank < requiredRank) {
      return res.status(403).json({ error: 'INSUFFICIENT CLEARANCE' });
    }
    next();
  };
}

module.exports = { requireRole, requireClearance };
