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

    # ======= التحقق من الأكواد =======
    with open('codes.json') as f:
        codes = json.load(f)

    code = request.form.get('code')
    if code not in codes:
        return jsonify({"success": False, "message": "الكود غير صالح!"})

    expires_at = datetime.fromisoformat(codes[code]['expires_at'])
    if datetime.now() > expires_at:
        return jsonify({"success": False, "message": "الكود انتهت صلاحيته!"})
    # ======= نهاية التحقق =======

    # حفظ الفيديو
    filepath = os.path.join(UPLOAD_FOLDER, video.filename)
    video.save(filepath)

    return jsonify({"success": True, "message": f"تم رفع الفيديو '{video.filename}' بنجاح!"})

if __name__ == "__main__":
    app.run(debug=True)
