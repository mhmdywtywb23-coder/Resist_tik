const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const { processVideo } = require('./processing');

const app = express();
const PORT = process.env.PORT || 3000;

// كلمة السر للأدمن
const ADMIN_SECRET = "RESIST_ADMIN_PRO";

// Middleware للكوكي
app.use(cookieParser());

// ملفات ثابتة عامة
app.use(express.static(path.join(__dirname, '../public')));

// إعداد رفع الفيديوهات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// --- Middleware حماية الأدمن ---
function requireAdmin(req, res, next) {
  // تحقق من الكوكي أولاً
  if (req.cookies && req.cookies.auth === 'true') return next();

  // HTTP Basic Auth
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.setHeader('WWW-Authenticate', 'Basic realm="RESIST_TIK_PRO Admin"');
    return res.status(401).send('Authentication required');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Basic') return res.status(401).send('Invalid credentials');

  const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
  const [user, pass] = decoded.split(':');

  if (user === 'admin' && pass === ADMIN_SECRET) {
    // حفظ الدخول لمدة 30 يوم
    res.cookie('auth', 'true', { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
    return next();
  }

  res.setHeader('WWW-Authenticate', 'Basic realm="RESIST_TIK_PRO Admin"');
  return res.status(401).send('Invalid credentials');
}

// --- صفحة الأدمن ---
app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'private/admin.html'));
});

// --- أي Routes إضافية داخل الأدمن ---
app.post('/upload', requireAdmin, upload.single('video'), async (req, res) => {
  try {
    const inputPath = req.file.path;
    const outputPath = `/tmp/processed_${Date.now()}.mp4`;

    await processVideo(inputPath, outputPath);

    res.download(outputPath, 'processed.mp4', (err) => {
      if (err) console.error(err);
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Video processing failed.');
  }
});

// أي صفحات إضافية داخل الأدمن يجب أن تستخدم نفس middleware
app.get('/admin/settings', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'private/settings.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
