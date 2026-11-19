import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { Badge } from '../components/Calendar'

const MU = ['Chest', 'Shoulders', 'Back', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Calves', 'Core']

export default function History() {
  const { S, toast } = useStore()
  const navigate = useNavigate()
  const [filterDate, setFilterDate] = useState('')
  const [filterMuscle, setFilterMuscle] = useState('')

  const sessions = [...S.sessions]
    .sort((a, b) => a.date < b.date ? 1 : -1)
    .filter(s => (!filterDate || s.date === filterDate) && (!filterMuscle || s.exercises.some(e => e.muscle === filterMuscle)))

  const clearFilters = () => { setFilterDate(''); setFilterMuscle('') }

  const handleExportExcel = () => {
    if (!sessions || sessions.length === 0) {
      toast('ยังไม่มีประวัติการฝึกสำหรับส่งออก', true)
      return
    }

    const headers = [
      'วันที่ (Date)',
      'โปรแกรม (Program)',
      'สถานะ (Status)',
      'ท่าออกกำลังกาย (Exercise)',
      'กลุ่มกล้ามเนื้อ (Muscle)',
      'เซ็ตที่ (Set)',
      'จำนวนครั้ง (Reps)',
      'น้ำหนัก (kg)',
      'พัก (วินาที)',
      'ระดับความเหนื่อย (RPE 1-10)',
      'โน้ตท่าฝึก',
      'โน้ตประจำวัน',
    ]

    const statusMap = {
      completed: 'ฝึกสำเร็จ',
      in_progress: 'กำลังฝึก',
      partial: 'กำลังฝึก',
      rest: 'วันพัก',
      skipped: 'ไม่ได้ฝึก',
    }

    const rows = [headers]

    sessions.forEach(s => {
      const dateStr = s.date || ''
      const dayName = s.dayName || ''
      const statusStr = statusMap[s.status] || s.status || ''
      const sessionNote = s.note || ''

      const filteredExercises = (s.exercises || []).filter(
        e => !filterMuscle || e.muscle === filterMuscle
      )

      if (!filteredExercises || filteredExercises.length === 0) {
        rows.push([
          dateStr,
          dayName,
          statusStr,
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          sessionNote,
        ])
        return
      }

      filteredExercises.forEach(e => {
        const exName = e.name || ''
        const muscle = e.muscle || ''
        const exNote = e.note || ''
        const validSets = (e.sets || []).filter(st => st.reps !== '' && st.reps != null && +st.reps > 0)

        if (validSets.length === 0) {
          rows.push([
            dateStr,
            dayName,
            statusStr,
            exName,
            muscle,
            '1',
            '-',
            '-',
            e.rest || '-',
            '-',
            exNote,
            sessionNote,
          ])
        } else {
          validSets.forEach((st, idx) => {
            rows.push([
              dateStr,
              dayName,
              statusStr,
              exName,
              muscle,
              idx + 1,
              st.reps ?? '-',
              st.kg !== '' && st.kg != null ? st.kg : '0',
              st.rest || e.rest || '-',
              st.rpe || '-',
              exNote,
              sessionNote,
            ])
          })
        }
      })
    })

    const csvContent = '\uFEFF' + rows.map(r => r.map(c => {
      const str = String(c == null ? '' : c).replace(/"/g, '""')
      return `"${str}"`
    }).join(',')).join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `vtaper-workout-history-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast('ดาวน์โหลดไฟล์ Excel เรียบร้อยแล้ว ✓')
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1>📜 Workout History</h1>
        <p className="mut" style={{ margin: 0, fontSize: 14 }}>
          ประวัติการฝึกซ้อมทั้งหมด บันทึกสถิติ และการพัฒนาของคุณ
        </p>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="sp" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="row" style={{ margin: 0, gap: 10 }}>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              style={{ fontWeight: 500 }}
            />
            <select value={filterMuscle} onChange={e => setFilterMuscle(e.target.value)}>
              <option value="">ทุกกลุ่มกล้ามเนื้อ</option>
              {MU.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {(filterDate || filterMuscle) && (
              <button className="b s" onClick={clearFilters}>✕ ล้างตัวกรอง</button>
            )}
          </div>

          <button
            className="b s p"
            onClick={handleExportExcel}
            title="ดาวน์โหลดประวัติการฝึกเป็นไฟล์ Excel (.csv)"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            📊 บันทึกเป็นไฟล์ Excel
          </button>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 16px' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏋️‍♂️</div>
          <b style={{ fontSize: 16 }}>ยังไม่พบประวัติการฝึก</b>
          <p className="mut" style={{ margin: '6px 0 0' }}>เริ่มฝึกซ้อมวันนี้เพื่อเริ่มบันทึกประวัติความคืบหน้าแรกของคุณ</p>
        </div>
      ) : (
        sessions.map(s => (
          <div key={s.id} className="card">
            <div className="sp" style={{ borderBottom: '1px solid var(--ln)', paddingBottom: 10, marginBottom: 12 }}>
              <div>
                <b style={{ fontSize: 16 }}>{s.date}</b>
                <span className="mut" style={{ marginLeft: 8, fontSize: 13 }}>· {s.dayName}</span>
              </div>
              <Badge status={s.status === 'in_progress' ? 'partial' : s.status} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {s.exercises
                .filter(e => !filterMuscle || e.muscle === filterMuscle)
                .map((e, i) => (
                  <div key={i} className="ex-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                    <div className="sp" style={{ width: '100%' }}>
                      <span style={{ fontWeight: 600 }}>{e.name}</span>
                      <span className="bd" style={{ background: 'var(--c)', fontSize: 11 }}>{e.muscle}</span>
                    </div>
                    <div className="mut" style={{ fontSize: 13 }}>
                      {e.sets.filter(x => +x.reps > 0).map((x, j) =>
                        `เซ็ต ${j + 1}: ${x.reps} ครั้ง${x.kg ? ' @ ' + x.kg + ' kg' : ''}`
                      ).join('  ·  ') || '— ยังไม่ได้บันทึกเซ็ต'}
                    </div>
                  </div>
                ))}
            </div>

            {s.note && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--c2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                💬 <span className="mut">{s.note}</span>
              </div>
            )}

            <div className="row" style={{ marginTop: 14 }}>
              <button className="b s" onClick={() => navigate(`/daily/${s.date}`)}>
                ✏️ ดูรายละเอียด / แก้ไข
              </button>
            </div>
          </div>
        ))
      )}
    </>
  )
}
