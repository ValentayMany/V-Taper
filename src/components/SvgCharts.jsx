export function SvgLine({ points, unit }) {
  if (!points || !points.length) return <p className="mut" style={{ padding: '16px 0', textAlign: 'center' }}>ยังไม่มีข้อมูลสำหรับการแสดงกราฟ</p>
  const W = 600, H = 200, q = 32
  const vals = points.map(x => x.v)
  let a = Math.min(...vals), b = Math.max(...vals)
  if (a === b) { a -= 1; b += 1 }
  const X = (i) => q + (points.length === 1 ? (W - 2 * q) / 2 : i * (W - 2 * q) / (points.length - 1))
  const Y = (x) => H - q - (x - a) / (b - a) * (H - 2 * q)

  const linePoints = points.map((x, i) => `${X(i)},${Y(x.v)}`).join(' ')
  const areaPoints = `${linePoints} ${X(points.length - 1)},${H - q} ${X(0)},${H - q}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ch">
      <defs>
        <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      
      {/* Background grid line */}
      <line x1={q} y1={Y(b)} x2={W - q} y2={Y(b)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      <line x1={q} y1={Y(a)} x2={W - q} y2={Y(a)} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

      {/* Area gradient */}
      <polygon fill="url(#lineAreaGrad)" points={areaPoints} />

      {/* Main line */}
      <polyline
        fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        points={linePoints}
      />

      {/* Dots */}
      {points.map((x, i) => (
        <circle key={i} cx={X(i)} cy={Y(x.v)} r="4.5" fill="#10b981" stroke="#090c10" strokeWidth="2">
          <title>{x.l}: {x.v}{unit || ''}</title>
        </circle>
      ))}

      {/* Axes */}
      <text x="4" y={Y(b) + 4} className="ax" fill="var(--mt)">{+b.toFixed(1)}</text>
      <text x="4" y={Y(a) + 4} className="ax" fill="var(--mt)">{+a.toFixed(1)}</text>
      <text x={q} y={H - 8} className="ax" fill="var(--mt)">{points[0].l}</text>
      <text x={W - q} y={H - 8} textAnchor="end" className="ax" fill="var(--mt)">{points[points.length - 1].l}</text>
    </svg>
  )
}

export function SvgBars({ points, unit, max: maxOverride }) {
  if (!points || !points.length) return <p className="mut" style={{ padding: '16px 0', textAlign: 'center' }}>ยังไม่มีข้อมูลสำหรับการแสดงกราฟ</p>
  const W = 600, H = 200, q = 26
  const m = maxOverride || Math.max(...points.map(x => x.v), 1)
  const w = (W - 2 * q) / points.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ch">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      {points.map((x, i) => {
        const h = (x.v / m) * (H - 2 * q)
        return (
          <g key={i}>
            <rect
              x={q + i * w + 5} y={H - q - h}
              width={Math.max(w - 10, 6)} height={Math.max(h, 2)}
              rx="4" fill="url(#barGrad)"
            >
              <title>{x.l}: {x.v}{unit || ''}</title>
            </rect>
            <text x={q + i * w + w / 2} y={H - 10} textAnchor="middle" className="ax">{x.l}</text>
            <text x={q + i * w + w / 2} y={H - q - h - 6} textAnchor="middle" className="ax" fill="var(--tx)">{x.v}</text>
          </g>
        )
      })}
    </svg>
  )
}
