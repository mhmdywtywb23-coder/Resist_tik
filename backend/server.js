const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const session = require('express-session');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ secret: 'secretKey', resave: false, saveUninitialized: true }));

// --- ملف ثابت للأدمن ---
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'RESIST_ADMIN_PRO';

// --- مصفوفة الأكواد ---
let codes = []; // كل عنصر: { code: "RESIST_123", expires: timestamp }

// --- middleware للأدمن ---
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminLoggedIn) return next();
  return res.redirect('/login');
}

// --- login page ---
app.get('/login', (req,res)=>{
  res.sendFile(path.join(__dirname,'backend/private/login.html'));
});

app.post('/login', (req,res)=>{
  const { username, password } = req.body;
  if(username === ADMIN_USER && password === ADMIN_PASS){
    req.session.adminLoggedIn = true;
    return res.redirect('/admin');
  }
  res.send('يوزر أو باسورد خطأ');
});

// --- admin page ---
app.get('/admin', requireAdmin, (req,res)=>{
  res.sendFile(path.join(__dirname,'backend/private/index.html'));
});

// --- دالة توليد الكود RESIST_### ---
function generateRandomCode(lengthDigits = 3) {
  const num = Math.floor(Math.random() * Math.pow(10, lengthDigits));
  const padded = String(num).padStart(lengthDigits, '0');
  return `RESIST_${padded}`;
}

// --- إنشاء كود جديد ---
function createCode(days = 1) {
  const code = generateRandomCode(3);
  const expires = Date.now() + Number(days) * 24 * 60 * 60 * 1000;
  codes.push({ code, expires });
  return { code, expires };
}

// --- endpoint للأدمن لإنشاء الكود ---
app.post('/admin/create-code', requireAdmin, (req,res)=>{
  const days = Number(req.body.days) || 1;
  const { code, expires } = createCode(days);
  res.json({ code, expires });
});

// --- تحقق من الكود ---
function isCodeValid(inputCode){
  if(!inputCode) return false;
  const c = codes.find(x => x.code === inputCode);
  if(!c) return false;
  return c.expires > Date.now();
}

// --- إعداد multer ---
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// --- endpoint رفع الفيديو ---
app.post("/upload", upload.single("video"), (req,res)=>{
  const userCode = req.body.code;
  if(!isCodeValid(userCode)) return res.status(403).send("الكود غير صحيح أو انتهت مدته");

  const input = req.file.path;
  const output = path.join(__dirname,'uploads','processed_' + Date.now() + '.mp4');
  const cmd = `ffmpeg -i ${input} -filter:v "minterpolate='fps=60'" -preset veryfast ${output}`;

  exec(cmd, (err)=>{
    if(err){
      console.error(err);
      return res.status(500).send('حدث خطأ في المعالجة');
    }
    res.download(output);
  });
});

// --- static folders ---
app.use(express.static(path.join(__dirname,'public')));

// --- start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));
