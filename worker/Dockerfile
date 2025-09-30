
FROM node:20-alpine
RUN apk add --no-cache ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
CMD ["node","worker.js"]
