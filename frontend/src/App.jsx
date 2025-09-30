import React, {useState} from 'react'
import axios from 'axios'
export default function App(){
  const [file,setFile]=useState(null)
  const [status,setStatus]=useState('')
  const upload=async()=>{
    if(!file) return alert('اختار ملف')
    const fd=new FormData(); fd.append('video', file)
    setStatus('Uploading...')
    try{
      const res=await axios.post('/api/upload', fd, { headers: {'Content-Type':'multipart/form-data'} })
      setStatus(res.data.message||'uploaded')
    }catch(e){
      setStatus('خطأ في الرفع')
    }
  }
  return (<div style={{padding:24, maxWidth:800, margin:'0 auto', fontFamily:'Arial'}}>
    <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
      <h1>Resist_Tik_Pro</h1>
      <nav>
        <button>اشتراك</button>
      </nav>
    </header>
    <section style={{background:'#f7f7f8', padding:20, borderRadius:8}}>
      <h2>رفع فيديو — نفس وظائف الموقع المرجعي</h2>
      <input type="file" accept="video/*" onChange={e=>setFile(e.target.files[0])} />
      <div style={{marginTop:12}}>
        <button onClick={upload} style={{padding:'8px 12px'}}>معالجة ورفع</button>
      </div>
      <p style={{marginTop:10}}>{status}</p>
    </section>
    <section style={{marginTop:24}}>
      <h3>خطط الاشتراك</h3>
      <ul>
        <li><strong>Basic</strong> — أسبوع واحد — مناسب للتجربة — <b>$5 / أسبوع</b></li>
        <li><strong>Pro</strong> — شهر كامل — مميز لصانعي المحتوى — <b>$10 / شهر</b></li>
        <li><strong>Premium</strong> — 3 أشهر — للمحترفين — <b>$30 / 3 أشهر</b></li>
      </ul>
    </section>
  </div>)
}
