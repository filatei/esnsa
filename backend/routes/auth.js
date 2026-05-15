const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const { query }= require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();

/* ═══════════════════════════════════════════════════════
   PASSWORD AUTH
═══════════════════════════════════════════════════════ */

router.post('/login', async (req, res) => {
  const { officer_id, password } = req.body;
  if (!officer_id || !password)
    return res.status(400).json({ error: 'OFFICER ID AND ACCESS CODE REQUIRED' });
  try {
    const result = await query(
      'SELECT * FROM users WHERE officer_id = $1 AND is_active = true',
      [officer_id.toUpperCase()]
    );
    if (!result.rows.length) return res.status(401).json({ error: 'AUTHENTICATION FAILED' });
    const user = result.rows[0];
    if (!await bcrypt.compare(password, user.password_hash))
      return res.status(401).json({ error: 'AUTHENTICATION FAILED' });
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const ip = req.ip || req.connection?.remoteAddress;
    await query(
      `INSERT INTO audit_log (user_id, action, ip_address, user_agent, details)
       VALUES ($1,'LOGIN',$2,$3,$4)`,
      [user.id, ip, req.headers['user-agent'] || '', JSON.stringify({ officer_id })]
    );
    const payload = { id:user.id, officer_id:user.officer_id, name:user.name, role:user.role, clearance:user.clearance };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    res.json({ token, user: payload });
  } catch (err) {
    console.error('[AUTH/LOGIN]', err);
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress;
    await query(`INSERT INTO audit_log (user_id, action, ip_address) VALUES ($1,'LOGOUT',$2)`, [req.user.id, ip]);
    res.json({ message: 'SESSION TERMINATED' });
  } catch (err) { res.status(500).json({ error: 'INTERNAL SERVER ERROR' }); }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, officer_id, name, role, clearance, last_login FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0] || {});
  } catch (err) { res.status(500).json({ error: 'INTERNAL SERVER ERROR' }); }
});

/* ═══════════════════════════════════════════════════════
   WEBAUTHN / FACE ID
═══════════════════════════════════════════════════════ */

const RP_ID     = process.env.RP_ID     || 'esnsa.torama.money';
const RP_ORIGIN = process.env.RP_ORIGIN || 'https://esnsa.torama.money';
const RP_NAME   = 'ESNSA Energy Security Portal';

// Lazy-load the ESM-compat package
let _wlib = null;
async function wauthn() {
  if (_wlib) return _wlib;
  _wlib = require('@simplewebauthn/server');
  return _wlib;
}

// In-memory challenge store with 5-min TTL
const _challenges = new Map();
function storeChallenge(key, ch) { _challenges.set(key, { ch, exp: Date.now() + 300_000 }); }
function popChallenge(key) {
  const e = _challenges.get(key); _challenges.delete(key);
  return (!e || Date.now() > e.exp) ? null : e.ch;
}

// ── Registration (requires valid JWT) ────────────────────

router.post('/webauthn/register-options', requireAuth, async (req, res) => {
  try {
    const { generateRegistrationOptions } = await wauthn();
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];
    const existing = await query(
      'SELECT credential_id, transports FROM webauthn_credentials WHERE user_id = $1', [user.id]
    );
    const options = await generateRegistrationOptions({
      rpName: RP_NAME, rpID: RP_ID,
      userID: Buffer.from(user.id.replace(/-/g,''), 'hex'),
      userName: user.officer_id, userDisplayName: user.name,
      attestationType: 'none',
      excludeCredentials: existing.rows.map(c => ({
        id: Buffer.from(c.credential_id, 'base64url'), type: 'public-key', transports: c.transports || []
      })),
      authenticatorSelection: { authenticatorAttachment:'platform', userVerification:'required', residentKey:'preferred' },
    });
    storeChallenge(`reg:${user.id}`, options.challenge);
    res.json(options);
  } catch (err) { console.error('[WEBAUTHN/REG-OPT]', err); res.status(500).json({ error: 'FAILED TO GENERATE OPTIONS' }); }
});

router.post('/webauthn/register', requireAuth, async (req, res) => {
  try {
    const { verifyRegistrationResponse } = await wauthn();
    const expectedChallenge = popChallenge(`reg:${req.user.id}`);
    if (!expectedChallenge) return res.status(400).json({ error: 'CHALLENGE EXPIRED' });

    const { verified, registrationInfo } = await verifyRegistrationResponse({
      response: req.body, expectedChallenge, expectedOrigin: RP_ORIGIN, expectedRPID: RP_ID,
    });
    if (!verified) return res.status(400).json({ error: 'BIOMETRIC VERIFICATION FAILED' });

    const { credentialPublicKey, credentialID, counter,
            credentialDeviceType, credentialBackedUp, authenticatorTransports } = registrationInfo;

    await query(
      `INSERT INTO webauthn_credentials (user_id,credential_id,public_key,counter,device_type,backed_up,transports)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (credential_id) DO UPDATE SET counter=$4`,
      [
        req.user.id,
        Buffer.from(credentialID).toString('base64url'),
        Buffer.from(credentialPublicKey).toString('base64url'),
        counter, credentialDeviceType || 'platform',
        credentialBackedUp || false, authenticatorTransports || [],
      ]
    );
    const ip = req.ip || req.connection?.remoteAddress;
    await query(
      `INSERT INTO audit_log (user_id,action,ip_address,details) VALUES ($1,'WEBAUTHN_REGISTER',$2,$3)`,
      [req.user.id, ip, JSON.stringify({ device: credentialDeviceType })]
    );
    res.json({ verified: true, message: 'BIOMETRIC CREDENTIAL REGISTERED' });
  } catch (err) { console.error('[WEBAUTHN/REG]', err); res.status(500).json({ error: 'REGISTRATION FAILED' }); }
});

// ── Authentication (public) ──────────────────────────────

router.post('/webauthn/authenticate-options', async (req, res) => {
  const { officer_id } = req.body;
  if (!officer_id) return res.status(400).json({ error: 'OFFICER ID REQUIRED' });
  try {
    const { generateAuthenticationOptions } = await wauthn();
    const ur = await query('SELECT id FROM users WHERE officer_id=$1 AND is_active=true', [officer_id.toUpperCase()]);
    if (!ur.rows.length) return res.status(404).json({ error: 'OFFICER NOT FOUND' });

    const creds = await query(
      'SELECT credential_id, transports FROM webauthn_credentials WHERE user_id=$1', [ur.rows[0].id]
    );
    if (!creds.rows.length)
      return res.status(404).json({ error: 'NO BIOMETRIC CREDENTIAL REGISTERED — USE PASSWORD LOGIN' });

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: creds.rows.map(c => ({
        id: Buffer.from(c.credential_id, 'base64url'), type: 'public-key', transports: c.transports || []
      })),
      userVerification: 'required',
    });
    storeChallenge(`auth:${officer_id.toUpperCase()}`, options.challenge);
    res.json(options);
  } catch (err) { console.error('[WEBAUTHN/AUTH-OPT]', err); res.status(500).json({ error: 'FAILED TO GENERATE OPTIONS' }); }
});

router.post('/webauthn/authenticate', async (req, res) => {
  const { officer_id, ...assertion } = req.body;
  if (!officer_id) return res.status(400).json({ error: 'OFFICER ID REQUIRED' });
  try {
    const { verifyAuthenticationResponse } = await wauthn();
    const expectedChallenge = popChallenge(`auth:${officer_id.toUpperCase()}`);
    if (!expectedChallenge) return res.status(400).json({ error: 'CHALLENGE EXPIRED — TRY AGAIN' });

    const ur = await query('SELECT * FROM users WHERE officer_id=$1 AND is_active=true', [officer_id.toUpperCase()]);
    if (!ur.rows.length) return res.status(401).json({ error: 'AUTHENTICATION FAILED' });
    const user = ur.rows[0];

    const cr = await query('SELECT * FROM webauthn_credentials WHERE user_id=$1', [user.id]);
    const credId   = assertion.rawId || assertion.id;
    const credential = cr.rows.find(c => c.credential_id === credId);
    if (!credential) return res.status(401).json({ error: 'CREDENTIAL NOT FOUND' });

    const { verified, authenticationInfo } = await verifyAuthenticationResponse({
      response: assertion, expectedChallenge,
      expectedOrigin: RP_ORIGIN, expectedRPID: RP_ID,
      authenticator: {
        credentialID:        Buffer.from(credential.credential_id, 'base64url'),
        credentialPublicKey: Buffer.from(credential.public_key,    'base64url'),
        counter:             Number(credential.counter),
        transports:          credential.transports || [],
      },
    });
    if (!verified) return res.status(401).json({ error: 'BIOMETRIC VERIFICATION FAILED' });

    await query('UPDATE webauthn_credentials SET counter=$1 WHERE id=$2', [authenticationInfo.newCounter, credential.id]);
    await query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);

    const ip = req.ip || req.connection?.remoteAddress;
    await query(
      `INSERT INTO audit_log (user_id,action,ip_address,user_agent,details) VALUES ($1,'LOGIN_WEBAUTHN',$2,$3,$4)`,
      [user.id, ip, req.headers['user-agent']||'', JSON.stringify({ officer_id, method:'webauthn' })]
    );

    const payload = { id:user.id, officer_id:user.officer_id, name:user.name, role:user.role, clearance:user.clearance };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    res.json({ token, user: payload });
  } catch (err) { console.error('[WEBAUTHN/AUTH]', err); res.status(500).json({ error: 'BIOMETRIC AUTHENTICATION FAILED' }); }
});

module.exports = router;
