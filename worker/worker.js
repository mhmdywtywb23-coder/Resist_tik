const { Worker } = require('bullmq')
const { spawn } = require('child_process')
const Redis = require('ioredis')
require('dotenv').config()
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

const worker = new Worker('video-transcode', async job => {
  const { filePath, originalName } = job.data
  const out = filePath + '-out.mp4'
  console.log('Transcoding', filePath, '->', out)
  await new Promise((resolve, reject)=>{
    const ff = spawn('ffmpeg', ['-y','-i', filePath, '-vf', "scale='min(720,iw)':'-2'", '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', out])
    ff.stderr.on('data', d=> process.stdout.write(d.toString()))
    ff.on('close', c => c===0?resolve():reject(new Error('ffmpeg failed code '+c)))
  })
  console.log('Finished', out)
}, { connection })

worker.on('failed', (job, err) => console.error('job failed', job.id, err))
console.log('Worker started')
