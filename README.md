# RESIST_TIK_PRO (Clone)
نسخة جاهزة للعمل مع FFmpeg مُثبت داخل الحاوية، وفلتر minterpolate لتنعيم الحركة (يشبه 60fps لكن ملف ناتج 30fps).

## تشغيل محلي
1. انتقل إلى مجلد backend:
   ```
   cd backend
   npm install
   cp .env.example .env
   ```
   عدّل .env (ضع ADMIN_SECRET قوي).

2. شغّل:
   ```
   npm run dev
   ```
3. افتح: http://localhost:3000

## تشغيل عبر Docker (موصى)
1. من جذر المشروع:
   ```
   docker build -t resist-tik-pro:latest .
   docker run -p 3000:3000 -e ADMIN_SECRET="YOUR_SECRET" resist-tik-pro:latest
   ```
2. افتح: http://localhost:3000

## نشر على Render
- ارفع المستودع إلى GitHub ثم اربطه بـ Render (استخدم Dockerfile من الجذر).
- اضبط متغير البيئة ADMIN_SECRET في لوحة Render.
- Render سيبني الصورة ويشغّل الحاوية تلقائياً.