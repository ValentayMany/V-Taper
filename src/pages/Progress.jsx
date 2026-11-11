import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { uid, today, add, wk } from '../services/db'
import { SvgLine, SvgBars } from '../components/SvgCharts'

export default function Progress() {
  const { S, update, toast } = useStore()
  const t = today()

  const [range, setRange] = useState('90')
  const [grp, setGrp] = useState('week')
  const [selEx, setSelEx] = useState('')

  const ms = [...S.measures].sort((a, b) => a.date < b.date ? -1 : 1)
  const lim = range === 'all' ? '0000' : add(t, -Number(range))

  // Weight chart
  const w = ms.filter(m => m.weight && m.date >= lim).map(m => ({ l: m.date.slice(5), v: +m.weight }))

  // V-Taper Ratio calculations (Shoulders / Waist)
  const ratioMeasures = ms.filter(m => m.waist && (m.shoulders || m.chest))
  const ratioPoints = ratioMeasures
    .filter(m => m.date >= lim)
    .map(m => {
      const s = m.shoulders ? +m.shoulders : (+m.chest * 1.22)
      const r = +(s / +m.waist).toFixed(2)
      return { l: m.date.slice(5), v: r }
    })

  const latestRatioMeasure = ratioMeasures[ratioMeasures.length - 1]
  const prevRatioMeasure = ratioMeasures[ratioMeasures.length - 2]
  const currentRatio = latestRatioMeasure ? +(
    (latestRatioMeasure.shoulders ? +latestRatioMeasure.shoulders : +latestRatioMeasure.chest * 1.22) / +latestRatioMeasure.waist
  ).toFixed(2) : null

  const prevRatio = prevRatioMeasure ? +(
    (prevRatioMeasure.shoulders ? +prevRatioMeasure.shoulders : +prevRatioMeasure.chest * 1.22) / +prevRatioMeasure.waist
  ).toFixed(2) : null

  const ratioDiff = currentRatio && prevRatio ? +(currentRatio - prevRatio).toFixed(2) : null

  const getTier = (r) => {
    if (!r) return null
    if (r >= 1.60) return { label: 'Adonis Golden Ratio ✨', color: '#f59e0b', desc: 'ระดับสมบูรณ์แบบตามอุดมคติ V-Taper' }
    if (r >= 1.45) return { label: 'V-Shape ชัดเจน 🔥', color: 'var(--g-bright)', desc: 'ไหล่กว้าง เอวคอด เห็นสัดส่วนชัดเจนมาก' }
    if (r >= 1.30) return { label: 'Athletic Fit ⚡', color: 'var(--b)', desc: 'หุ่นสมส่วนฟิตเฟิร์ม เริ่มเห็นโครงสร้าง' }
    return { label: 'Developing 🌱', color: 'var(--mt)', desc: 'กำลังพัฒนาโครงสร้างกล้ามเนื้อ' }
  }
  const tier = getTier(currentRatio)

  // Workout frequency
  const setsDone = (s) => s.exercises.reduce((n, e) => n + e.sets.filter(x => +x.reps > 0).length, 0)
  const ss = S.sessions.filter(s => (s.status === 'completed' || setsDone(s) > 0) && s.date >= lim)
  const gMap = {}
  ss.forEach(s => {
    const k = grp === 'week' ? wk(s.date).slice(5) : s.date.slice(0, 7)
    gMap[k] = (gMap[k] || 0) + 1
  })
  const fr = Object.keys(gMap).sort().slice(-10).map(k => ({ l: k, v: gMap[k] }))

  // Weekly completion rate
  const pl = S.plan.days.filter(x => !x.rest).length || 1
  const cr = []
  for (let i = 7; i >= 0; i--) {
    const a = add(wk(t), -7 * i)
    const c = S.sessions.filter(s => s.status === 'completed' && wk(s.date) === a).length
    cr.push({ l: a.slice(5), v: Math.min(100, Math.round(c / pl * 100)) })
  }

  // Exercise performance
  const names = [...new Set(S.sessions.flatMap(s => s.exercises.map(e => e.name)))]
  const currentEx = selEx && names.includes(selEx) ? selEx : names[0] || ''
  const ep = S.sessions
    .slice().sort((a, b) => a.date < b.date ? -1 : 1)
    .map(s => {
      const e = s.exercises.find(x => x.name === currentEx)
      if (!e) return null
      const r = e.sets.reduce((n, x) => n + (+x.reps || 0), 0)
      return r ? { l: s.date.slice(5), v: r } : null
    }).filter(Boolean)

  // Add measurement
  const handleSubmit = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const o = Object.fromEntries(fd)
    const bad = [
      ['weight', 20, 400],
      ['height', 50, 260],
      ['shoulders', 50, 250],
      ['chest', 50, 250],
      ['waist', 30, 250],
      ['pushups', 0, 500],
    ].find(([k, a, b]) => o[k] !== '' && !(+o[k] >= a && +o[k] <= b))
    if (bad) { toast(`ค่า ${bad[0]} ต้องอยู่ระหว่าง ${bad[1]}–${bad[2]}`, true); return }
    if (!o.weight && !o.height && !o.waist && !o.shoulders && !o.chest && !o.pushups) {
      toast('กรอกอย่างน้อย 1 ค่า', true); return
    }
    update(s => {
      s.measures.push({
        id: uid(),
        date: o.date,
        weight: o.weight,
        height: o.height,
        shoulders: o.shoulders,
        chest: o.chest,
        waist: o.waist,
        pushups: o.pushups,
        note: o.note,
      })
    })
    e.target.reset()
  }

  const deleteMeasure = (id) => {
    update(s => { s.measures = s.measures.filter(m => m.id !== id) })
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1>📈 Progress & V-Taper Metrics</h1>
        <p className="mut" style={{ margin: 0, fontSize: 14 }}>
          ติดตามการเปลี่ยนแปลงของสัดส่วน V-Taper น้ำหนักตัว และความแข็งแรง
        </p>
      </div>

      {/* V-Taper Ratio Hero Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(18, 24, 32, 0.95) 100%)',
        borderColor: 'rgba(16, 185, 129, 0.35)',
        boxShadow: '0 8px 28px rgba(0, 0, 0, 0.4), 0 0 20px rgba(16, 185, 129, 0.15)',
      }}>
        <div className="sp" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>🔱</span>
              <h3 style={{ margin: 0, fontSize: 18 }}>V-Taper Ratio (สัดส่วนไหล่ต่อเอว)</h3>
            </div>
            <p className="mut" style={{ margin: '4px 0 0', fontSize: 13 }}>
              เป้าหมายสัดส่วนเทพเจ้ากรีก (Golden Ratio / Adonis Index) = <b>1.618</b>
            </p>
          </div>
          {tier && (
            <span className="bd" style={{ background: 'rgba(255,255,255,0.08)', color: tier.color, fontSize: 13, padding: '5px 12px' }}>
              {tier.label}
            </span>
          )}
        </div>

        {currentRatio ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
              <b style={{ fontSize: 38, color: 'var(--g-bright)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {currentRatio}
              </b>
              <span className="mut" style={{ fontSize: 14 }}>
                / 1.618 (คิดเป็น {Math.min(100, Math.round((currentRatio / 1.618) * 100))}%)
              </span>
              {ratioDiff !== null && (
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: ratioDiff > 0 ? 'var(--g-bright)' : ratioDiff < 0 ? 'var(--r)' : 'var(--mt)'
                }}>
                  {ratioDiff > 0 ? `▲ +${ratioDiff}` : ratioDiff < 0 ? `▼ ${ratioDiff}` : '— เท่าเดิม'}
                </span>
              )}
            </div>

            <div className="bar" style={{ height: 12, marginTop: 4, marginBottom: 10 }}>
              <i style={{
                width: `${Math.min(100, Math.round((currentRatio / 1.618) * 100))}%`,
                background: currentRatio >= 1.60 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--g-grad)',
              }} />
            </div>

            <div className="sp" style={{ fontSize: 12, color: 'var(--mt)' }}>
              <span>ไหล่ล่าสุด: <b>{latestRatioMeasure?.shoulders || '-'} cm</b> · เอวล่าสุด: <b>{latestRatioMeasure?.waist || '-'} cm</b></span>
              <span>{tier?.desc}</span>
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px 0' }}>
            <p className="mut" style={{ margin: 0, fontSize: 14 }}>
              💡 ยังไม่มีข้อมูลรอบไหล่และรอบเอว — บันทึกข้อมูลที่กล่องด้านล่างเพื่อคำนวณสัดส่วน V-Taper ทันที!
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 14 }}>📏 บันทึกสัดส่วนร่างกาย (Body Measurements)</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 12 }}>
            <div>
              <label>วันที่</label>
              <input name="date" type="date" defaultValue={t} required style={{ width: '100%' }} />
            </div>
            <div>
              <label>รอบไหล่ (cm) ⭐</label>
              <input name="shoulders" type="number" step="0.1" placeholder="เช่น 118" style={{ width: '100%' }} />
            </div>
            <div>
              <label>รอบอก (cm)</label>
              <input name="chest" type="number" step="0.1" placeholder="เช่น 100" style={{ width: '100%' }} />
            </div>
            <div>
              <label>รอบเอว (cm) ⭐</label>
              <input name="waist" type="number" step="0.1" placeholder="เช่น 78" style={{ width: '100%' }} />
            </div>
            <div>
              <label>น้ำหนัก (kg)</label>
              <input name="weight" type="number" step="0.1" placeholder="เช่น 68.5" style={{ width: '100%' }} />
            </div>
            <div>
              <label>ส่วนสูง (cm)</label>
              <input name="height" type="number" step="0.1" placeholder="เช่น 175" style={{ width: '100%' }} />
            </div>
            <div>
              <label>วิดพื้น (ครั้ง)</label>
              <input name="pushups" type="number" placeholder="เช่น 25" style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input name="note" placeholder="โน้ตเพิ่มเติม (เช่น วัดช่วงเช้าก่อนอาหาร)" style={{ flex: 1 }} />
            <button className="b p" type="submit">+ บันทึกสัดส่วน</button>
          </div>
        </form>

        <div style={{ marginTop: 18, borderTop: '1px solid var(--ln)', paddingTop: 14 }}>
          <span className="mut" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>5 รายการล่าสุด</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {ms.slice(-5).reverse().map(m => {
              const r = m.waist && (m.shoulders || m.chest)
                ? +((m.shoulders ? +m.shoulders : +m.chest * 1.22) / +m.waist).toFixed(2)
                : null
              return (
                <div key={m.id} className="sp" style={{ padding: '8px 12px', background: 'var(--c2)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>
                  <div>
                    <b style={{ color: 'var(--g-bright)' }}>{m.date}</b>: 
                    {m.shoulders ? ` ไหล่ ${m.shoulders}cm` : ''} 
                    {m.chest ? ` · อก ${m.chest}cm` : ''} 
                    {m.waist ? ` · เอว ${m.waist}cm` : ''} 
                    {r ? ` (🔱 Ratio: ${r})` : ''}
                    {m.weight ? ` · ${m.weight}kg` : ''} 
                    {m.pushups ? ` · วิดพื้น ${m.pushups}ครั้ง` : ''} 
                    {m.note ? ` (${m.note})` : ''}
                  </div>
                  <button className="b s d" onClick={() => deleteMeasure(m.id)}>✕</button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="sp" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div className="row" style={{ margin: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>ช่วงเวลา:</span>
            <select value={range} onChange={e => setRange(e.target.value)}>
              {[['30', '30 วันล่าสุด'], ['90', '90 วันล่าสุด'], ['365', '1 ปี'], ['all', 'ข้อมูลทั้งหมด']].map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="row" style={{ margin: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>จัดกลุ่ม:</span>
            <select value={grp} onChange={e => setGrp(e.target.value)}>
              <option value="week">รายสัปดาห์</option>
              <option value="month">รายเดือน</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>🔱 แนวโน้มสัดส่วน V-Taper Ratio (รอบไหล่ ÷ รอบเอว)</h3>
        <SvgLine points={ratioPoints} unit="" />
      </div>

      <div className="card">
        <h3>⚖️ แนวโน้มน้ำหนักตัว (Weight Progress)</h3>
        <SvgLine points={w} unit=" kg" />
      </div>

      <div className="card">
        <h3>🔥 ความถี่ในการฝึก (Workout Frequency)</h3>
        <SvgBars points={fr} unit=" วัน" />
      </div>

      <div className="card">
        <div className="sp" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>💪 พัฒนาการเฉพาะท่า (Exercise Performance)</h3>
          <select value={currentEx} onChange={e => setSelEx(e.target.value)}>
            {names.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <SvgLine points={ep} unit=" reps" />
      </div>

      <div className="card">
        <h3>🎯 อัตราการฝึกสำเร็จตามแผนรายสัปดาห์ (%)</h3>
        <SvgBars points={cr} unit="%" max={100} />
      </div>
    </>
  )
}
