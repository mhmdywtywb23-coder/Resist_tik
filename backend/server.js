const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ إعداد المسارات
const publicPath = path.join(__dirname, "../public");
const privatePath = path.join(__dirname, "private");

// ✅ ميدل وير
app.use(cors());
app.use(express.json());
app.use(express.static(publicPath));

// ✅ صفحة الدخول للأدمن
app.get("/login", (req, res) => {
  res.sendFile(path.join(privatePath, "login.html"));
});

// ✅ لوحة الأدمن
app.get("/admin", (req, res) => {
  res.sendFile(path.join(privatePath, "admin.html"));
});

// ✅ صفحة عامة (واجهة المستخدم)
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ✅ إعداد التخزين للفيديوهات المرفوعة
const upload = multer({ dest: "uploads/" });

// ✅ معالجة الفيديوهات باستخدام ffmpeg
app.post("/process-video", upload.single("video"), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = `processed/${Date.now()}_processed.mp4`;

  // تأكد أن المجلد موجود
  if (!fs.existsSync("processed")) fs.mkdirSync("processed");

  ffmpeg(inputPath)
    .videoCodec("libx264")
    .fps(30)
    .on("start", (cmd) => console.log("Started:", cmd))
    .on("progress", (p) => console.log(`Processing: ${p.percent}%`))
    .on("end", () => {
      fs.unlinkSync(inputPath); // نحذف الملف الأصلي
      res.download(outputPath, "processed_video.mp4", () => {
        fs.unlinkSync(outputPath); // نحذف الناتج بعد التنزيل
      });
    })
    .on("error", (err) => {
      console.error("❌ ffmpeg error:", err.message);
      res.status(500).send("Error during video processing.");
    })
    .save(outputPath);
});

// ✅ مسار احتياطي للأخطاء 404
app.use((req, res) => {
  res.status(404).send("الصفحة غير موجودة ⚠️");
});

// ✅ تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
