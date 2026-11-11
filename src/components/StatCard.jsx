/**
 * StatCard – summary metric card
 *
 * Props:
 *   icon    – emoji
 *   label   – string
 *   value   – string | number
 *   sub     – optional subtitle string
 *   accent  – boolean (green highlight)
 */
export default function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className={`stat-card${accent ? ' accent' : ''}`}>
      {icon && <div className="stat-card-icon">{icon}</div>}
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value ?? '–'}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  )
}
