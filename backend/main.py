from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
import shutil, os, uuid, asyncio

app = FastAPI(title='Resist_Tik_Pro API')

UPLOAD_DIR = '/tmp/resist_uploads'
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post('/compress')
async def compress(file: UploadFile = File(...)):
    uid = str(uuid.uuid4())
    in_path = os.path.join(UPLOAD_DIR, f'{uid}_in.mp4')
    out_path = os.path.join(UPLOAD_DIR, f'{uid}_out.mp4')
    try:
        with open(in_path, 'wb') as f:
            shutil.copyfileobj(file.file, f)
    except Exception as e:
        raise HTTPException(status_code=500, detail='Failed to save upload')

    cmd = [
        'ffmpeg', '-y', '-i', in_path,
        '-vf', 'scale=min(1080,iw):-2',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart',
        out_path
    ]
    proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        if os.path.exists(in_path): os.remove(in_path)
        raise HTTPException(status_code=500, detail='FFmpeg failed')

    def iterfile():
        with open(out_path, 'rb') as f:
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                yield chunk

    headers = {'X-File-Name': f'resist_tik_compressed_{uid}.mp4'}
    # cleanup after creating response (files removed now)
    try:
        os.remove(in_path)
    except: pass
    try:
        os.remove(out_path)
    except: pass
    return StreamingResponse(iterfile(), media_type='video/mp4', headers=headers)
