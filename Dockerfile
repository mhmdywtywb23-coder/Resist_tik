FROM python:3.11-slim

RUN apt-get update && apt-get install -y ffmpeg --no-install-recommends \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend /app/backend
COPY frontend /app/frontend

RUN pip install --no-cache-dir -r /app/backend/requirements.txt

EXPOSE 8080

CMD ["sh","-c","uvicorn backend.main:app --host 0.0.0.0 --port 8080 --proxy-headers"]
