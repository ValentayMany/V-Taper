import { useState, useCallback, useRef, createContext, useContext, useEffect } from 'react'
import { load, save } from '../services/db'
import { seed } from '../services/seedData'

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)

  const toasts = useRef([])
  const [, forceToast] = useState(0)

  // Load data from localStorage (or seed if empty)
  useEffect(() => {
    let s = load()
    if (!s || !s.plan) {
      s = seed()
      save(s)
    }
    setStore(s)
    setLoading(false)
  }, [])

  // Update local state + persist to localStorage
  const update = useCallback((fn, quiet) => {
    setStore(prev => {
      if (!prev) return prev
      const next = JSON.parse(JSON.stringify(prev))
      fn(next)
      save(next) // local instant save
      if (!quiet) {
        toasts.current = [...toasts.current, { id: Date.now(), text: 'บันทึกแล้ว ✓', error: false }]
        forceToast(x => x + 1)
      }
      return next
    })
  }, [])

  const toast = useCallback((text, error = false) => {
    toasts.current = [...toasts.current, { id: Date.now(), text, error }]
    forceToast(x => x + 1)
  }, [])

  const removeToast = useCallback((id) => {
    toasts.current = toasts.current.filter(t => t.id !== id)
    forceToast(x => x + 1)
  }, [])

  const reset = useCallback(() => {
    const s = seed()
    save(s)
    setStore(s)
  }, [])

  const importData = useCallback((data) => {
    save(data)
    setStore(data)
  }, [])

  const reload = useCallback(() => {
    const s = load()
    if (s) setStore(s)
  }, [])

  return (
    <StoreCtx.Provider value={{
      S: store, loading, update, persist: update, toast,
      toasts: toasts.current, removeToast, reset, importData,
      reload,
    }}>
      {children}
    </StoreCtx.Provider>
  )
}

export function useStore() {
  return useContext(StoreCtx)
}
