
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

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
      return res.status(500).json({ error: 'Video processing failed' });
    })
    .save(outputPath);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
