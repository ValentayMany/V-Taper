import { useState, useEffect, useRef, useCallback } from 'react'

function playBeep(frequency = 880, type = 'sine', duration = 0.18) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // AudioContext blocked or unsupported
  }
}

function playCompletionBeeps() {
  playBeep(659.25, 'sine', 0.15) // E5
  setTimeout(() => playBeep(880, 'sine', 0.25), 180) // A5
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try { navigator.vibrate([200, 100, 200]) } catch {}
  }
}

export default function RestTimer({ initialSeconds, onFinish, onCancel }) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds)
  const [totalTime, setTotalTime] = useState(initialSeconds)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    setTimeLeft(initialSeconds)
    setTotalTime(initialSeconds)
    setIsPaused(false)
  }, [initialSeconds])

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          playCompletionBeeps()
          if (onFinish) onFinish()
          return 0
        }
        // Beep countdown on last 3 seconds
        if (prev <= 4 && prev > 1) {
          playBeep(523.25, 'sine', 0.1)
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [isPaused, timeLeft, onFinish])

  const addTime = useCallback((sec) => {
    setTimeLeft(prev => Math.max(1, prev + sec))
    setTotalTime(prev => Math.max(1, prev + sec))
  }, [])

  const togglePause = () => setIsPaused(p => !p)

  const m = Math.floor(timeLeft / 60)
  const s = timeLeft % 60
  const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  const progressPercent = totalTime > 0 ? Math.min(100, ((totalTime - timeLeft) / totalTime) * 100) : 100

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 90,
      width: '92%',
      maxWidth: 420,
      background: 'rgba(18, 24, 32, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(16, 185, 129, 0.4)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.2)',
      borderRadius: 'var(--radius-lg)',
      padding: '14px 18px',
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, animation: timeLeft > 0 && !isPaused ? 'pulse 1s infinite' : 'none' }}>
            ⏱️
          </span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--mt)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              เวลาพักระหว่างเซ็ต
            </div>
            <div style={{
              fontSize: 26,
              fontWeight: 800,
              color: timeLeft <= 5 ? 'var(--r)' : 'var(--g-bright)',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
            }}>
              {formatted}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className="b s"
            onClick={() => addTime(15)}
            title="เพิ่ม 15 วินาที"
            style={{ fontWeight: 600, padding: '6px 10px' }}
          >
            +15s
          </button>
          <button
            className="b s"
            onClick={togglePause}
            style={{ padding: '6px 12px' }}
          >
            {isPaused ? '▶️ ต่อ' : '⏸️ พัก'}
          </button>
          <button
            className="b s d"
            onClick={onCancel}
            title="ข้ามเวลาพัก"
            style={{ padding: '6px 10px' }}
          >
            ✕ ข้าม
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div style={{
        height: 6,
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 99,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progressPercent}%`,
          background: timeLeft <= 5 ? 'var(--r)' : 'var(--g-grad)',
          transition: 'width 0.4s linear',
          boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
        }} />
      </div>
    </div>
  )
}

