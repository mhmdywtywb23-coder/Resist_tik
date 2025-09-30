# RESIST_TIK (Resist_Tik_Pro)
A scaffold project to replicate https://4tiko.koyeb.app features with a new UI called Resist_Tik_Pro.

## What is included
- frontend: React + Vite + Tailwind (minimal starter UI)
- backend: Express API with upload endpoint (multer) and job enqueue
- worker: BullMQ worker that runs ffmpeg to transcode uploaded videos
- infra: render.yaml for Render deployment (example)
- .env.example with required environment variables
- Stripe plan placeholders matching your requested plans:
  - Basic: 1 week — $5/week
  - Pro: 1 month — $10/month
  - Premium: 3 months — $30/3 months

## How to run locally (basic)
1. Install Redis and Postgres locally (or use Docker).
2. Fill `.env` from `.env.example`.
3. Frontend:
   - cd frontend
   - npm install
   - npm run dev
4. Backend:
   - cd backend
   - npm install
   - npm start
5. Worker:
   - cd worker
   - npm install
   - node worker.js
