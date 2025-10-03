require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const ADMIN_SECRET = process.env.ADMIN_SECRET || "RESIST_Admin_Proo";

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// صفحة الواجهة
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));

// لوحة الأدمن
app.get('/admin.html', (req, res) => {
    const pass = req.query.pass;
    if(pass === ADMIN_SECRET) return res.send('Admin Panel');
    res.send('Wrong password');
});

// رفع ومعالجة الفيديو
app.post('/upload', (req, res) => {
    // الكود لمعالجة الفيديو موجود في processing.js
    res.send('Video uploaded and processing started!');
});

app.listen(port, () => console.log(`Server running on port ${port}`));
