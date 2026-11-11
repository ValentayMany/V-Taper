import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { today, dow, wk, add, iso } from '../services/db'
import Calendar, { Badge } from '../components/Calendar'
import { SvgLine } from '../components/SvgCharts'

export default function Dashboard() {
  const { S } = useStore()
  const navigate = useNavigate()
  const t = today()
  const [calMonth, setCalMonth] = useState(t.slice(0, 7))

  const exById = (id) => S.exercises.find(e => e.id === id)
  const sess = (d) => S.sessions.find(s => s.date === d)

  // Day status
  const dstat = (d) => {
    const s = sess(d)
    if (s) return s.status === 'in_progress' ? 'partial' : s.status
    const y = S.plan.days[dow(d)]
    if (y.rest) return d <= t ? 'rest' : 'planned-rest'
    return d < t && d >= S.settings.start ? 'skipped' : 'planned'
  }

  // Week stats
  const ws = wk(t)
  const weekDates = Array.from({ length: 7 }, (_, i) => add(ws, i))
  const statuses = weekDates.map(dstat)
  const planWorkouts = S.plan.days.filter(x => !x.rest).length || 1
  const trained = statuses.filter(x => x === 'completed' || x === 'partial').length
  const completed = statuses.filter(x => x === 'completed').length
  const restDays = statuses.filter(x => x === 'rest').length
  const pc = Math.min(100, Math.round(completed / planWorkouts * 100))

  // Last weight
  const lw = [...S.measures].filter(m => m.weight).sort((a, b) => a.date < b.date ? -1 : 1)
  const last = lw[lw.length - 1]

  // Latest V-Taper Ratio
  const ratioMeasures = [...S.measures].filter(m => m.waist && (m.shoulders || m.chest)).sort((a, b) => a.date < b.date ? -1 : 1)
  const lastRatioM = ratioMeasures[ratioMeasures.length - 1]
  const lastRatio = lastRatioM ? +(
    (lastRatioM.shoulders ? +lastRatioM.shoulders : +lastRatioM.chest * 1.22) / +lastRatioM.waist
  ).toFixed(2) : null

  // Today's program
  const todaySess = sess(t)
  const todayPlan = S.plan.days[dow(t)]

  // Calendar statuses for entire month
  const [cy, cm] = calMonth.split('-').map(Number)
  const dim = new Date(cy, cm, 0).getDate()
  const calStatuses = {}
  for (let i = 1; i <= dim; i++) {
    const d = `${cy}-${String(cm).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    calStatuses[d] = dstat(d)
  }

  // Weight chart
  const weightPts = lw.slice(-20).map(m => ({ l: m.date.slice(5), v: +m.weight }))

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <h1>📊 Dashboard</h1>
        <p className="mut" style={{ margin: 0, fontSize: 14 }}>
          ภาพรวมตารางซ้อม พัฒนาการ และสถิติร่างกายของคุณ
        </p>
      </div>

      <div className="grid">
        <div className="st">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span>ฝึกสัปดาห์นี้</span>
            <span style={{ fontSize: 18 }}>🏋️‍♂️</span>
          </div>
          <b>{trained} วัน</b>
        </div>
        <div className="st">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span>ทำตามเป้าหมาย</span>
            <span style={{ fontSize: 18 }}>🎯</span>
          </div>
          <b>{completed}/{planWorkouts}</b>
        </div>
        <div className="st">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span>สัดส่วน V-Taper</span>
            <span style={{ fontSize: 18 }}>🔱</span>
          </div>
          <b>{lastRatio ? lastRatio : '—'}</b>
        </div>
        <div className="st">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span>น้ำหนักล่าสุด</span>
            <span style={{ fontSize: 18 }}>⚖️</span>
          </div>
          <b>{last ? last.weight + ' kg' : '—'}</b>
        </div>
      </div>

      <div className="card">
        <div className="sp">
          <div>
            <h3 style={{ margin: 0 }}>ความสำเร็จประจำสัปดาห์</h3>
            <span className="mut" style={{ fontSize: 13 }}>เป้าหมายตามโปรแกรมการฝึก</span>
          </div>
          <b style={{ fontSize: 22, color: 'var(--g-bright)' }}>{pc}%</b>
        </div>
        <div className="bar" style={{ height: 12, marginTop: 14 }}>
          <i style={{ width: `${pc}%` }} />
        </div>
      </div>

      <div className="card">
        <div className="sp" style={{ marginBottom: 14, borderBottom: '1px solid var(--ln)', paddingBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>🔥 โปรแกรมวันนี้</h3>
            <span className="mut" style={{ fontSize: 13 }}>
              {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          {todaySess ? (
            <Badge status={dstat(t)} />
          ) : todayPlan.rest ? (
            <Badge status="rest" />
          ) : (
            <Badge status="planned" />
          )}
        </div>

        {todaySess ? (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              {todaySess.dayName}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {todaySess.exercises.map((e, i) => (
                <div key={i} className={`ex-row ${e.done ? 'dn' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{e.done ? '✅' : '⬜'}</span>
                    <span style={{ fontWeight: 600 }}>{e.name}</span>
                  </div>
                  <span className="bd planned" style={{ fontSize: 11 }}>
                    {e.sets.filter(x => +x.reps > 0).length}/{e.targetSets} sets
                  </span>
                </div>
              ))}
            </div>
            <button className="b p" style={{ width: '100%' }} onClick={() => navigate(`/daily/${t}`)}>
              เปิดหน้าบันทึกการฝึก
            </button>
          </div>
        ) : todayPlan.rest ? (
          <div style={{ padding: '16px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧘‍♂️</div>
            <b style={{ fontSize: 17, display: 'block', marginBottom: 4 }}>{todayPlan.name}</b>
            <p className="mut" style={{ margin: 0 }}>วันนี้เป็นวันพักผ่อนเพื่อให้กล้ามเนื้อฟื้นฟูอย่างเต็มที่</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              {todayPlan.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {todayPlan.items.map((item, i) => (
                <div key={i} className="ex-row">
                  <span style={{ fontWeight: 600 }}>{exById(item.exId)?.name || '?'}</span>
                  <span className="bd planned" style={{ fontSize: 11 }}>{item.sets} เซ็ต × {item.reps} ครั้ง</span>
                </div>
              ))}
            </div>
            <button className="b p" style={{ width: '100%' }} onClick={() => navigate(`/daily/${t}`)}>
              🚀 เริ่มการฝึกวันนี้ (Start Workout)
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14 }}>🗓 ปฏิทินการฝึก</h3>
        <Calendar dayStatuses={calStatuses} calMonth={calMonth} setCalMonth={setCalMonth} />
      </div>

      <div className="card">
        <div className="sp" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>📈 แนวโน้มน้ำหนักตัว</h3>
          <span className="mut" style={{ fontSize: 12 }}>20 ครั้งล่าสุด</span>
        </div>
        <SvgLine points={weightPts} unit=" kg" />
      </div>
    </>
  )
}
