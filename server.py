from flask import Flask, request, render_template, send_from_directory, jsonify
import os
import json
from datetime import datetime
import ffmpeg

app = Flask(__name__)

os.makedirs("uploads", exist_ok=True)
os.makedirs("processed", exist_ok=True)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload_video():
    code = request.form.get("code")
    with open("codes.json") as f:
        codes = json.load(f)

    if code not in codes:
        return jsonify({"success": False, "message": "❌ الكود غير صالح!"})

    expires_at = datetime.fromisoformat(codes[code]["expires_at"])
    if datetime.now() > expires_at:
        return jsonify({"success": False, "message": "⏰ الكود انتهت صلاحيته!"})

    video = request.files.get("video")
    if not video:
        return jsonify({"success": False, "message": "⚠️ لم يتم اختيار أي فيديو!"})

    input_path = os.path.join("uploads", video.filename)
    output_path = os.path.join("processed", "RESIST.mp4")
    video.save(input_path)

    try:
        # استخدم ffmpeg-python لمعالجة الفيديو: إبطاء بسيط 1.2x (setpts=1.2*PTS)، تحويل إلى 60fps، جودة عالية
        (
            ffmpeg
            .input(input_path)
            .filter('setpts', '1.2*PTS')
            .filter('fps', fps=60, round='up')
            .output(output_path, vcodec='libx264', crf=23, preset='slow', acodec='aac', audio_bitrate='192k')
            .overwrite_output()
            .run()
        )
    except ffmpeg.Error as e:
        return jsonify({"success": False, "message": "خطأ أثناء معالجة الفيديو: " + e.stderr.decode('utf-8', errors='ignore')})

    return jsonify({"success": True, "message": "✅ تمت معالجة الفيديو!", "download": "/download/RESIST.mp4"})

@app.route("/download/<filename>")
def download_file(filename):
    return send_from_directory("processed", filename, as_attachment=True)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
