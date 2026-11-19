import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { uid, today, dow, wk, add, iso } from '../services/db'
import Calendar, { Badge } from '../components/Calendar'
import { SvgLine } from '../components/SvgCharts'

export default function Dashboard() {
  const { S, update, toast } = useStore()
  const navigate = useNavigate()
  const t = today()
  const [calMonth, setCalMonth] = useState(t.slice(0, 7))
  const [selectedWeekDate, setSelectedWeekDate] = useState(t)

  const exById = (id) => S.exercises.find(e => e.id === id)
  const sess = (d) => S.sessions.find(s => s.date === d)

  // Day status
  const dstat = (d) => {
    const s = sess(d)
    if (s) {
      if (s.status === 'rest') {
        const y = S.plan.days[dow(d)]
        return !y.rest ? 'swapped_rest' : 'rest'
      }
      return s.status === 'in_progress' ? 'partial' : s.status
    }
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
  const restDays = statuses.filter(x => x === 'rest' || x === 'swapped_rest').length
  const pc = Math.min(100, Math.round(completed / planWorkouts * 100))

  // Weekly total reps (Home Workout Overload)
  const weekSessions = weekDates.map(sess).filter(Boolean)
  const totalRepsThisWeek = weekSessions.reduce((acc, s) => {
    return acc + (s.exercises || []).reduce((a, e) => {
      return a + (e.sets || []).reduce((b, st) => b + (+st.reps || 0), 0)
    }, 0)
  }, 0)

  const pushupsCountThisWeek = weekSessions.reduce((acc, s) => {
    return acc + (s.exercises || [])
      .filter(e => e.name?.toLowerCase().includes('push-up'))
      .reduce((a, e) => a + (e.sets || []).reduce((b, st) => b + (+st.reps || 0), 0), 0)
  }, 0)

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

      {totalRepsThisWeek > 0 && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.08), rgba(16, 185, 129, 0.12))',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '12px 18px',
          marginBottom: 16
        }}>
          <div className="sp" style={{ flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>💪</span>
              <div>
                <b style={{ fontSize: 15, color: 'var(--tx)' }}>สถิติสะสมสัปดาห์นี้ (Home Overload):</b>
                <div className="mut" style={{ fontSize: 13, marginTop: 2 }}>
                  ยกไปแล้วรวม <b style={{ color: 'var(--g-bright)' }}>{totalRepsThisWeek}</b> ครั้ง
                  {pushupsCountThisWeek > 0 && <span> (วิดพื้น {pushupsCountThisWeek} ครั้ง)</span>}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 12, background: 'var(--g-bg)', color: 'var(--g-bright)', padding: '4px 10px', borderRadius: 99, fontWeight: 700 }}>
              🔥 กล้ามเนื้อพัฒนาต่อเนื่อง
            </span>
          </div>
        </div>
      )}

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

      {/* 7-Day Unified Weekly Strip */}
      <div className="card" style={{ padding: '16px 14px' }}>
        <div style={{ marginBottom: 12 }}>
          <b style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📅</span> ตารางสัปดาห์นี้
          </b>
          <span className="mut" style={{ fontSize: 12.5, display: 'block', marginTop: 2 }}>
            แตะเลือกวันเพื่อดูโปรแกรมหรือสลับวันฝึก
          </span>
        </div>

        {/* 7 Columns Grid - Fits All Screens Completely Smooth Without Clipping */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 5,
          background: 'var(--c2)',
          padding: '8px 4px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--ln)'
        }}>
          {weekDates.map((dateStr) => {
            const st = dstat(dateStr)
            const isToday = dateStr === t
            const isSelected = dateStr === (selectedWeekDate || t)
            const dayNameShort = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'][dow(dateStr)]
            const dayNum = dateStr.slice(8)

            // Status Indicator Dot
            let dot = '⚪'
            if (st === 'completed') dot = '🟢'
            else if (st === 'partial') dot = '🟡'
            else if (st === 'swapped_rest') dot = '🔵'
            else if (st === 'rest') dot = '💤'
            else if (st === 'planned-rest') dot = '💤'
            else if (st === 'skipped') dot = '🔴'

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedWeekDate(dateStr)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 2px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  background: isSelected
                    ? 'rgba(16, 185, 129, 0.18)'
                    : isToday
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'transparent',
                  border: isSelected
                    ? '1.5px solid var(--g)'
                    : isToday
                    ? '1px dashed var(--g-bright)'
                    : '1px solid transparent'
                }}
              >
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: isSelected ? 'var(--g-bright)' : isToday ? 'var(--tx)' : 'var(--mt)',
                  marginBottom: 4
                }}>
                  {dayNameShort}
                </span>

                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 99,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800,
                  background: isToday
                    ? 'var(--g-grad)'
                    : isSelected
                    ? 'var(--c3)'
                    : 'transparent',
                  color: isToday ? '#032011' : 'var(--tx)',
                  boxShadow: isToday ? '0 2px 8px rgba(16, 185, 129, 0.4)' : undefined,
                  marginBottom: 5
                }}>
                  {dayNum}
                </div>

                <div style={{ fontSize: 13, lineHeight: 1 }}>
                  {dot}
                </div>
              </div>
            )
          })}
        </div>

        {/* Selected Day Info Pill */}
        {(() => {
          const selDate = selectedWeekDate || t
          const selSt = dstat(selDate)
          const selPlan = S.plan.days[dow(selDate)]
          const selSess = sess(selDate)
          const selDayLong = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'][dow(selDate)]
          const isT = selDate === t

          return (
            <div style={{
              marginTop: 12,
              background: 'var(--c2)',
              border: '1px solid var(--ln-light)',
              borderRadius: 'var(--radius-md)',
              padding: '11px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{isT ? '⭐ วันนี้ ·' : '📅'}</span>
                  <span>{selDayLong} ({selDate.slice(8)}):</span>
                  <span style={{ color: 'var(--g-bright)' }}>
                    {selSess ? selSess.dayName : selPlan.name}
                  </span>
                </div>
                <div style={{ marginTop: 4 }}>
                  <Badge status={selSt} />
                </div>
              </div>
              <button
                className="b p"
                style={{ fontSize: 13, padding: '7px 14px' }}
                onClick={() => navigate(`/daily/${selDate}`)}
              >
                {isT ? 'เปิดหน้าฝึกวันนี้ ›' : 'ดูรายละเอียดวันนี้นี้ ›'}
              </button>
            </div>
          )
        })()}
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

        {todaySess && todaySess.status === 'rest' ? (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🛌</div>
            <b style={{ fontSize: 17, display: 'block', marginBottom: 4, color: 'var(--b)' }}>
              {todaySess.dayName || 'วันพักผ่อน (สลับเป็นวันพัก)'}
            </b>
            <p className="mut" style={{ margin: '0 0 16px', fontSize: 13 }}>
              {todaySess.note || 'วันนี้คุณเลือกพักผ่อน (สามารถไปออกกำลังกายชดเชยในวันอื่นได้)'}
            </p>
            <div className="row" style={{ justifyContent: 'center', gap: 10, margin: 0, flexWrap: 'wrap' }}>
              <button className="b s" onClick={() => navigate(`/daily/${t}`)}>
                🔍 ดูรายละเอียด / สลับโปรแกรม
              </button>
              <button
                className="b s"
                onClick={() => {
                  update(s => { s.sessions = s.sessions.filter(x => x.date !== t) })
                  toast('ยกเลิกวันพักแล้ว กลับสู่ตารางปกติ')
                }}
              >
                ↩ ยกเลิกวันพัก
              </button>
            </div>
          </div>
        ) : todaySess ? (
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
            <p className="mut" style={{ margin: '0 0 14px' }}>วันนี้เป็นวันพักผ่อนเพื่อให้กล้ามเนื้อฟื้นฟูอย่างเต็มที่</p>
            <button className="b s" onClick={() => navigate(`/daily/${t}`)}>
              🔄 นำโปรแกรมอื่นมาเล่นชดเชยวันนี้
            </button>
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
            <div className="row" style={{ margin: 0, gap: 10, flexWrap: 'wrap' }}>
              <button className="b p" style={{ flex: 1, minWidth: 180 }} onClick={() => navigate(`/daily/${t}`)}>
                🚀 เริ่มการฝึกวันนี้ (Start Workout)
              </button>
              <button
                className="b"
                style={{ background: 'var(--b-bg)', color: 'var(--b)', borderColor: 'rgba(56, 189, 248, 0.3)', whiteSpace: 'nowrap' }}
                onClick={() => {
                  update(s => {
                    s.sessions = s.sessions.filter(x => x.date !== t)
                    s.sessions.push({
                      id: uid(),
                      date: t,
                      dayName: 'วันพัก (สลับพัก)',
                      status: 'rest',
                      note: 'สลับเป็นวันพักผ่อน (จะไปฝึกชดเชยวันอื่น)',
                      startedAt: Date.now(),
                      exercises: [],
                    })
                  })
                  toast('บันทึกวันนี้เป็น "วันพัก" เรียบร้อยแล้ว 🛌')
                }}
              >
                🛌 วันนี้ขอพัก (สลับพัก)
              </button>
            </div>
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
