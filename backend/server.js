const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ملفات static (واجهة المستخدم)
app.use(express.static(path.join(__dirname, "../public"))); // public بدلاً من frontend

// إعداد رفع الملفات
const upload = multer({ dest: "uploads/" });

// بيانات تجريبية للمستخدمين
let users = [
  { id: 1, username: "user1", password: "123", subscribed: false },
  { id: 2, username: "user2", password: "123", subscribed: true }
];

// الأدمن
const ADMIN_USER = "admin";
const ADMIN_PASS = "RESIST_ADMIN_PRO";

// Middleware الأدمن
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect("/login");
}

// Middleware تسجيل دخول المستخدم
function requireLogin(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).send("يلزمك تسجيل الدخول");
}

// Middleware التحقق من الاشتراك
function requireSubscription(req, res, next) {
  const user = users.find(u => u.id === req.session.userId);
  if (user && user.subscribed) return next();
  return res.status(403).send("اشتراكك غير مفعل. تواصل مع الأدمن");
}

// صفحة الادمن
app.use("/admin", express.static(path.join(__dirname, "private")));

// رفع الملفات (محمي بالاشتراك)
app.post("/upload", requireLogin, requireSubscription, upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).send("لم يتم رفع أي ملف");

  const input = req.file.path;
  const output = `processed_${Date.now()}.mp4`;

  // مثال على المعالجة بالـ ffmpeg (تعديل حسب حاجتك)
  const cmd = `ffmpeg -i ${input} -filter:v "minterpolate='fps=60'" -preset veryfast ${output}`;
  const { exec } = require("child_process");
  exec(cmd, (err) => {
    if (err) return res.status(500).send("حدث خطأ في المعالجة");
    res.download(output);
  });
});

// تسجيل دخول المستخدم العادي
app.post("/user-login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    req.session.userId = user.id;
    return res.send("تم تسجيل الدخول بنجاح");
  }
  res.status(401).send("بيانات غير صحيحة");
});

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html")); // public هنا
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
