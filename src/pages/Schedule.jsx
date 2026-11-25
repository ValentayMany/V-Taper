import { useStore } from '../hooks/useStore'
import { uid } from '../services/db'
import { applyLeanVTaperProgram } from '../services/seedData'

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

  const applyVTaperFocusPlan = () => {
    if (!confirm('ยืนยันตั้งค่าตารางเป็น "เน้น ไหล่ - อก - แขน (V-Taper Focus)"?\n(ประวัติการฝึกเดิมของคุณจะไม่หาย)')) return

    update(s => {
      // 1. Ensure required exercises exist
      const neededEx = [
        { name: 'Dumbbell Lateral Raise', muscle: 'Shoulders', equip: 'Dumbbell', sets: 4, reps: 15, rest: 60 },
        { name: 'Incline Dumbbell Press', muscle: 'Chest', equip: 'Dumbbell', sets: 3, reps: 12, rest: 90 },
      ]
      neededEx.forEach(nex => {
        if (!s.exercises.some(e => e.name.toLowerCase() === nex.name.toLowerCase())) {
          s.exercises.push({ id: uid(), ...nex })
        }
      })

      const getExId = (name) => {
        const found = s.exercises.find(e => e.name.toLowerCase() === name.toLowerCase())
        return found ? found.id : null
      }

      const makeItem = (name, sets, reps, rest) => {
        const eId = getExId(name)
        if (!eId) return null
        return { id: uid(), exId: eId, sets: sets || 3, reps: reps || 12, rest: rest || 60 }
      }

      const cleanItems = (list) => list.map(item => makeItem(...item)).filter(Boolean)

      s.plan.days = [
        // Day 0: Monday
        {
          name: 'Upper A (อกเน้นๆ + หลังแขน + ไหล่ข้าง)',
          rest: false,
          items: cleanItems([
            ['Push-up Board (Green Position)', 3, 10, 90],
            ['Dumbbell Floor Press', 3, 12, 90],
            ['Dumbbell Pullover', 3, 12, 75],
            ['Dumbbell Lateral Raise', 3, 15, 60],
            ['Overhead Triceps Extension', 3, 12, 60],
            ['Close-grip Push-up', 3, 10, 75],
          ])
        },
        // Day 1: Tuesday
        {
          name: 'Upper B (ไหล่กว้าง + หน้าแขน + ปีกหลัง)',
          rest: false,
          items: cleanItems([
            ['Dumbbell Shoulder Press', 3, 10, 90],
            ['Dumbbell Lateral Raise', 4, 15, 60],
            ['One-arm Dumbbell Row', 3, 12, 75],
            ['Biceps Curl', 3, 12, 60],
            ['Hammer Curl', 3, 12, 60],
            ['Prone Y-T Raise', 3, 10, 60],
          ])
        },
        // Day 2: Wednesday
        {
          name: 'Rest Day (วันพักฟื้นฟู)',
          rest: true,
          items: []
        },
        // Day 3: Thursday
        {
          name: 'Upper C (อก + ไหล่ 3 มิติ + แขน Super Pump)',
          rest: false,
          items: cleanItems([
            ['Dumbbell Floor Press', 3, 12, 90],
            ['Push-up Board (Green Position)', 3, 10, 75],
            ['Dumbbell Lateral Raise', 4, 15, 60],
            ['Bent-over Dumbbell Row', 3, 12, 75],
            ['Biceps Curl', 3, 12, 60],
            ['Overhead Triceps Extension', 3, 12, 60],
          ])
        },
        // Day 4: Friday
        {
          name: 'Rest Day (วันพัก หรือเล่นชดเชย)',
          rest: true,
          items: []
        },
        // Day 5: Saturday
        {
          name: 'Lower & Core (ช่วงล่าง + ท้อง V-Taper)',
          rest: false,
          items: cleanItems([
            ['Goblet Squat', 3, 12, 90],
            ['Dumbbell Romanian Deadlift', 3, 12, 90],
            ['Reverse Lunge', 3, 10, 75],
            ['Calf Raise', 3, 15, 45],
            ['Plank', 3, 45, 45],
          ])
        },
        // Day 6: Sunday
        {
          name: 'Rest Day (วันพักผ่อน)',
          rest: true,
          items: []
        }
      ]
    })
    toast('เปลี่ยนตารางเป็น "เน้น ไหล่ - อก - แขน" เรียบร้อยแล้ว!')
  }

  const applyStandardPlan = () => {
    if (!confirm('ยืนยันตั้งค่าเป็น "โปรแกรม Lean V-Taper 4 วัน (Upper / Lower)"?\n(ประวัติการฝึกเดิมของคุณจะไม่หาย)')) return
    update(s => {
      applyLeanVTaperProgram(s)
    })
    toast('อัปเดตเป็นโปรแกรม Lean V-Taper 4 วันเรียบร้อย ✓')
  }

  const detectActiveProgram = () => {
    const days = S.plan?.days || []
    const mon = days[0]?.name || ''
    const tue = days[1]?.name || ''
    const thu = days[3]?.name || ''
    if (mon.includes('Upper A (อก, หลัง, ไหล่, แขน)') && tue.includes('Lower A')) return 'lean4'
    if (mon.includes('Upper A (อกเน้นๆ') && thu.includes('Upper C')) return 'focus'
    return 'custom'
  }
  const activeProgram = detectActiveProgram()
  const activeLabel = activeProgram === 'lean4'
    ? '✨ โปรแกรม Lean V-Taper 4 วัน (ใหม่)'
    : activeProgram === 'focus'
    ? '🔥 ตารางเน้น ไหล่ - อก - แขน'
    : '🛠️ กำหนดเอง (Custom)'

  const buildScheduleExportText = () => {
    const muscleVolume = {}
    let workoutDaysCount = 0
    let totalSetsWeek = 0

    const dayBlocks = S.plan.days.map((day, idx) => {
      if (day.rest) {
        return `### ${DN[idx]}\n- **สถานะ:** วันพักฟื้นฟู (${day.name || 'Rest Day'})`
      }
      workoutDaysCount++
      const lines = (day.items || []).map((item, n) => {
        const ex = exById(item.exId)
        const name = ex?.name || 'ไม่ระบุชื่อท่า'
        const muscle = ex?.muscle || '-'
        const equip = ex?.equip || '-'
        const sets = Number(item.sets) || 0
        totalSetsWeek += sets
        if (muscle && muscle !== '-') {
          muscleVolume[muscle] = (muscleVolume[muscle] || 0) + sets
        }
        const repLabel = item.repRange || `${item.reps} ครั้ง`
        return `  ${n + 1}. **${name}** (${muscle} | ${equip}) — ${sets} เซ็ต × ${repLabel} · พัก ${item.rest} วินาที`
      })
      return `### ${DN[idx]} — ${day.name}\n${lines.length > 0 ? lines.join('\n') : '  - (ยังไม่มีท่าฝึก)'}`
    })

    const volumeLines = Object.entries(muscleVolume)
      .sort((a, b) => b[1] - a[1])
      .map(([m, s]) => `- **${m}:** ${s} เซ็ต/สัปดาห์`)

    return [
      `# ตารางฝึกประจำสัปดาห์ (My Lean V-Taper Tracker)`,
      `- **บริบทอุปกรณ์:** ฝึกที่บ้าน (ดัมเบลข้างละ 5 kg + บอร์ดวิดพื้น)`,
      `- **วันฝึก:** ${workoutDaysCount} วัน/สัปดาห์ (พัก ${7 - workoutDaysCount} วัน) · **ปริมาณรวม:** ${totalSetsWeek} เซ็ต/สัปดาห์`,
      ``,
      `## ปริมาณเซ็ตต่อกลุ่มกล้ามเนื้อ (Weekly Volume)`,
      volumeLines.length > 0 ? volumeLines.join('\n') : '- ยังไม่มีข้อมูล',
      ``,
      `## รายละเอียดตารางฝึก 7 วัน`,
      dayBlocks.join('\n\n'),
      ``,
      `---`,
      `ช่วยวิเคราะห์ตารางฝึกนี้ให้หน่อยครับว่า:`,
      `1. ปริมาณเซ็ตต่อกลุ่มกล้ามเนื้อและความถี่ต่อสัปดาห์เหมาะสมไหม (เทียบกับอุปกรณ์ดัมเบล 5 kg + บอร์ดวิดพื้น)?`,
      `2. จุดไหนควรเพิ่ม/ลด หรือจัดลำดับท่าใหม่เพื่อเน้นหุ่น V-Taper (ไหล่กว้าง อกชัด เอวคอด)?`,
    ].join('\n')
  }

  const handleCopyScheduleForAI = async () => {
    const text = buildScheduleExportText()
    try {
      await navigator.clipboard.writeText(text)
      toast('คัดลอกตารางสำหรับส่งให้ AI เรียบร้อยแล้ว ✓')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      toast('คัดลอกตารางสำหรับส่งให้ AI เรียบร้อยแล้ว ✓')
    }
  }

  const handleDownloadSchedule = () => {
    const text = buildScheduleExportText()
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `vtaper-schedule-${new Date().toISOString().slice(0, 10)}.md`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast('ดาวน์โหลดไฟล์ตารางฝึก (.md) เรียบร้อยแล้ว ✓')
  }

  return (
    <>
      <div className="sp" style={{ marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>🗓 Workout Schedule</h1>
          <p className="mut" style={{ margin: 0, fontSize: 14 }}>
            กำหนดตารางฝึกประจำสัปดาห์ (การแก้ไขตารางจะไม่กระทบประวัติการฝึกเดิมที่เคยบันทึกไว้)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="b s p"
            onClick={handleCopyScheduleForAI}
            title="คัดลอกตารางฝึกพร้อมสรุป Volume เพื่อวางส่งให้ AI วิเคราะห์"
          >
            📋 คัดลอกให้ AI วิเคราะห์
          </button>
          <button
            className="b s"
            onClick={handleDownloadSchedule}
            title="ดาวน์โหลดตารางฝึกเป็นไฟล์ Markdown (.md)"
          >
            📥 Export ไฟล์
          </button>
        </div>
      </div>

      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 78, 59, 0.2))',
        border: '1px solid var(--g2)',
        marginBottom: 20
      }}>
        <div className="sp" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <b style={{ fontSize: 16, color: 'var(--g)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🎯</span> เทมเพลตโปรแกรมฝึก
              </b>
              <span className="bd" style={{
                background: activeProgram === 'custom' ? 'rgba(56, 189, 248, 0.16)' : 'rgba(16, 185, 129, 0.18)',
                color: activeProgram === 'custom' ? '#38bdf8' : 'var(--g-bright)',
                border: activeProgram === 'custom' ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
                fontSize: 11.5,
                fontWeight: 700
              }}>
                ● กำลังใช้: {activeLabel}
              </span>
            </div>
            <p className="mut" style={{ margin: '5px 0 0', fontSize: 13 }}>
              คลิกเพื่อสลับตารางโปรแกรมได้ในคลิกเดียว (ไม่กระทบประวัติการฝึกเดิม)
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`b ${activeProgram === 'lean4' ? 'p' : 's'}`}
              onClick={applyStandardPlan}
              style={{ fontSize: 13 }}
            >
              ✨ โปรแกรม Lean V-Taper 4 วัน (หลัก){activeProgram === 'lean4' ? ' ✓' : ''}
            </button>
            <button
              className={`b ${activeProgram === 'focus' ? 'p' : 's'}`}
              onClick={applyVTaperFocusPlan}
              style={{ fontSize: 13 }}
            >
              🔥 ตารางเน้น ไหล่ - อก - แขน{activeProgram === 'focus' ? ' ✓' : ''}
            </button>
          </div>
        </div>
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
