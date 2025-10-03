const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const fs = require('fs');
const { spawn } = require('child_process');

const UP = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
const OUT = process.env.OUTPUT_DIR || path.join(__dirname, '..', 'jobs');

const upload = multer({
  dest: UP,
  limits: { fileSize: 200 * 1024 * 1024 } // 200 MB
});

const router = express.Router();

function processVideo(jobId, inputPath, outputPath) {
  // Use minterpolate to generate intermediate frames (creates smooth motion like 60fps),
  // then store final file at 30fps to keep size reasonable.
  // vf string: minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:vsbmc=1,scale=...,pad=...,setsar=1
  const vf = "minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:vsbmc=1,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1";
  const args = [
    '-y',
    '-i', inputPath,
    '-vf', vf,
    '-r', '30',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '24',
    '-c:a', 'aac',
    outputPath
  ];

  const ff = spawn('ffmpeg', args);

  const now = Date.now();
  db.prepare('UPDATE jobs SET status=?, updated_at=?, message=? WHERE id=?')
    .run('processing', now, 'started ffmpeg', jobId);

  ff.stderr.on('data', (d) => {
    const msg = d.toString();
    db.prepare('UPDATE jobs SET message=?, updated_at=? WHERE id=?').run(msg.slice(0, 400), Date.now(), jobId);
  });
  ff.on('exit', (code) => {
    const now2 = Date.now();
    if (code === 0) {
      db.prepare('UPDATE jobs SET status=?, output_path=?, updated_at=?, message=? WHERE id=?')
        .run('done', outputPath, now2, 'completed', jobId);
    } else {
      db.prepare('UPDATE jobs SET status=?, updated_at=?, message=? WHERE id=?')
        .run('failed', now2, 'ffmpeg failed with code ' + code, jobId);
    }
  });
}

router.post('/', upload.single('file'), (req, res) => {
  const key = req.body.key;
  if (!key) return res.status(400).json({ ok: false, error: 'license key required' });

  const krow = db.prepare('SELECT * FROM license_keys WHERE key = ? AND active = 1').get(key);
  if (!krow) return res.status(403).json({ ok: false, error: 'invalid key' });
  if (krow.expires_at && Date.now() > krow.expires_at) return res.status(403).json({ ok: false, error: 'expired key' });

  if (!req.file) return res.status(400).json({ ok: false, error: 'no file' });

  const jobId = uuidv4();
  const inputPath = req.file.path;
  const outputFilename = `${jobId}_tiktok.mp4`;
  const outputPath = path.join(OUT, outputFilename);

  const now = Date.now();
  db.prepare('INSERT INTO jobs (id, user_key, input_path, output_path, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?)')
    .run(jobId, key, inputPath, outputPath, 'queued', now, now);

  setImmediate(() => processVideo(jobId, inputPath, outputPath));

  res.json({ ok: true, jobId });
});

module.exports = router;