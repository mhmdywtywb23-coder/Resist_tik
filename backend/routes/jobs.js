const express = require('express');
const db = require('../db');
const router = express.Router();
const path = require('path');

router.get('/:jobId', (req, res) => {
  const id = req.params.jobId;
  const row = db.prepare('SELECT id,user_key,input_path,output_path,status,created_at,updated_at,message FROM jobs WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ ok: false });
  const response = {
    id: row.id,
    status: row.status,
    message: row.message,
    created_at: row.created_at,
    updated_at: row.updated_at,
    download: row.status === 'done' ? `/api/jobs/download/${row.id}` : null
  };
  res.json({ ok: true, job: response });
});

router.get('/download/:jobId', (req, res) => {
  const id = req.params.jobId;
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ ok: false });
  if (row.status !== 'done') return res.status(400).json({ ok: false, error: 'not ready' });
  res.download(path.resolve(row.output_path));
});

module.exports = router;