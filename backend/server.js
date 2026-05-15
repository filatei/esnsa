require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3031;

// ── Security headers ──────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = [
  'https://esnsa.torama.money',
  'http://localhost:5173',
  'http://localhost:4173',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Body parser ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static file uploads ───────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/threats',     require('./routes/threats'));
app.use('/api/intel',       require('./routes/intel'));
app.use('/api/stakeholders',require('./routes/stakeholders'));
app.use('/api/messages',    require('./routes/messages'));
app.use('/api/brief',       require('./routes/brief'));
app.use('/api/reports',     require('./routes/reports'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/audit',       require('./routes/audit'));
app.use('/api/dashboard',   require('./routes/dashboard'));

// ── Health check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ESNSA-API', time: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'ENDPOINT NOT FOUND' });
});

// ── Global error handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'INTERNAL SERVER ERROR' });
});

app.listen(PORT, () => {
  console.log(`[ESNSA-API] Running on port ${PORT} — ${new Date().toISOString()}`);
});

module.exports = app;
