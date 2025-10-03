require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// مجلدات
const UP = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const OUT = process.env.OUTPUT_DIR || path.join(__dirname, 'jobs');
if (!fs.existsSync(UP)) fs.mkdirSync(UP, { recursive: true });
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

// راوتات
app.use('/api/upload', require('./routes/upload'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/keys', require('./routes/keys'));
app.use('/api/jobs', require('./routes/jobs'));

// صفحات ثابتة
app.use('/', express.static(path.join(__dirname, '..', 'public')));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`RESIST_TIK_PRO server listening on port ${port}`);
});