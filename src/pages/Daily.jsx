import { useState } from 'react'
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

  const exById = (id) => S.exercises.find(e => e.id === id)
  const sess = S.sessions.find(s => s.date === d)
  const y = S.plan.days[dow(d)]

  const dstat = () => {
    if (sess) return sess.status === 'in_progress' ? 'partial' : sess.status
    if (y.rest) return d <= today() ? 'rest' : 'planned-rest'
    return d < today() && d >= S.settings.start ? 'skipped' : 'planned'
  }

  const setsDone = (s) => s.exercises.reduce((n, e) => n + e.sets.filter(x => +x.reps > 0).length, 0)

  const goDate = (n) => navigate(`/daily/${add(d, n)}`)

  const startWorkout = () => {
    update(s => {
      s.sessions.push({
        id: uid(), date: d, dayName: y.name, status: 'in_progress',
        note: '', startedAt: Date.now(),
        exercises: y.rest ? [] : y.items.map(item => {
          const e = exById(item.exId) || { name: '?', muscle: '-' }
          return {
            exId: item.exId, name: e.name, muscle: e.muscle,
            targetSets: item.sets, targetReps: item.reps, rest: item.rest,
            done: false, note: '',
            sets: [{ reps: '', kg: '', rest: item.rest, rpe: '' }],
          }
        }),
      })
    })
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

      {!sess ? (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>📋 รายการท่าตามโปรแกรม</h3>
          {y.rest ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🛌</div>
              <b style={{ fontSize: 16 }}>วันพักตามแผน</b>
              <p className="mut" style={{ margin: '4px 0 0' }}>ไม่มีโปรแกรมการฝึกที่ต้องทำในวันนี้</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {y.items.map((item, i) => (
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
          <div className="row">
            <button className="b p" style={{ width: '100%', padding: '12px' }} onClick={startWorkout}>
              {y.rest ? '⚡ เริ่มการฝึกนอกตาราง' : '🚀 เริ่มการฝึกวันนี้ (Start Workout)'}
            </button>
          </div>
        </div>
      ) : (
        <>
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
