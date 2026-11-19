import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { uid, today, dow, add, P } from '../services/db'
import { Badge } from '../components/Calendar'
import RestTimer from '../components/RestTimer'

const DN = ['วันจันทร์ (Monday)', 'วันอังคาร (Tuesday)', 'วันพุธ (Wednesday)', 'วันพฤหัสบดี (Thursday)', 'วันศุกร์ (Friday)', 'วันเสาร์ (Saturday)', 'วันอาทิตย์ (Sunday)']

export default function Daily() {
  const { date: paramDate } = useParams()
  const navigate = useNavigate()
  const { S, update, toast } = useStore()

  const [viewDate, setViewDate] = useState(paramDate || today())
  const d = paramDate || viewDate

  const [selectedExId, setSelectedExId] = useState('')
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(null)
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(dow(d))

  useEffect(() => {
    setSelectedPlanIdx(dow(d))
  }, [d])

  const exById = (id) => S.exercises.find(e => e.id === id)
  const sess = S.sessions.find(s => s.date === d)
  const y = S.plan.days[dow(d)]

  const targetPlanIndex = (selectedPlanIdx !== null && selectedPlanIdx >= 0 && selectedPlanIdx < 7)
    ? selectedPlanIdx
    : dow(d)
  const displayPlan = S.plan.days[targetPlanIndex] || y
  const isSubstituted = targetPlanIndex !== dow(d)

  // Check if yesterday was a planned workout day that wasn't completed
  const yesterdayDate = add(d, -1)
  const yesterdayDow = dow(yesterdayDate)
  const yesterdayPlan = S.plan.days[yesterdayDow]
  const yesterdaySess = S.sessions.find(s => s.date === yesterdayDate)
  const missedYesterday = yesterdayPlan && !yesterdayPlan.rest && (!yesterdaySess || yesterdaySess.status !== 'completed')

  const dstat = () => {
    if (sess) {
      if (sess.status === 'rest') {
        return !y.rest ? 'swapped_rest' : 'rest'
      }
      return sess.status === 'in_progress' ? 'partial' : sess.status
    }
    if (y.rest) return d <= today() ? 'rest' : 'planned-rest'
    return d < today() && d >= S.settings.start ? 'skipped' : 'planned'
  }

  const setsDone = (s) => s.exercises.reduce((n, e) => n + e.sets.filter(x => +x.reps > 0).length, 0)

  const goDate = (n) => navigate(`/daily/${add(d, n)}`)

  const startWorkout = () => {
    const sessionDayName = isSubstituted
      ? `${displayPlan.name} (ชดเชย)`
      : displayPlan.name

    update(s => {
      s.sessions = s.sessions.filter(x => x.date !== d)
      s.sessions.push({
        id: uid(),
        date: d,
        dayName: sessionDayName,
        status: 'in_progress',
        note: isSubstituted ? `ฝึกชดเชยโปรแกรม ${displayPlan.name} (${DN[targetPlanIndex].split(' ')[0]})` : '',
        startedAt: Date.now(),
        exercises: displayPlan.rest ? [] : displayPlan.items.map(item => {
          const e = exById(item.exId) || { name: '?', muscle: '-' }
          return {
            exId: item.exId,
            name: e.name,
            muscle: e.muscle,
            targetSets: item.sets,
            targetReps: item.reps,
            rest: item.rest,
            done: false,
            note: '',
            sets: [{ reps: '', kg: '', rest: item.rest, rpe: '' }],
          }
        }),
      })
    })
  }

  const markAsRestDay = () => {
    update(s => {
      s.sessions = s.sessions.filter(x => x.date !== d)
      s.sessions.push({
        id: uid(),
        date: d,
        dayName: 'วันพัก (สลับพัก)',
        status: 'rest',
        note: 'สลับเป็นวันพักผ่อน (จะไปฝึกชดเชยวันอื่น)',
        startedAt: Date.now(),
        exercises: [],
      })
    })
    toast('บันทึกวันนี้เป็น "วันพัก" เรียบร้อยแล้ว 🛌')
  }

  const unmarkRestDay = () => {
    update(s => {
      s.sessions = s.sessions.filter(x => x.date !== d)
    })
    toast('ยกเลิกวันพักแล้ว กลับสู่ตารางปกติ')
  }

  const loadPlanIntoCurrentSession = (planIndex) => {
    const target = S.plan.days[planIndex]
    if (!target || target.rest) return
    update(s => {
      const cur = s.sessions.find(x => x.date === d)
      if (!cur) return
      cur.dayName = `${target.name} (ชดเชย)`
      cur.note = cur.note ? `${cur.note} | ดึงท่าจาก ${target.name}` : `ดึงท่าจากโปรแกรม ${target.name}`
      cur.exercises = target.items.map(item => {
        const e = exById(item.exId) || { name: '?', muscle: '-' }
        return {
          exId: item.exId,
          name: e.name,
          muscle: e.muscle,
          targetSets: item.sets,
          targetReps: item.reps,
          rest: item.rest,
          done: false,
          note: '',
          sets: [{ reps: '', kg: '', rest: item.rest, rpe: '' }],
        }
      })
    })
    toast(`ดึงท่าจากโปรแกรม ${target.name} เรียบร้อยแล้ว`)
  }

  const handleSetField = (i, j, field, val) => {
    const R = { reps: [0, 999], kg: [0, 500], rest: [0, 1800], rpe: [1, 10] }[field]
    if (val !== '' && !(+val >= R[0] && +val <= R[1])) {
      toast(`${field} ต้องอยู่ระหว่าง ${R[0]}–${R[1]}`, true); return
    }
    update(s => {
      const ss = s.sessions.find(x => x.date === d)
      ss.exercises[i].sets[j][field] = val
    }, true)
  }

  const addSet = (i) => {
    update(s => {
      const ss = s.sessions.find(x => x.date === d)
      const e = ss.exercises[i]
      const prev = e.sets[e.sets.length - 1]
      e.sets.push({ reps: '', kg: prev ? prev.kg : '', rest: e.rest, rpe: '' })
    }, true)
  }

  const deleteSet = (i, j) => {
    update(s => {
      s.sessions.find(x => x.date === d).exercises[i].sets.splice(j, 1)
    }, true)
  }

  const completeExercise = (i) => {
    update(s => {
      const e = s.sessions.find(x => x.date === d).exercises[i]
      if (!e.done && !e.sets.some(x => +x.reps > 0)) {
        toast('กรอกจำนวนครั้งอย่างน้อย 1 เซ็ตก่อน', true)
        return
      }
      e.done = !e.done
    }, true)
  }

  const removeExercise = (i) => {
    if (!confirm('ลบท่านี้ออกจากการฝึกวันนี้?')) return
    update(s => {
      s.sessions.find(x => x.date === d).exercises.splice(i, 1)
    })
  }

  const addExerciseToSession = (e) => {
    if (e) e.preventDefault()
    const targetId = selectedExId || (S.exercises[0]?.id)
    if (!targetId) return
    const targetEx = exById(targetId)
    if (!targetEx) return
    update(s => {
      const currentSession = s.sessions.find(x => x.date === d)
      if (!currentSession) return
      currentSession.exercises.push({
        exId: targetEx.id,
        name: targetEx.name,
        muscle: targetEx.muscle,
        targetSets: targetEx.sets,
        targetReps: targetEx.reps,
        rest: targetEx.rest,
        done: false,
        note: '',
        sets: [{ reps: '', kg: '', rest: targetEx.rest, rpe: '' }],
      })
    }, true)
  }

  const handleExNote = (i, val) => {
    update(s => { s.sessions.find(x => x.date === d).exercises[i].note = val }, true)
  }

  const handleSessionNote = (val) => {
    update(s => { s.sessions.find(x => x.date === d).note = val }, true)
  }

  const saveProgress = () => {
    update(s => {}, false) // just trigger persist with toast
  }

  const completeWorkout = () => {
    if (!setsDone(sess)) { toast('ยังไม่มีผลการฝึกที่บันทึก', true); return }
    const doIt = () => update(s => {
      const ss = s.sessions.find(x => x.date === d)
      ss.status = 'completed'
      ss.exercises.forEach(e => { if (e.sets.some(x => +x.reps > 0)) e.done = true })
    })
    if (sess.exercises.some(e => !e.done)) {
      if (confirm('ยังมีท่าที่ไม่ได้กด Complete — ยืนยันว่าฝึกเสร็จแล้ว?')) doIt()
    } else doIt()
  }

  const reopenWorkout = () => {
    update(s => { s.sessions.find(x => x.date === d).status = 'in_progress' })
  }

  const deleteSession = () => {
    if (!confirm('ลบบันทึกการฝึกของวันนี้?')) return
    update(s => { s.sessions = s.sessions.filter(x => x.date !== d) })
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1>🏋️‍♂️ Daily Workout</h1>
        <p className="mut" style={{ margin: 0, fontSize: 14 }}>
          บันทึกน้ำหนัก จำนวนครั้ง และความเข้มข้นของการฝึก
        </p>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="sp" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="row" style={{ margin: 0 }}>
            <button className="b s" onClick={() => goDate(-1)}>‹ วันก่อน</button>
            <input
              type="date"
              value={d}
              onChange={e => navigate(`/daily/${e.target.value}`)}
              style={{ fontWeight: 600 }}
            />
            <button className="b s" onClick={() => goDate(1)}>วันถัดไป ›</button>
          </div>
          <button className="b s" onClick={() => navigate(`/daily/${today()}`)}>
            📅 ไปที่วันนี้
          </button>
        </div>
      </div>

      <div className="card sp" style={{ borderLeft: '4px solid var(--g)' }}>
        <div>
          <span className="mut" style={{ fontSize: 13, display: 'block' }}>{DN[dow(d)]}</span>
          <b style={{ fontSize: 18 }}>{y.name}</b>
        </div>
        <Badge status={dstat()} />
      </div>

      {sess && sess.status === 'rest' ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px', borderLeft: '4px solid var(--b)' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🛌</div>
          <b style={{ fontSize: 20, color: 'var(--b)', display: 'block' }}>
            {sess.dayName || 'วันพักผ่อน (สลับเป็นวันพัก)'}
          </b>
          <p className="mut" style={{ margin: '8px 0 24px', fontSize: 14 }}>
            {sess.note || 'คุณได้กำหนดให้วันนี้เป็นวันพักผ่อน เพื่อไปออกกำลังกายชดเชยในวันอื่น'}
          </p>
          <div className="row" style={{ justifyContent: 'center', gap: 12, margin: 0, flexWrap: 'wrap' }}>
            <button className="b s" onClick={unmarkRestDay} style={{ padding: '9px 18px', fontSize: 14 }}>
              ↩ ยกเลิกวันพัก (กลับสู่ตารางปกติ)
            </button>
            <button className="b p" onClick={startWorkout} style={{ padding: '9px 18px', fontSize: 14 }}>
              ⚡ เปลี่ยนใจ อยากเริ่มฝึกวันนี้
            </button>
          </div>
        </div>
      ) : !sess ? (
        <div className="card">
          {/* Suggestion banner if yesterday was missed & today is rest day */}
          {y.rest && missedYesterday && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.25))',
              border: '1px solid var(--g)',
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--g)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>💡</span> เล่นชดเชย: เมื่อวาน ({DN[yesterdayDow].split(' ')[0]}) คุณยังไม่ได้ฝึก
                </div>
                <div className="mut" style={{ fontSize: 13, marginTop: 4 }}>
                  วันนี้เป็นวันพักตามแผน ต้องการนำโปรแกรม <b>"{yesterdayPlan.name}"</b> มาฝึกทดแทนวันนี้ไหม?
                </div>
              </div>
              <button
                className="b p"
                style={{ fontSize: 13, padding: '8px 14px' }}
                onClick={() => setSelectedPlanIdx(yesterdayDow)}
              >
                ⚡ ดึงโปรแกรม {yesterdayPlan.name} มาเล่นวันนี้
              </button>
            </div>
          )}

          {/* Program Selector */}
          <div style={{
            background: 'var(--c2)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--ln)',
            marginBottom: 16
          }}>
            <div className="sp" style={{ marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🔄</span> {y.rest ? 'วันนี้เป็นวันพัก — เลือกโปรแกรมมาฝึกทดแทน:' : 'เลือกโปรแกรมที่จะฝึกวันนี้:'}
              </label>
              {isSubstituted && (
                <button
                  className="b s"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => setSelectedPlanIdx(dow(d))}
                >
                  ↺ กลับไปตามตาราง ({DN[dow(d)].split(' ')[0]})
                </button>
              )}
            </div>

            <select
              value={targetPlanIndex}
              onChange={e => setSelectedPlanIdx(Number(e.target.value))}
              style={{ width: '100%', fontWeight: 600, padding: '8px 12px' }}
            >
              <option value={dow(d)}>
                ⭐ โปรแกรมตามตารางประจำวัน ({DN[dow(d)].split(' ')[0]}: {y.name}{y.rest ? ' - วันพัก' : ''})
              </option>
              <optgroup label="🔁 สลับนำโปรแกรมของวันอื่นมาเล่นชดเชย:">
                {S.plan.days.map((p, idx) => {
                  if (idx === dow(d)) return null
                  return (
                    <option key={idx} value={idx}>
                      {DN[idx].split(' ')[0]} — {p.name} {p.rest ? '(วันพัก)' : `(${p.items?.length || 0} ท่า)`}
                    </option>
                  )
                })}
              </optgroup>
            </select>
          </div>

          <h3 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📋</span> รายการท่าที่จะฝึก ({displayPlan.name})
            {isSubstituted && <span className="bd" style={{ background: 'var(--g)', color: '#fff', fontSize: 11 }}>เล่นชดเชย</span>}
          </h3>

          {displayPlan.rest ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🛌</div>
              <b style={{ fontSize: 16 }}>{displayPlan.name}</b>
              <p className="mut" style={{ margin: '6px 0 0', fontSize: 13 }}>
                ไม่มีโปรแกรมการฝึกที่ต้องทำในวันนี้ — หากต้องการฝึกทดแทน สามารถเลือกโปรแกรมของวันอื่นจากเมนูด้านบนได้เลย
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {displayPlan.items.map((item, i) => (
                <div key={i} className="ex-row">
                  <div>
                    <span style={{ fontWeight: 600 }}>{exById(item.exId)?.name || '?'}</span>
                    <span className="mut" style={{ fontSize: 12, marginLeft: 8 }}>
                      ({exById(item.exId)?.muscle || '-'})
                    </span>
                  </div>
                  <span className="bd planned" style={{ fontSize: 12 }}>
                    {item.sets} เซ็ต × {item.reps} ครั้ง · พัก {item.rest}s
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="row" style={{ marginTop: 16, gap: 10, flexWrap: 'wrap' }}>
            <button className="b p" style={{ flex: 1, minWidth: 200, padding: '12px', fontSize: 15 }} onClick={startWorkout}>
              {isSubstituted
                ? `⚡ เริ่มการฝึกชดเชย: ${displayPlan.name}`
                : (displayPlan.rest ? '⚡ เริ่มการฝึกนอกตาราง (ไม่มีท่าตั้งต้น)' : `🚀 เริ่มการฝึก: ${displayPlan.name}`)}
            </button>
            {!displayPlan.rest && (
              <button
                className="b"
                style={{
                  background: 'var(--b-bg)',
                  color: 'var(--b)',
                  borderColor: 'rgba(56, 189, 248, 0.3)',
                  padding: '12px 18px',
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
                onClick={markAsRestDay}
                title="สลับวันนี้เป็นวันพักผ่อน เพื่อไปฝึกชดเชยวันอื่น"
              >
                🛌 วันนี้ขอพัก (สลับวันพัก)
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {sess.exercises.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '28px 16px', background: 'var(--c2)', border: '1px dashed var(--g2)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <b style={{ fontSize: 16 }}>ยังไม่มีท่าฝึกในเซสชันนี้</b>
              <p className="mut" style={{ fontSize: 13, margin: '6px 0 16px' }}>
                วันนี้เริ่มการฝึกจากวันพัก คุณสามารถเลือกดึงท่าฝึกจากโปรแกรมประจำวันเข้ามาฝึกได้ทันที:
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 450, margin: '0 auto' }}>
                <select id="importEmptyPlan" style={{ flex: 1, minWidth: 200, padding: '8px 12px' }}>
                  {S.plan.days.map((p, idx) => !p.rest && (
                    <option key={idx} value={idx}>{DN[idx].split(' ')[0]} — {p.name}</option>
                  ))}
                </select>
                <button
                  className="b p"
                  onClick={() => {
                    const sel = document.getElementById('importEmptyPlan')
                    if (sel) loadPlanIntoCurrentSession(Number(sel.value))
                  }}
                >
                  📥 ดึงท่าฝึกทันที
                </button>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '10px 14px', background: 'var(--c2)' }}>
            <div className="sp" style={{ flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>⏱️ จับเวลาพักด่วน:</span>
              <div className="row" style={{ margin: 0, gap: 6 }}>
                {[30, 45, 60, 90, 120].map(sec => (
                  <button key={sec} className="b s" onClick={() => setActiveTimerSeconds(sec)}>
                    {sec}วิ
                  </button>
                ))}
              </div>
            </div>
          </div>

          {sess.exercises.map((e, i) => (
            <div key={i} className={`card ${e.done ? 'dn' : ''}`} style={{ borderColor: e.done ? 'var(--g2)' : undefined }}>
              <div className="sp" style={{ borderBottom: '1px solid var(--ln)', paddingBottom: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <b style={{ fontSize: 17 }}>{e.name}</b>
                    <span className="bd" style={{ background: 'var(--c2)', fontSize: 11 }}>{e.muscle}</span>
                  </div>
                  <span className="mut" style={{ fontSize: 13 }}>
                    เป้าหมาย {e.targetSets} เซ็ต × {e.targetReps} ครั้ง · พัก {e.rest} วินาที
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    className="b s"
                    onClick={() => setActiveTimerSeconds(e.rest || 60)}
                    title="เริ่มนับเวลาพักของท่านี้"
                  >
                    ⏱️ พัก {e.rest || 60}s
                  </button>
                  {e.done && <span className="bd completed">✓ เสร็จแล้ว</span>}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 44, textAlign: 'center' }}>เซ็ต</th>
                      <th>ครั้ง</th>
                      <th>น้ำหนัก (กก.)</th>
                      <th>พัก (วิ)</th>
                      <th>เหนื่อย (1-10)</th>
                      <th style={{ width: 36 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {e.sets.map((set, j) => (
                      <tr key={j}>
                        <td style={{ fontWeight: 700, color: 'var(--g-bright)', textAlign: 'center' }}>{j + 1}</td>
                        {['reps', 'kg', 'rest', 'rpe'].map(f => (
                          <td key={f}>
                            <input
                              className="n" type="number"
                              step={f === 'kg' ? '0.5' : '1'}
                              value={set[f]}
                              placeholder={
                                f === 'reps' ? String(e.targetReps) :
                                f === 'kg' ? '0' :
                                f === 'rest' ? String(e.rest) :
                                '1-10'
                              }
                              onChange={ev => handleSetField(i, j, f, ev.target.value)}
                            />
                          </td>
                        ))}
                        <td><button className="b s d" onClick={() => deleteSet(i, j)} title="ลบเซ็ตนี้">✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <input
                style={{ width: '100%', marginTop: 12 }}
                placeholder="📝 บันทึกหรือข้อความเพิ่มเติมสำหรับท่านี้..."
                value={e.note}
                onChange={ev => handleExNote(i, ev.target.value)}
              />

              <div className="row" style={{ marginTop: 14 }}>
                <button className="b s" onClick={() => addSet(i)}>+ เพิ่มเซ็ต (Add Set)</button>
                <button className={`b s ${e.done ? '' : 'p'}`} onClick={() => completeExercise(i)}>
                  {e.done ? '↩ ยกเลิกเสร็จสิ้น' : '✓ เสร็จสิ้นท่านี้'}
                </button>
                <button className="b s d" onClick={() => removeExercise(i)}>ลบท่านี้</button>
              </div>
            </div>
          ))}

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>➕ เพิ่มท่าฝึกเพิ่มเติม</h3>
            <div className="row" style={{ margin: 0 }}>
              <select
                value={selectedExId || (S.exercises[0]?.id || '')}
                onChange={e => setSelectedExId(e.target.value)}
                style={{ flex: 1 }}
              >
                {S.exercises.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.muscle})</option>
                ))}
              </select>
              <button className="b" type="button" onClick={addExerciseToSession}>+ เพิ่มท่า</button>
            </div>

            <label style={{ marginTop: 16 }}>หมายเหตุสรุปประจำวัน</label>
            <textarea
              rows="2"
              placeholder="ความรู้สึก พลังงาน หรือสิ่งที่อยากจดจำของวันนี้..."
              value={sess.note}
              onChange={ev => handleSessionNote(ev.target.value)}
            />
          </div>

          <div className="card" style={{ background: 'var(--c2)' }}>
            <div className="sp" style={{ flexWrap: 'wrap', gap: 10 }}>
              <div className="row" style={{ margin: 0 }}>
                <button className="b" onClick={saveProgress}>💾 บันทึกความคืบหน้า</button>
                {sess.status === 'completed' ? (
                  <button className="b" onClick={reopenWorkout}>🔓 เปิดแก้ไขการฝึก</button>
                ) : (
                  <button className="b p" onClick={completeWorkout}>🎉 จบการฝึกวันนี้ (Complete)</button>
                )}
              </div>
              <button className="b d" onClick={deleteSession}>🗑 ลบบันทึกวันนี้</button>
            </div>
          </div>
        </>
      )}

      {activeTimerSeconds !== null && (
        <RestTimer
          initialSeconds={activeTimerSeconds}
          onFinish={() => {
            toast('🔔 ครบเวลาพักแล้ว! เริ่มยกเซ็ตต่อไปได้เลย 💪')
            setActiveTimerSeconds(null)
          }}
          onCancel={() => setActiveTimerSeconds(null)}
        />
      )}
    </>
  )
}
