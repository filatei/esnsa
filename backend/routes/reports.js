const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { query } = require('../db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random()*1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*, u.name AS author_name FROM reports r
       LEFT JOIN users u ON r.author_id = u.id ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  const { title, type, related_threat } = req.body;
  if (!req.file) return res.status(400).json({ error: 'FILE REQUIRED' });
  try {
    const result = await query(
      `INSERT INTO reports (title, type, author_id, file_path, file_name, file_size, related_threat)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, type, req.user.id, req.file.path, req.file.originalname, req.file.size, related_threat || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

router.get('/:id/download', async (req, res) => {
  try {
    const result = await query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'REPORT NOT FOUND' });
    const report = result.rows[0];
    res.download(report.file_path, report.file_name);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const result = await query(
      'UPDATE reports SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
  }
});

module.exports = router;
