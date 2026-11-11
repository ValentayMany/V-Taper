import { useStore } from '../hooks/useStore'
import { uid } from '../services/db'

const DN = ['วันจันทร์ (Monday)', 'วันอังคาร (Tuesday)', 'วันพุธ (Wednesday)', 'วันพฤหัสบดี (Thursday)', 'วันศุกร์ (Friday)', 'วันเสาร์ (Saturday)', 'วันอาทิตย์ (Sunday)']

export default function Schedule() {
  const { S, update, toast } = useStore()
  const exById = (id) => S.exercises.find(e => e.id === id)

  const handleRestToggle = (d, checked) => {
    update(s => { s.plan.days[d].rest = checked }, true)
  }

  const handleNameChange = (d, val) => {
    update(s => { s.plan.days[d].name = val.trim() || DN[d] }, true)
  }

  const handleItemChange = (d, i, field, val) => {
    const v = +val
    const R = { sets: [1, 20], reps: [1, 300], rest: [0, 900] }[field]
    if (!(v >= R[0] && v <= R[1])) { toast('ค่าไม่ถูกต้อง', true); return }
    update(s => { s.plan.days[d].items[i][field] = v }, true)
  }

  const handleMove = (d, i, dir) => {
    const j = i + dir
    const items = S.plan.days[d].items
    if (j < 0 || j >= items.length) return
    update(s => {
      const a = s.plan.days[d].items;
      [a[i], a[j]] = [a[j], a[i]]
    }, true)
  }

  const handleRemove = (d, i) => {
    update(s => { s.plan.days[d].items.splice(i, 1) }, true)
  }

  const handleAdd = (d) => {
    const sel = document.getElementById('pa' + d)
    if (!sel) return
    const e = exById(sel.value)
    if (!e) return
    update(s => {
      s.plan.days[d].items.push({ id: uid(), exId: e.id, sets: e.sets, reps: e.reps, rest: e.rest })
    }, true)
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1>🗓 Workout Schedule</h1>
        <p className="mut" style={{ margin: 0, fontSize: 14 }}>
          กำหนดตารางฝึกประจำสัปดาห์ (การแก้ไขตารางจะไม่กระทบประวัติการฝึกเดิมที่เคยบันทึกไว้)
        </p>
      </div>

      {S.plan.days.map((day, d) => (
        <div key={d} className="card" style={{ borderLeft: day.rest ? '4px solid var(--b)' : '4px solid var(--g)' }}>
          <div className="sp" style={{ marginBottom: 10 }}>
            <div>
              <b style={{ fontSize: 16 }}>{DN[d]}</b>
              {day.rest && <span className="bd rest" style={{ marginLeft: 8, fontSize: 11 }}>วันพัก</span>}
            </div>
            <label style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={day.rest}
                onChange={e => handleRestToggle(d, e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--g)' }}
              />
              <span style={{ fontSize: 13 }}>ตั้งเป็นวันพัก</span>
            </label>
          </div>

          <input
            value={day.name}
            onChange={e => handleNameChange(d, e.target.value)}
            placeholder="ชื่อโปรแกรม เช่น Pull Day, Chest & Triceps"
            style={{ width: '100%', marginBottom: 12, fontWeight: 600 }}
          />

          {!day.rest && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {day.items.map((item, i) => {
                  const e = exById(item.exId)
                  return (
                    <div key={item.id || i} className="row" style={{
                      background: 'var(--c2)', padding: '8px 12px', borderRadius: 'var(--radius-md)',
                      margin: 0, border: '1px solid var(--ln)'
                    }}>
                      <span style={{ flex: 1, minWidth: 140, fontWeight: 500 }}>
                        {e?.name || '(ลบแล้ว)'}
                        <span className="mut" style={{ fontSize: 12, marginLeft: 6 }}>({e?.muscle})</span>
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input className="n" type="number" value={item.sets}
                          onChange={ev => handleItemChange(d, i, 'sets', ev.target.value)} title="เซ็ต" />
                        <span className="mut">×</span>
                        <input className="n" type="number" value={item.reps}
                          onChange={ev => handleItemChange(d, i, 'reps', ev.target.value)} title="ครั้ง" />
                        <span className="mut">·</span>
                        <input className="n" type="number" value={item.rest}
                          onChange={ev => handleItemChange(d, i, 'rest', ev.target.value)} title="พัก (วินาที)" />
                        <span className="mut">s</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="b s" onClick={() => handleMove(d, i, -1)} title="เลื่อนขึ้น">↑</button>
                        <button className="b s" onClick={() => handleMove(d, i, 1)} title="เลื่อนลง">↓</button>
                        <button className="b s d" onClick={() => handleRemove(d, i)} title="ลบออก">✕</button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="row" style={{ marginTop: 12 }}>
                <select id={'pa' + d} style={{ flex: 1 }}>
                  {S.exercises.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.muscle})</option>
                  ))}
                </select>
                <button className="b s" onClick={() => handleAdd(d)}>+ เพิ่มท่าในวันนี้</button>
              </div>
            </>
          )}
        </div>
      ))}
    </>
  )
}
