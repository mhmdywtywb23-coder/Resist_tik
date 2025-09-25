from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime
import json
import os

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 500  # حتى 500MB

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/upload', methods=['POST'])
def upload_video():
    video = request.files.get('video')
    if not video:
        return jsonify({"success": False, "message": "لم يتم رفع أي فيديو"})

    # التحقق من الأكواد
    with open('codes.json') as f:
        codes = json.load(f)

    code = request.form.get('code')
    if code not in codes:
        return jsonify({"success": False, "message": "الكود غير صالح!"})

    expires_at = datetime.fromisoformat(codes[code]['expires_at'])
    if datetime.now() > expires_at:
        return jsonify({"success": False, "message": "الكود انتهت صلاحيته!"})

    # حفظ الفيديو باسم RESIST مع الامتداد الأصلي
    ext = os.path.splitext(video.filename)[1]
    filepath = os.path.join(UPLOAD_FOLDER, f"RESIST{ext}")
    video.save(filepath)

    # رابط الفيديو للعرض أو التحميل
    video_url = f"/uploads/RESIST{ext}"
    return jsonify({"success": True, "message": f"تم رفع الفيديو '{video.filename}' بنجاح!", "video_url": video_url})

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == "__main__":
    app.run(debug=True)
