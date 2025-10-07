const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, "../public"))); // ملفات الواجهة

// إعداد مجلدات التخزين
const upload = multer({ dest: path.join(__dirname, "../uploads/") });
const processedDir = path.join(__dirname, "../processed/");
if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir);

const codesFile = path.join(__dirname, "private", "codes.json");

// حفظ كود جديد
app.post("/api/add-code", (req, res) => {
  const { code, days } = req.body;
  if (!code || !days) return res.status(400).json({ message: "بيانات ناقصة" });

  const expires = Date.now() + days * 24 * 60 * 60 * 1000;
  let codes = [];

  if (fs.existsSync(codesFile)) {
    codes = JSON.parse(fs.readFileSync(codesFile));
  }

  codes.push({ code, expires });
  fs.writeFileSync(codesFile, JSON.stringify(codes, null, 2));
  res.json({ message: "تم حفظ الكود بنجاح" });
});

// التحقق من الكود
app.post("/api/check-code", (req, res) => {
  const { code } = req.body;
  if (!fs.existsSync(codesFile)) return res.json({ valid: false });

  const codes = JSON.parse(fs.readFileSync(codesFile));
  const found = codes.find(c => c.code === code);

  if (!found) return res.json({ valid: false });

  if (Date.now() > found.expires) {
    return res.json({ valid: false, message: "انتهت صلاحية الكود" });
  }

  res.json({ valid: true });
});

// رفع فيديو ومعالجته
app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) return res.status(400).send("لم يتم رفع الفيديو");

  const inputPath = req.file.path;
  const outputPath = path.join(processedDir, req.file.filename + ".mp4");

  ffmpeg(inputPath)
    .outputOptions(["-r 30"]) // معالجة على 30fps
    .save(outputPath)
    .on("end", () => {
      res.json({ message: "تمت المعالجة بنجاح", file: outputPath });
      fs.unlinkSync(inputPath); // حذف الفيديو الأصلي بعد المعالجة
    })
    .on("error", (err) => {
      console.error(err);
      res.status(500).send("حدث خطأ أثناء المعالجة");
    });
});

// صفحة الأدمن
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "private", "admin.html"));
});

// أي طلب غير موجود يرجع index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// تشغيل السيرفر
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port", process.env.PORT || 3000);
});
