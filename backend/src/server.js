require('dotenv').config()
const express=require('express')
const multer=require('multer')
const path=require('path')
const { Queue } = require('bullmq')
const Redis = require('ioredis')
const cors = require('cors')

const app=express()
app.use(cors())
const upload=multer({ dest: 'uploads/' })
const connection=new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
const videoQueue=new Queue('video-transcode',{ connection })

app.post('/api/upload', upload.single('video'), async (req,res)=>{
  if(!req.file) return res.status(400).json({ error: 'no file' })
  await videoQueue.add('transcode', { filePath: req.file.path, originalName: req.file.originalname })
  res.json({ message: 'تم الرفع — بدأ المعالجة' })
})

app.get('/api/health', (req,res)=> res.json({ ok:true }))

app.listen(process.env.PORT||3000, ()=> console.log('backend listening on', process.env.PORT||3000))
