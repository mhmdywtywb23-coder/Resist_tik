const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processVideo } = require('./processing');

const app = express();
const PORT = process.env.PORT || 3000;

// كلمة السر للأدمن مباشرة
const ADMIN_SECRET = "RESIST_ADMIN_PRO";

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

// صفحة الأدمن
app.get('/admin.html', (req, res) => {
  const pass = req.query.pass;
  if (pass === ADMIN_SECRET) {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
  } else {
    res.status(401).send('Wrong password');
  }
});

// API لرفع ومعالجة الفيديو
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
