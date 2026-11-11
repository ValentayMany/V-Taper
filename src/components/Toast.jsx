import { useEffect } from 'react'
import { useStore } from '../hooks/useStore'

export default function Toast() {
  const { toasts, removeToast } = useStore()

  useEffect(() => {
    if (toasts.length === 0) return
    const latest = toasts[toasts.length - 1]
    const timer = setTimeout(() => removeToast(latest.id), 2200)
    return () => clearTimeout(timer)
  }, [toasts, removeToast])

  return (
    <div id="toast">
      {toasts.map(t => (
        <div key={t.id} className={`tt${t.error ? ' e' : ''}`}>{t.text}</div>
      ))}
    </div>
  )
}
