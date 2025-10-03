const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/validate', (req, res) => {
  const { key, device_id } = req.body;
  if (!key) return res.status(400).json({ ok: false, error: 'missing key' });

  const row = db.prepare('SELECT * FROM license_keys WHERE key = ? AND active = 1').get(key);
  if (!row) return res.status(404).json({ ok: false, error: 'invalid key' });

  const now = Date.now();
  if (row.expires_at && now > row.expires_at) {
    return res.status(403).json({ ok: false, error: 'expired' });
  }

  if (!row.bound_device && device_id) {
    db.prepare('UPDATE license_keys SET bound_device = ? WHERE key = ?').run(device_id, key);
  } else if (row.bound_device && device_id && row.bound_device !== device_id) {
    return res.status(403).json({ ok: false, error: 'bound to another device' });
  }

  res.json({ ok: true, key: row.key, expires_at: row.expires_at, created_at: row.created_at });
});

module.exports = router;