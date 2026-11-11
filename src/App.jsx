import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider, useStore } from './hooks/useStore'
import Sidebar from './components/Sidebar'
import MobileNav from './components/MobileNav'
import Toast from './components/Toast'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import Daily from './pages/Daily'
import History from './pages/History'
import Progress from './pages/Progress'
import Library from './pages/Library'
import Settings from './pages/Settings'

function AppContent() {
  const { S, loading: storeLoading } = useStore()

  if (storeLoading || !S) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <p className="mut">กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div id="app">
        <Sidebar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/daily" element={<Daily />} />
            <Route path="/daily/:date" element={<Daily />} />
            <Route path="/history" element={<History />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/library" element={<Library />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
      <Toast />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  )
}
