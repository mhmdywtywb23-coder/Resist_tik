FROM debian:bullseye-slim

# تثبيت ffmpeg، Node.js و npm
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# مجلد العمل داخل الحاوية
WORKDIR /app

# نسخ كل الملفات للمجلد /app
COPY . .

# تثبيت مكتبات Node.js
RUN npm install

# أمر التشغيل
CMD ["npm", "start"]
