from flask import Flask, render_template, request, redirect, send_file
import ffmpeg
import os
from auth import check_code

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():
    code = request.form.get('code')
    if not check_code(code):
        return "الكود غير صالح أو انتهت صلاحيته", 403

    file = request.files['video']
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    output_path = os.path.join(UPLOAD_FOLDER, "processed_" + file.filename)

    # تحسين جودة الفيديو باستخدام FFmpeg
    (
        ffmpeg
        .input(filepath)
        .output(output_path, vf='scale=1080:-2', r=60, vcodec='libx264', crf=23)
        .overwrite_output()
        .run()
    )

    return send_file(output_path, as_attachment=True)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
