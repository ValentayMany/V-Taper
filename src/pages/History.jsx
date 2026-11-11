import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { Badge } from '../components/Calendar'

const MU = ['Chest', 'Shoulders', 'Back', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Calves', 'Core']

export default function History() {
  const { S } = useStore()
  const navigate = useNavigate()
  const [filterDate, setFilterDate] = useState('')
  const [filterMuscle, setFilterMuscle] = useState('')

  const sessions = [...S.sessions]
    .sort((a, b) => a.date < b.date ? 1 : -1)
    .filter(s => (!filterDate || s.date === filterDate) && (!filterMuscle || s.exercises.some(e => e.muscle === filterMuscle)))

  const clearFilters = () => { setFilterDate(''); setFilterMuscle('') }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1>📜 Workout History</h1>
        <p className="mut" style={{ margin: 0, fontSize: 14 }}>
          ประวัติการฝึกซ้อมทั้งหมด บันทึกสถิติ และการพัฒนาของคุณ
        </p>
      </div>

      <div className="card" style={{ padding: 14 }}>
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
