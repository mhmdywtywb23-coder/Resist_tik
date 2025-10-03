const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processVideo } = require('./processing');

const app = express();
const PORT = process.env.PORT || 3000;

// كلمة السر للأدمن
const ADMIN_SECRET = "RESIST_ADMIN_PRO";

// Static files عامة
app.use(express.static(path.join(__dirname, '../public')));

// --- إعداد رفع الفيديوهات ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp'); // Render يستخدم /tmp للملفات المؤقتة
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// --- HTTP Basic Auth للأدمن ---
function parseBasicAuth(header) {
  if (!header || typeof header !== 'string') return null;
  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Basic') return null;
  try {
    const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    if (sep === -1) return null;
    return { user: decoded.slice(0, sep), pass: decoded.slice(sep + 1) };
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const cred = parseBasicAuth(req.headers['authorization']);
  if (!cred) {
    res.setHeader('WWW-Authenticate', 'Basic realm="RESIST_TIK_PRO Admin"');
    return res.status(401).send('Authentication required');
  }
  if (cred.user === 'admin' && cred.pass === ADMIN_SECRET) {
    return next();
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="RESIST_TIK_PRO Admin"');
  return res.status(401).send('Invalid credentials');
}

// --- Route محمي لصفحة الأدمن ---
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'private/admin.html'));
});

// --- API رفع ومعالجة الفيديو ---
app.post('/upload', upload.single('video'), async (req, res) => {
  try {
    const inputPath = req.file.path;
    const outputPath = `/tmp/processed_${Date.now()}.mp4`;

    await processVideo(inputPath, outputPath);

    res.download(outputPath, 'processed.mp4', (err) => {
      if (err) console.error('Download error:', err);
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  } catch (err) {
    console.error('Processing error:', err);
    res.status(500).send('Video processing failed.');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
