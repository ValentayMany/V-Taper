import { useState, useCallback, useRef, createContext, useContext, useEffect } from 'react'
import { load, save } from '../services/db'
import { seed } from '../services/seedData'
import { loadFromSupabase, seedToSupabase, syncStoreToSupabase } from '../services/supabaseSync'

const StoreCtx = createContext(null)

export function StoreProvider({ children }) {
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)

  const toasts = useRef([])
  const [, forceToast] = useState(0)
  const syncTimeoutRef = useRef(null)

  // Load data: try Supabase first, fallback to localStorage
  useEffect(() => {
    ;(async () => {
      try {
        let s = await loadFromSupabase()
        if (!s) {
          // If Supabase is empty, seed initial data to Supabase
          s = await seedToSupabase()
        }
        if (s) {
          save(s)
          setStore(s)
        }
      } catch (err) {
        console.warn('Supabase load error, falling back to localStorage:', err)
        let s = load()
        if (!s || !s.plan) { s = seed(); save(s) }
        setStore(s)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Auto-sync to Supabase in the background
  const triggerSupabaseSync = useCallback((nextState) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current)
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await syncStoreToSupabase(nextState)
        save(nextState)
      } catch (e) {
        console.error('Auto sync to Supabase error:', e)
      }
    }, 600)
  }, [])

  // Update local state + persist to localStorage + auto-sync to Supabase
  const update = useCallback((fn, quiet) => {
    setStore(prev => {
      if (!prev) return prev
      const next = JSON.parse(JSON.stringify(prev))
      fn(next)
      save(next) // local instant save
      triggerSupabaseSync(next) // cloud sync
      if (!quiet) {
        toasts.current = [...toasts.current, { id: Date.now(), text: 'บันทึกแล้ว ✓', error: false }]
        forceToast(x => x + 1)
      }
      return next
    })
  }, [triggerSupabaseSync])

  const toast = useCallback((text, error = false) => {
    toasts.current = [...toasts.current, { id: Date.now(), text, error }]
    forceToast(x => x + 1)
  }, [])

  const removeToast = useCallback((id) => {
    toasts.current = toasts.current.filter(t => t.id !== id)
    forceToast(x => x + 1)
  }, [])

  const reset = useCallback(async () => {
    const s = seed()
    save(s)
    setStore(s)
    try { await syncStoreToSupabase(s) } catch {}
  }, [])

  const importData = useCallback(async (data) => {
    save(data)
    setStore(data)
    try { await syncStoreToSupabase(data) } catch {}
  }, [])

  const reload = useCallback(async () => {
    try {
      const s = await loadFromSupabase()
      if (s) { save(s); setStore(s) }
    } catch (err) {
      console.error('Reload error:', err)
    }
  }, [])

  const syncNow = useCallback(async () => {
    if (!store) return
    try {
      await syncStoreToSupabase(store)
      save(store)
      toast('ซิงค์ข้อมูลขึ้น Supabase สำเร็จ ✓')
    } catch (err) {
      console.error('Manual sync error:', err)
      toast(`การซิงค์ผิดพลาด: ${err.message || 'โปรดตรวจสอบสิทธิ์ RLS'}`, true)
    }
  }, [store, toast])

  return (
    <StoreCtx.Provider value={{
      S: store, loading, update, persist: update, toast,
      toasts: toasts.current, removeToast, reset, importData,
      reload, syncNow,
    }}>
      {children}
    </StoreCtx.Provider>
  )
}

export function useStore() {
  return useContext(StoreCtx)
}
