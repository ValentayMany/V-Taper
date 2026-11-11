// Single-object localStorage layer matching reference data model
const KEY = 'vtaper.v1'

export const uid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const iso = (d) => {
  const dd = new Date(d.getTime() - d.getTimezoneOffset() * 6e4)
  return dd.toISOString().slice(0, 10)
}

export const P = (s) => new Date(s + 'T00:00:00')
export const today = () => iso(new Date())
export const dow = (s) => (P(s).getDay() + 6) % 7 // 0=Mon
export const add = (s, n) => {
  const d = P(s)
  d.setDate(d.getDate() + n)
  return iso(d)
}
export const wk = (s) => add(s, -dow(s))

export function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

export function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true }
  catch { return false }
}

export function clearAll() {
  localStorage.removeItem(KEY)
}
