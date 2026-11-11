import { NavLink } from 'react-router-dom'

const NAV = [
  ['/', 'Dashboard', '📊'],
  ['/schedule', 'Schedule', '🗓'],
  ['/daily', 'Daily Workout', '🏋'],
  ['/history', 'History', '📜'],
  ['/progress', 'Progress', '📈'],
  ['/library', 'Exercises', '📚'],
  ['/settings', 'Settings', '⚙'],
]

export default function Sidebar() {
  return (
    <aside>
      <div className="brand-wrapper">
        <div className="brand-icon">💪</div>
        <div className="brand-info">
          <h2>Lean V-Taper</h2>
          <span className="brand-tag">PRO TRACKER</span>
        </div>
      </div>

      <nav className="nav-links">
        {NAV.map(([to, label, icon]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nv${isActive ? ' on' : ''}`} end={to === '/'}>
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot"></span>
        <span>Local Storage • พร้อมใช้งาน</span>
      </div>
    </aside>
  )
}
