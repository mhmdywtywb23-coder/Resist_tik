Resist_Tik_Pro_VIP - Ready project (Docker + FFmpeg)
-------------------------------------------------

Included:
- Node.js + Express server (server.js)
- FFmpeg will be installed inside Docker image (Dockerfile)
- Frontend: public/index.html, public/admin.html, public/dashboard.html, public/assets/style.css
- codes.json: initial activation codes (20 per plan)
- subscriptions.json will be created when someone subscribes
- uploads/: processed files stored here

How to deploy on Render using Docker:
1. Push this repo to GitHub.
2. On Render create New -> Web Service -> Connect GitHub repository.
3. Render will build the Docker image (it will install ffmpeg inside image).
4. Start the service; site will be available and admin pages protected with Basic Auth.
Admin credentials (default):
- user: admin
- pass: RESIST_ADMIN_1
