import { useStore } from '../hooks/useStore'

export default function Settings() {
  const { S, toast, reset, importData } = useStore()

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(S, null, 2))
      toast('คัดลอกข้อมูลสำรองแล้ว ✓')
    } catch {
      toast('กรุณาคัดลอกข้อมูลจากช่องข้อความด้านล่างด้วยตนเอง', true)
    }
  }

  const handleImport = () => {
    try {
      const el = document.getElementById('bk')
      const d = JSON.parse(el.value)
      if (!d || !d.plan || !d.exercises || !d.sessions) throw 0
      if (confirm('ยืนยันแทนที่ข้อมูลปัจจุบันทั้งหมดด้วยข้อมูลชุดใหม่?')) {
        importData(d)
        toast('กู้คืนข้อมูลสำเร็จ ✓')
      }
    } catch {
      toast('รูปแบบข้อมูลไม่ถูกต้อง กรุณาตรวจสอบโค้ด JSON อีกครั้ง', true)
    }
  }

  const handleReset = () => {
    if (confirm('คำเตือน: คุณต้องการลบข้อมูลการฝึกทั้งหมดและรีเซ็ตเป็นค่าเริ่มต้นใช่หรือไม่?')) {
      reset()
      toast('รีเซ็ตเป็นค่าเริ่มต้นเรียบร้อย ✓')
    }
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1>⚙️ Settings & Backup</h1>
        <p className="mut" style={{ margin: 0, fontSize: 14 }}>
          จัดการข้อมูล สำรองและกู้คืนประวัติการฝึกของคุณ
        </p>
      </div>

      <div className="card" style={{ borderLeft: '4px solid var(--g)' }}>
        <div className="sp">
          <div>
            <h3 style={{ margin: '0 0 4px' }}>💾 สถานะการจัดเก็บข้อมูล</h3>
            <p className="mut" style={{ margin: 0, fontSize: 13 }}>
              โหมดออฟไลน์ (Local Storage) — บันทึกในเบราว์เซอร์อัตโนมัติ รวดเร็ว ปลอดภัย และไม่ต้องล็อกอิน
            </p>
          </div>
          <span className="bd completed">พร้อมใช้งาน</span>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 6 }}>📦 สำรองและกู้คืนข้อมูล (Backup & Restore)</h3>
        <p className="mut" style={{ fontSize: 13, marginBottom: 14 }}>
          คัดลอกข้อความด้านล่างเก็บไว้ใน Note หรือไฟล์ เพื่อนำไปกู้คืนในเครื่องอื่นหรือเวลาเปลี่ยนเบราว์เซอร์
        </p>
        
        <textarea
          id="bk"
          rows="7"
          defaultValue={JSON.stringify(S, null, 2)}
          style={{ fontFamily: 'monospace', fontSize: 12, padding: 12 }}
        />

        <div className="sp" style={{ marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
          <div className="row" style={{ margin: 0 }}>
            <button className="b" onClick={handleCopy}>📋 คัดลอกข้อมูลสำรอง</button>
            <button className="b p" onClick={handleImport}>📥 กู้คืนจากข้อความ</button>
          </div>
          <button className="b d" onClick={handleReset}>⚠️ รีเซ็ตข้อมูลทั้งหมด</button>
        </div>
      </div>
    </>
  )
}
