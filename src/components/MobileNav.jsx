import { NavLink } from 'react-router-dom'

const NAV = [
  ['/', 'Home', '📊'],
  ['/schedule', 'Plan', '🗓'],
  ['/daily', 'Workout', '🏋'],
  ['/history', 'History', '📜'],
  ['/progress', 'Stats', '📈'],
  ['/library', 'Library', '📚'],
  ['/settings', 'Settings', '⚙'],
]

export default function MobileNav() {
  return (
    <nav id="bnav">
      {NAV.map(([to, label, icon]) => (
        <NavLink key={to} to={to} className={({ isActive }) => `nv${isActive ? ' on' : ''}`} end={to === '/'}>
          <span>{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
