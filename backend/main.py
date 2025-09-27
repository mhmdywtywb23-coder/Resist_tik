from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import shutil
import os
import subprocess
import uuid

app = FastAPI(title="Resist_Tik_Pro API")

# ربط واجهة frontend بحيث تفتح مباشرة
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")

# مجلد التخزين المؤقت
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


@app.post("/compress")
async def compress_video(file: UploadFile = File(...)):
    try:
        # اسم فريد للملفات
        input_filename = f"{uuid.uuid4()}_{file.filename}"
        input_path = os.path.join(UPLOAD_DIR, input_filename)

        output_filename = f"compressed_{uuid.uuid4()}.mp4"
        output_path = os.path.join(OUTPUT_DIR, output_filename)

        # حفظ الفيديو المرفوع
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # أمر الضغط (باستخدام ffmpeg)
        command = [
            "ffmpeg",
            "-i", input_path,
            "-vcodec", "libx264",
            "-crf", "28",   # جودة الضغط (كلما قل الرقم = جودة أعلى)
            "-preset", "fast",
            output_path
        ]
        subprocess.run(command, check=True)

        # حذف الملف الأصلي لتوفير مساحة
        os.remove(input_path)

        return {"download_url": f"/download/{output_filename}"}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=filename)
    return JSONResponse(status_code=404, content={"error": "File not found"})
