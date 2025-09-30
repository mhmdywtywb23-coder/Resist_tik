FROM node:18-bullseye

# Install ffmpeg system package
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
