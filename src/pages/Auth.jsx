import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (isLogin) {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setMessage('สมัครสำเร็จ! ตรวจสอบอีเมลเพื่อยืนยันบัญชี')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 16,
    }}>
      <div className="card" style={{ maxWidth: 380, width: '100%' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 4 }}>💪 Lean V-Taper</h1>
        <p className="mut" style={{ textAlign: 'center', marginBottom: 16 }}>
          {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            required style={{ width: '100%', marginBottom: 8 }}
          />

          <label>Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            required minLength={6} style={{ width: '100%', marginBottom: 12 }}
          />

          {error && <p style={{ color: 'var(--r)', fontSize: 13, margin: '0 0 8px' }}>{error}</p>}
          {message && <p style={{ color: 'var(--g)', fontSize: 13, margin: '0 0 8px' }}>{message}</p>}

          <button className="b p" type="submit" disabled={loading} style={{ width: '100%', marginBottom: 8 }}>
            {loading ? 'กำลังโหลด...' : isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </form>

        <button
          className="b" onClick={() => { setIsLogin(!isLogin); setError(''); setMessage('') }}
          style={{ width: '100%' }}
        >
          {isLogin ? 'ยังไม่มีบัญชี? สมัครสมาชิก' : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'}
        </button>
      </div>
    </div>
  )
}
