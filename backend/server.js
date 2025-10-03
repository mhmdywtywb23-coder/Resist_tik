const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات الجلسة
app.use(session({
  secret: 'RESIST_SECRET',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 } // شهر
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ملفات ثابتة
app.use(express.static(path.join(__dirname, 'frontend')));

// بيانات تجريبية للمستخدمين
let users = [
  { id: 1, username: 'user1', password: '123', subscribed: false },
  { id: 2, username: 'user2', password: '123', subscribed: true }
];

// الأدمن
const ADMIN_USER = "admin";
const ADMIN_PASS = "RESIST_ADMIN_PRO";

// مصادقة الأدمن
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect('/login');
}

// التحقق من تسجيل دخول المستخدم
function requireLogin(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).send('يلزمك تسجيل الدخول');
}

// التحقق من الاشتراك
function requireSubscription(req, res, next) {
  const user = users.find(u => u.id === req.session.userId);
  if (user && user.subscribed) return next();
  return res.status(403).send('اشتراكك غير مفعل. تواصل مع الأدمن');
}

// صفحة تسجيل دخول الأدمن
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'backend/private/login.html'));
});

// معالجة تسجيل دخول الأدمن
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.admin = true;
    return res.redirect('/admin');
  }
  res.send('بيانات الأدمن غير صحيحة');
});

// لوحة الأدمن
app.get('/admin', requireAdmin, (req, res) => {
  let html = `<h1>لوحة التحكم</h1><ul>`;
  users.forEach(u => {
    html += `<li>${u.username} - اشتراك: ${u.subscribed ? '✅ مفعل' : '❌ غير مفعل'}
      <form method="POST" action="/admin/toggle-subscription" style="display:inline;">
        <input type="hidden" name="userId" value="${u.id}">
        <input type="hidden" name="status" value="${!u.subscribed}">
        <button type="submit">${u.subscribed ? 'تعطيل' : 'تفعيل'}</button>
      </form>
    </li>`;
  });
  html += `</ul>`;
  res.send(html);
});

// تفعيل / تعطيل الاشتراك
app.post('/admin/toggle-subscription', requireAdmin, (req, res) => {
  const { userId, status } = req.body;
  const user = users.find(u => u.id == userId);
  if (user) {
    user.subscribed = (status === 'true');
  }
  res.redirect('/admin');
});

// رفع الملفات
const upload = multer({ dest: 'uploads/' });

// المعالجة - محمية بالاشتراك
app.post('/upload', requireLogin, requireSubscription, upload.single('video'), (req, res) => {
  const input = req.file.path;
  const output = `processed_${Date.now()}.mp4`;

  const cmd = `ffmpeg -i ${input} -filter:v "minterpolate='fps=60'" -preset veryfast ${output}`;

  exec(cmd, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('حدث خطأ في المعالجة');
    }
    res.download(output);
  });
});

// تسجيل دخول المستخدم العادي
app.post('/user-login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.userId = user.id;
    return res.send('تم تسجيل الدخول بنجاح');
  }
  res.status(401).send('بيانات غير صحيحة');
});

// الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
