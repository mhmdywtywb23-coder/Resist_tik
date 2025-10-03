const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const ADMIN_USER = "admin";
const ADMIN_PASS = "RESIST_ADMIN_PRO";
const COOKIE_NAME = "admin_logged_in";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 يوم

// صفحة login
app.get("/admin", (req, res) => {
  if (req.cookies[COOKIE_NAME] === "true") {
    return res.sendFile(path.join(__dirname, "private", "admin.html"));
  }
  res.sendFile(path.join(__dirname, "private", "login.html"));
});

// التحقق من اليوزر والباس
app.post("/admin", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.cookie(COOKIE_NAME, "true", { maxAge: COOKIE_MAX_AGE, httpOnly: true });
    return res.redirect("/admin");
  } else {
    return res.send("Username أو Password خطأ");
  }
});

// مثال Route لمعالجة الفيديوهات
app.get("/process-video", (req, res) => {
  if (req.cookies[COOKIE_NAME] !== "true") return res.status(401).send("Unauthorized");
  res.send("هنا تعالج الفيديوهات");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
