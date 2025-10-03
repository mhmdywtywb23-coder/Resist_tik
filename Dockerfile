# استخدام نسخة خفيفة من Debian
FROM debian:bullseye-slim

# تحديث النظام وتثبيت الحزم المطلوبة
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    curl \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# إنشاء مجلد العمل داخل الحاوية
WORKDIR /app

# نسخ كل ملفات المشروع
COPY . .

# تثبيت جميع مكتبات Node.js المطلوبة (بما فيها dotenv)
RUN npm install

# الأمر الافتراضي لتشغيل السيرفر
CMD ["node", "backend/server.js"]
