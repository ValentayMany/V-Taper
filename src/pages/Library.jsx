import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { uid } from '../services/db'

const MU = ['Chest', 'Shoulders', 'Back', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Calves', 'Core']
const EQ = ['Dumbbell', 'Push-up Board', 'Bodyweight']

export default function Library() {
  const { S, update, toast } = useStore()
  const [query, setQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', muscle: 'Chest', equip: 'Dumbbell', sets: 3, reps: 10, rest: 60 })

  const q = query.toLowerCase()
  const filtered = S.exercises.filter(e =>
    e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q)
  )

  const openEdit = (e) => {
    setEditId(e.id)
    setForm({ name: e.name, muscle: e.muscle, equip: e.equip, sets: e.sets, reps: e.reps, rest: e.rest })
    setShowModal(true)
  }

  const openAdd = () => {
    setEditId(null)
    setForm({ name: '', muscle: 'Chest', equip: 'Dumbbell', sets: 3, reps: 10, rest: 60 })
    setShowModal(true)
  }

  const handleSave = (e) => {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) { toast('กรุณาใส่ชื่อท่า', true); return }
    if (!(+form.sets >= 1 && +form.sets <= 20 && +form.reps >= 1 && +form.reps <= 300 && +form.rest >= 0 && +form.rest <= 900)) {
      toast('ตรวจสอบ sets(1-20) reps(1-300) rest(0-900)', true); return
    }
    if (S.exercises.some(x => x.id !== editId && x.name.toLowerCase() === name.toLowerCase())) {
      toast('มีท่านี้อยู่แล้ว', true); return
    }
    const n = { id: editId || uid(), name, muscle: form.muscle, equip: form.equip, sets: +form.sets, reps: +form.reps, rest: +form.rest }
    update(s => {
      if (editId) {
        const idx = s.exercises.findIndex(x => x.id === editId)
        s.exercises[idx] = n
      } else {
        s.exercises.push(n)
      }
    })
    setShowModal(false)
  }

  const handleDelete = (id) => {
    if (!confirm('ลบท่านี้ออกจากคลัง? (จะถูกเอาออกจากตารางฝึก แต่ประวัติเดิมไม่เปลี่ยน)')) return
    update(s => {
      s.exercises = s.exercises.filter(e => e.id !== id)
      s.plan.days.forEach(d => { d.items = d.items.filter(i => i.exId !== id) })
    })
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1>📚 Exercise Library</h1>
        <p className="mut" style={{ margin: 0, fontSize: 14 }}>
          คลังท่าฝึกทั้งหมด ({S.exercises.length} ท่า) พร้อมเป้าหมายจำนวนเซ็ตและเวลาพัก
        </p>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="sp" style={{ flexWrap: 'wrap', gap: 10 }}>
          <input
            placeholder="🔍 ค้นหาชื่อท่า หรือกลุ่มกล้ามเนื้อ..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <button className="b p" onClick={openAdd}>+ เพิ่มท่าใหม่</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {filtered.map(e => (
          <div key={e.id} className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="sp" style={{ marginBottom: 8 }}>
                <b style={{ fontSize: 16 }}>{e.name}</b>
                <span className="bd" style={{ background: 'var(--c2)', fontSize: 11 }}>{e.muscle}</span>
              </div>
              <div className="mut" style={{ fontSize: 13, marginBottom: 12 }}>
                <div>อุปกรณ์: <b>{e.equip}</b></div>
                <div>เป้าหมาย: <b>{e.sets}</b> เซ็ต × <b>{e.reps}</b> ครั้ง (พัก {e.rest}s)</div>
              </div>
            </div>
            <div className="row" style={{ marginTop: 8, borderTop: '1px solid var(--ln)', paddingTop: 10, justifyContent: 'flex-end' }}>
              <button className="b s" onClick={() => openEdit(e)}>✏️ แก้ไข</button>
              <button className="b s d" onClick={() => handleDelete(e.id)}>🗑 ลบ</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="ov" onClick={() => setShowModal(false)}>
          <form className="md" onClick={e => e.stopPropagation()} onSubmit={handleSave}>
            <div className="sp" style={{ marginBottom: 14, borderBottom: '1px solid var(--ln)', paddingBottom: 10 }}>
              <h3 style={{ margin: 0 }}>{editId ? '✏️ แก้ไขท่าฝึก' : '➕ เพิ่มท่าฝึกใหม่'}</h3>
              <button type="button" className="b s" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <label>ชื่อท่าออกกำลังกาย</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%' }}
              required
              maxLength="60"
              placeholder="เช่น Incline Dumbbell Press"
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
              <div>
                <label>กลุ่มกล้ามเนื้อ</label>
                <select value={form.muscle} onChange={e => setForm({ ...form, muscle: e.target.value })} style={{ width: '100%' }}>
                  {MU.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label>อุปกรณ์</label>
                <select value={form.equip} onChange={e => setForm({ ...form, equip: e.target.value })} style={{ width: '100%' }}>
                  {EQ.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 6 }}>
              <div>
                <label>เซ็ต</label>
                <input type="number" value={form.sets} onChange={e => setForm({ ...form, sets: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div>
                <label>เป้า reps</label>
                <input type="number" value={form.reps} onChange={e => setForm({ ...form, reps: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div>
                <label>พัก (วินาที)</label>
                <input type="number" value={form.rest} onChange={e => setForm({ ...form, rest: e.target.value })} style={{ width: '100%' }} />
              </div>
            </div>

            <div className="row" style={{ marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="b" type="button" onClick={() => setShowModal(false)}>ยกเลิก</button>
              <button className="b p" type="submit">💾 บันทึกท่าฝึก</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
