from flask import Flask, request, render_template, send_file
import os
from datetime import datetime
import json
import moviepy.editor as mp

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_video():
    video = request.files.get('video')
    code = request.form.get('code')

    with open('codes.json') as f:
        codes = json.load(f)

    if code not in codes:
        return {"success": False, "message": "الكود غير صالح!"}

    expires_at = datetime.fromisoformat(codes[code]['expires_at'])
    if datetime.now() > expires_at:
        return {"success": False, "message": "الكود انتهت صلاحيته!"}

    if not video:
        return {"success": False, "message": "الرجاء اختيار فيديو!"}

    input_path = os.path.join("uploads", video.filename)
    output_path = os.path.join("processed", "RESIST.mp4")
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("processed", exist_ok=True)
    video.save(input_path)

    # معالجة الفيديو بجودة قوية وسلسة
    try:
        clip = mp.VideoFileClip(input_path)
        slowed = clip.fx(mp.vfx.speedx, 0.75)  # تخفيض السرعة لتكون سلسة
        slowed.write_videofile(output_path, codec="libx264", fps=60, preset='slow')
    except Exception as e:
        return {"success": False, "message": f"حدث خطأ أثناء المعالجة: {e}"}

    return {"success": True, "message": "تمت معالجة الفيديو بنجاح!", "download_url": "/download"}

@app.route('/download')
def download_video():
    return send_file("processed/RESIST.mp4", as_attachment=True)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
