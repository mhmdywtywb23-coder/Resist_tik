FROM node:18-bullseye

# تثبيت ffmpeg (نسخة جاهزة من apt) - تحتوي على minterpolate
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# نسخ package ثم تنصيب
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --production

# نسخ بقية المشروع
COPY backend ./backend
COPY public ./public

WORKDIR /app/backend

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]