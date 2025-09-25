import os
import json
from datetime import datetime
from flask import Flask, request, jsonify, render_template, send_from_directory
import subprocess

app = Flask(__name__)

# مجلد التخزين
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# الصفحة الرئيسية
@app.route('/')
def index():
    return render_template('index.html')

# رفع الفيديو + التحقق من الكود
@app.route('/upload', methods=['POST'])
def upload_video():
    video = request.files.get('video')
    code = request.form.get('code')

    # التحقق من الكود
    try:
        with open('codes.json') as f:
            codes = json.load(f)
    except:
        return jsonify({"success": False, "message": "ملف الأكواد غير موجود!"})

    if code not in codes:
        return jsonify({"success": False, "message": "الكود غير صالح!"})

    expires_at = datetime.fromisoformat(codes[code]['expires_at'])
    if datetime.now() > expires_at:
        return jsonify({"success": False, "message": "الكود انتهت صلاحيته!"})

    if not video:
        return jsonify({"success": False, "message": "لم يتم رفع أي فيديو!"})

    # حفظ الفيديو الأصلي مؤقتًا
    input_path = os.path.join(UPLOAD_FOLDER, video.filename)
    video.save(input_path)

    # مسار الإخراج (اسم ثابت RESIST.mp4)
    output_path = os.path.join(UPLOAD_FOLDER, "RESIST.mp4")

    # معالجة الفيديو بـ ffmpeg
    try:
        subprocess.run([
            "ffmpeg", "-i", input_path,
            "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-r", "60",
            "-c:a", "aac", "-b:a", "128k",
            output_path,
            "-y"
        ], check=True)

        # إرجاع رابط الفيديو النهائي
        video_url = f"/uploads/RESIST.mp4"
        return jsonify({"success": True, "message": "تمت معالجة الفيديو بنجاح!", "video_url": video_url})

    except Exception as e:
        return jsonify({"success": False, "message": f"خطأ أثناء معالجة الفيديو: {str(e)}"})

# مسار لتحميل الفيديوهات من المجلد
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
