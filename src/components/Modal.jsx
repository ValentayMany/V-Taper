import { useEffect, useCallback } from 'react'

/**
 * Generic modal with:
 * - ESC key to close
 * - Backdrop click to close
 * - Animated entry
 *
 * Props:
 *   title    – string
 *   onClose  – function
 *   size     – 'default' | 'lg'
 *   children – content
 *   footer   – optional JSX (renders in .modal-footer)
 */
export default function Modal({ title, onClose, size = 'default', children, footer }) {
  const handleKey = useCallback(e => {
    if (e.key === 'Escape') onClose?.()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleKey])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal${size === 'lg' ? ' modal-lg' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
