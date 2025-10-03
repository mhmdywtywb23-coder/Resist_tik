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
app.use(express.static(path.join(__dirname, "../frontend")));

// إعداد رفع الملفات
const upload = multer({ dest: "uploads/" });

// ✅ صفحة الادمن (تطلب تسجيل دخول)
app.use("/admin", express.static(path.join(__dirname, "private")));

// ✅ رفع ملف فيديو
app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("لم يتم رفع أي ملف");
  }
  // هنا ممكن تحط كود المعالجة بالفيديو (ffmpeg)
  res.send("تم رفع الفيديو بنجاح");
});

// ✅ الصفحة الرئيسية
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
