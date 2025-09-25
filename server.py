from flask import Flask, request, jsonify, send_from_directory
import os
import json
import subprocess
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 500  # يسمح حتى 500MB

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

CODES_FILE = 'codes.json'

def check_code(code):
    with open(CODES_FILE, 'r') as f:
        codes = json.load(f)
    for c in codes:
        if c['code'] == code:
            if c['used']:
                return False, "الكود مستعمل بالفعل."
            if datetime.strptime(c['expires'], "%Y-%m-%d") < datetime.now():
                return False, "الكود منتهي."
            c['used'] = True
            with open(CODES_FILE, 'w') as f:
                json.dump(codes, f)
            return True, "الكود صالح نورت موقعي."
    return False, "الكود غير صحيح."

@app.route('/upload', methods=['POST'])
def upload_video():
    @app.route('/upload', methods=['POST'])
def upload():
    from datetime import datetime
    import json

    # الكود رقم 2 هنا: تحميل الأكواد والتحقق
    with open('codes.json') as f:
        codes = json.load(f)

    code = request.form.get('code')
    if code not in codes:
        return {"success": False, "message": "الكود غير صالح!"}

    expires_at = datetime.fromisoformat(codes[code]['expires_at'])
    if datetime.now() > expires_at:
        return {"success": False, "message": "الكود انتهت صلاحيته!"}

    # باقي كود رفع الفيديو والمعالجة يستمر هنا

    code = request.form.get('code')
    is_valid, message = check_code(code)
    if not is_valid:
        return jsonify({'success': False, 'message': message})

    if 'video' not in request.files:
        return jsonify({'success': False, 'message': 'لم يتم اختيار الفيديو.'})

    video = request.files['video']
    filename = secure_filename(video.filename)
    upload_path = os.path.join(UPLOAD_FOLDER, filename)
    video.save(upload_path)

    # معالجة الفيديو بـ FFmpeg
    output_file = os.path.join(PROCESSED_FOLDER, filename)
    cmd = [
        'ffmpeg', '-i', upload_path,
        '-vf', 'scale=1920:1080', '-r', '60',
        '-c:v', 'libx264', '-preset', 'fast', output_file
    ]
    subprocess.run(cmd)

    download_url = f"/download/{filename}"
    return jsonify({'success': True, 'download_url': download_url})

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(PROCESSED_FOLDER, filename, as_attachment=True)

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
