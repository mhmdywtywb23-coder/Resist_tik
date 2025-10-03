const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const router = express.Router();

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin_secret';

function checkAdmin(req, res) {
  const secret = req.headers['x-admin-secret'] || req.body.admin_secret || req.query.admin_secret;
  if (!secret || secret !== ADMIN_SECRET) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return false;
  }
  return true;
}

router.post('/create', (req, res) => {
  if (!checkAdmin(req, res)) return;
  const days = parseInt(req.body.days || process.env.LICENSE_EXP_DAYS || 30);
  const id = uuidv4();
  const key = 'RTP-' + Math.random().toString(36).slice(2, 10).toUpperCase();
  const now = Date.now();
  const expires = now + days * 24 * 60 * 60 * 1000;

  db.prepare('INSERT INTO license_keys (id, key, days, created_at, expires_at) VALUES (?,?,?,?,?)')
    .run(id, key, days, now, expires);

  res.json({ ok: true, key, expires_at: expires, days });
});

router.get('/list', (req, res) => {
  if (!checkAdmin(req, res)) return;
  const rows = db.prepare('SELECT id,key,days,created_at,expires_at,active,bound_device FROM license_keys ORDER BY created_at DESC').all();
  res.json({ ok: true, keys: rows });
});

router.post('/disable', (req, res) => {
  if (!checkAdmin(req, res)) return;
  const key = req.body.key;
  if (!key) return res.status(400).json({ ok: false });
  db.prepare('UPDATE license_keys SET active = 0 WHERE key = ?').run(key);
  res.json({ ok: true });
});

module.exports = router;