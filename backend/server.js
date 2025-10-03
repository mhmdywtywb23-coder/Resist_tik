const express = require('express');
const path = require('path');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// ملفات الستاتيك
app.use(express.static(path.join(__dirname, '../public')));

// مجلد الأدمن
const adminFolder = path.join(__dirname, 'private');

// إعدادات رفع الفيديو
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// صفحة المستخدم العادي
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// رفع الفيديو ومعالجته
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).send('لم يتم اختيار أي فيديو');

  const inputPath = req.file.path;
  const outputPath = 'processed/' + req.file.filename;

  ffmpeg(inputPath)
    .outputOptions(['-r 30'])
    .save(outputPath)
    .on('end', () => res.send('تم المعالجة بنجاح: ' + outputPath))
    .on('error', err => res.status(500).send('خطأ في المعالجة: ' + err.message));
});

// صفحة تسجيل دخول الأدمن
app.get('/admin', (req, res) => {
  res.sendFile(path.join(adminFolder, 'login.html'));
});

// التحقق من تسجيل الدخول للأدمن
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'RESIST_ADMIN_PRO') {
    res.cookie('admin_logged', true, { maxAge: 30*24*60*60*1000 });
    res.redirect('/admin/dashboard');
  } else {
    res.send('اسم المستخدم أو كلمة المرور خاطئة');
  }
});

// لوحة الأدمن
app.get('/admin/dashboard', (req, res) => {
  if (req.cookies.admin_logged) {
    res.sendFile(path.join(adminFolder, 'admin.html'));
  } else {
    res.redirect('/admin');
  }
});

// بدء السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
