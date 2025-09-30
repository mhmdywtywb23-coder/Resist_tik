const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'RESIST_ADMIN_1';

// Basic auth middleware for admin routes
app.use((req, res, next) => {
  const adminPaths = ['/admin.html', '/dashboard.html', '/admin'];
  if (adminPaths.includes(req.path) || req.path.startsWith('/admin')) {
    const auth = req.headers.authorization;
    if (!auth) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin Area"');
      return res.status(401).send('Authentication required');
    }
    const token = auth.split(' ')[1] || '';
    const [user, pass] = Buffer.from(token, 'base64').toString().split(':');
    if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
    return res.status(403).send('Forbidden');
  }
  next();
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const inputPath = req.file.path;
  const safeBase = 'processed-' + req.file.filename.replace(/[^a-zA-Z0-9.\-]/g, '_') + '.mp4';
  const outputPath = path.join(uploadDir, safeBase);

  ffmpeg(inputPath)
    .outputOptions(['-c:v libx264', '-preset fast', '-crf 23', '-c:a aac', '-movflags +faststart'])
    .on('end', () => {
      try { fs.unlinkSync(inputPath); } catch(e) {}
      return res.json({ message: 'uploaded', url: `/uploads/${safeBase}` });
    })
    .on('error', (err) => {
      console.error('FFmpeg error:', err);
      const fallbackUrl = `/uploads/${path.basename(inputPath)}`;
      return res.status(500).json({ error: 'Video processing failed', fallback: fallbackUrl });
    })
    .save(outputPath);
});

app.post('/api/redeem', (req, res) => {
  const { code, email } = req.body;
  if (!code || !email) return res.status(400).json({ error: 'code and email required' });
  const codesFile = path.join(__dirname, 'codes.json');
  let codes = {};
  try { codes = JSON.parse(fs.readFileSync(codesFile)); } catch(e){ codes = {}; }

  let planFound = null;
  for (const plan of Object.keys(codes)) {
    const idx = codes[plan].indexOf(code);
    if (idx !== -1) {
      planFound = plan;
      codes[plan].splice(idx, 1);
      break;
    }
  }
  if (!planFound) return res.status(400).json({ error: 'Invalid or used code' });
  fs.writeFileSync(codesFile, JSON.stringify(codes, null, 2));

  const durationDays = planFound === 'Basic' ? 7 : planFound === 'Pro' ? 30 : 90;
  const start = new Date();
  const expiry = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const subsFile = path.join(__dirname, 'subscriptions.json');
  let subs = [];
  try { subs = JSON.parse(fs.readFileSync(subsFile)); } catch(e){ subs = []; }
  subs.push({ email, plan: planFound, start: start.toISOString(), expiry: expiry.toISOString() });
  fs.writeFileSync(subsFile, JSON.stringify(subs, null, 2));

  return res.json({ message: 'activated', plan: planFound, expiry: expiry.toISOString() });
});

app.post('/api/subscribe', (req, res) => {
  const { email, plan } = req.body;
  if (!email || !plan) return res.status(400).json({ error: 'email and plan required' });
  const durationDays = plan === 'Basic' ? 7 : plan === 'Pro' ? 30 : 90;
  const start = new Date();
  const expiry = new Date(start.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const subsFile = path.join(__dirname, 'subscriptions.json');
  let subs = [];
  try { subs = JSON.parse(fs.readFileSync(subsFile)); } catch(e){ subs = []; }
  subs.push({ email, plan, start: start.toISOString(), expiry: expiry.toISOString() });
  fs.writeFileSync(subsFile, JSON.stringify(subs, null, 2));
  return res.json({ message: 'subscribed', email, plan, expiry: expiry.toISOString() });
});

app.get('/api/uploads', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Cannot read uploads' });
    const list = files.map(f => ({ file: f, url: `/uploads/${f}` }));
    res.json(list);
  });
});

app.get('/api/subscriptions', (req, res) => {
  const subsFile = path.join(__dirname, 'subscriptions.json');
  try { const subs = JSON.parse(fs.readFileSync(subsFile)); return res.json(subs); } catch(e){ return res.json([]); }
});

app.listen(PORT, () => console.log(`Resist_Tik_Pro_VIP listening on ${PORT}`));

// Admin-only route: generate a single code for a plan
app.post('/admin/generate-code', (req, res) => {
  const plan = req.body.plan;
  if(!plan) return res.status(400).json({ error: 'plan required' });
  const codesFile = path.join(__dirname, 'codes.json');
  let codes = {};
  try { codes = JSON.parse(fs.readFileSync(codesFile)); } catch(e){ codes = { Basic:[], Pro:[], Premium:[] }; }
  const rand = Math.random().toString(36).substr(2,6).toUpperCase();
  const code = plan.toUpperCase().slice(0,3) + '-' + Date.now().toString().slice(-5) + '-' + rand;
  if(!codes[plan]) codes[plan]=[];
  codes[plan].push(code);
  fs.writeFileSync(codesFile, JSON.stringify(codes, null, 2));
  res.json({ code });
});
