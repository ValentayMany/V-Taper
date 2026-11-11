import { useNavigate } from 'react-router-dom'
import { today, iso } from '../services/db'

const BADGES = {
  completed: { label: 'ฝึกสำเร็จ', icon: '🟢' },
  partial: { label: 'กำลังฝึก', icon: '🟡' },
  rest: { label: 'วันพัก', icon: '🔵' },
  'planned-rest': { label: 'พักตามแผน', icon: '💤' },
  skipped: { label: 'ไม่ได้ฝึก', icon: '🔴' },
  planned: { label: 'ตามตาราง', icon: '⚪' },
}

export function Badge({ status }) {
  const b = BADGES[status] || { label: status, icon: '•' }
  return (
    <span className={`bd ${status}`}>
      <span>{b.icon}</span>
      <span>{b.label}</span>
    </span>
  )
}

export default function Calendar({ dayStatuses = {}, calMonth, setCalMonth }) {
  const navigate = useNavigate()
  const t = today()
  const [yy, mm] = calMonth.split('-').map(Number)

  const firstDate = new Date(yy, mm - 1, 1)
  const firstDow = (firstDate.getDay() + 6) % 7 // 0=Mon
  const daysInMonth = new Date(yy, mm, 0).getDate()

  const toISO = (day) =>
    `${yy}-${String(mm).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const prev = () => {
    const d = new Date(yy, mm - 2, 1)
    setCalMonth(iso(d).slice(0, 7))
  }
  const next = () => {
    const d = new Date(yy, mm, 1)
    setCalMonth(iso(d).slice(0, 7))
  }

  const monthLabel = new Date(yy, mm - 1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })

  return (
    <>
      <div className="sp" style={{ marginBottom: 12 }}>
        <button className="b s" onClick={prev}>‹ ก่อนหน้า</button>
        <h3 style={{ margin: 0 }}>{monthLabel}</h3>
        <button className="b s" onClick={next}>ถัดไป ›</button>
      </div>
      <div className="cal">
        {['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'].map((d, i) => (
          <div key={i} className="h">{d}</div>
        ))}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`e${i}`} style={{ cursor: 'default' }} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const d = toISO(day)
          const status = dayStatuses[d] || ''
          const isToday = d === t
          return (
            <div
              key={day}
              className={`${status} ${isToday ? 't' : ''}`}
              onClick={() => navigate(`/daily/${d}`)}
              title={BADGES[status]?.label || undefined}
            >
              {day}
            </div>
          )
        })}
      </div>
      <div className="row" style={{ marginTop: 14, gap: 8 }}>
        {['completed', 'partial', 'rest', 'skipped'].map(s => (
          <Badge key={s} status={s} />
        ))}
      </div>
    </>
  )
}
