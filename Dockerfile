FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    curl \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN npm install

CMD ["node", "backend/server.js"]
