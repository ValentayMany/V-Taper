import { supabase } from './supabase'
import { today, uid } from './db'
import { seed } from './seedData'

const DN = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

// ── Load all user data from Supabase → build S object ──
export async function loadFromSupabase() {
  const { data: exercises, error: errEx } = await supabase.from('exercises').select('*')
  if (errEx) throw errEx

  const { data: planDays } = await supabase.from('plan_days').select('*').order('day_of_week')
  const { data: plannedExercises } = await supabase.from('planned_exercises').select('*').order('position')
  const { data: sessions } = await supabase.from('workout_sessions').select('*')
  const { data: sessionExercises } = await supabase.from('session_exercises').select('*').order('position')
  const { data: sets } = await supabase.from('workout_sets').select('*').order('set_no')
  const { data: measurements } = await supabase.from('body_measurements').select('*')

  // If no plan_days exist, user is new → return null so caller can seed
  if (!planDays || planDays.length === 0) return null

  return {
    v: 1,
    exercises: (exercises || []).map(e => ({
      id: e.id, name: e.name, muscle: e.muscle, equip: e.equipment,
      sets: e.default_sets, reps: e.default_reps, rest: e.default_rest,
    })),
    settings: { start: today() },
    sessions: (sessions || []).map(s => {
      const sexs = (sessionExercises || []).filter(se => se.session_id === s.id).sort((a, b) => a.position - b.position)
      return {
        id: s.id, date: s.session_date, dayName: s.day_name,
        status: s.status, note: s.note || '', startedAt: null,
        exercises: sexs.map(se => ({
          dbId: se.id, exId: null, name: se.name, muscle: se.muscle,
          targetSets: se.target_sets, targetReps: se.target_reps,
          rest: se.rest, done: se.done, note: se.note || '',
          sets: (sets || []).filter(st => st.session_exercise_id === se.id).sort((a, b) => a.set_no - b.set_no).map(st => ({
            dbId: st.id, reps: st.reps ?? '', kg: st.weight_kg ?? '', rest: st.rest_sec ?? '', rpe: st.rpe ?? '',
          })),
        })),
      }
    }),
    measures: (measurements || []).map(m => ({
      id: m.id, date: m.measured_on, weight: m.weight_kg,
      height: m.height_cm, waist: m.waist_cm, pushups: m.pushups, note: m.note || '',
    })),
    plan: {
      days: Array.from({ length: 7 }, (_, i) => {
        const pd = (planDays || []).find(p => p.day_of_week === i)
        if (!pd) return { name: DN[i], rest: true, items: [] }
        const items = (plannedExercises || []).filter(pe => pe.plan_day_id === pd.id).sort((a, b) => a.position - b.position)
        return {
          dbId: pd.id, name: pd.name, rest: pd.is_rest,
          items: items.map(pe => ({
            dbId: pe.id, id: pe.id, exId: pe.exercise_id, sets: pe.sets, reps: pe.reps, rest: pe.rest,
          })),
        }
      }),
    },
  }
}

// ── Seed default data to Supabase for new user ──
export async function seedToSupabase() {
  const s = seed()

  // Insert exercises
  const exRows = s.exercises.map(e => ({
    name: e.name, muscle: e.muscle, equipment: e.equip,
    default_sets: e.sets, default_reps: e.reps, default_rest: e.rest,
  }))
  const { data: insertedExercises, error: errEx } = await supabase.from('exercises').insert(exRows).select()
  if (errEx) throw errEx

  // Map old seed IDs to new Supabase IDs
  const exMap = {}
  s.exercises.forEach((old, i) => { exMap[old.id] = insertedExercises[i].id })

  // Insert plan_days + planned_exercises
  for (let i = 0; i < 7; i++) {
    const day = s.plan.days[i]
    const { data: pd, error: errPd } = await supabase.from('plan_days').insert({
      day_of_week: i, name: day.name, is_rest: day.rest,
    }).select().single()
    if (errPd) throw errPd

    if (!day.rest && day.items.length > 0) {
      const peRows = day.items.map((item, pos) => ({
        plan_day_id: pd.id, exercise_id: exMap[item.exId],
        position: pos, sets: item.sets, reps: item.reps, rest: item.rest,
      }))
      const { error: errPe } = await supabase.from('planned_exercises').insert(peRows)
      if (errPe) throw errPe
    }
  }

  // Reload fresh
  return await loadFromSupabase()
}

// ── Synchronize full in-memory store state to Supabase ──
export async function syncStoreToSupabase(s) {
  if (!s) return

  // 1. Sync body_measurements
  if (s.measures && s.measures.length > 0) {
    for (const m of s.measures) {
      // Upsert measurement if valid uuid, else insert
      const isUUID = typeof m.id === 'string' && m.id.length === 36
      const payload = {
        measured_on: m.date,
        weight_kg: m.weight ? Number(m.weight) : null,
        height_cm: m.height ? Number(m.height) : null,
        waist_cm: m.waist ? Number(m.waist) : null,
        pushups: m.pushups ? Number(m.pushups) : null,
        note: m.note || ''
      }
      if (isUUID) {
        payload.id = m.id
        await supabase.from('body_measurements').upsert(payload)
      } else {
        const { data } = await supabase.from('body_measurements').insert(payload).select().single()
        if (data) m.id = data.id
      }
    }
  }

  // 2. Sync exercises
  if (s.exercises && s.exercises.length > 0) {
    for (const e of s.exercises) {
      const isUUID = typeof e.id === 'string' && e.id.length === 36
      const payload = {
        name: e.name,
        muscle: e.muscle,
        equipment: e.equip,
        default_sets: e.sets,
        default_reps: e.reps,
        default_rest: e.rest
      }
      if (isUUID) {
        payload.id = e.id
        await supabase.from('exercises').upsert(payload)
      } else {
        const { data } = await supabase.from('exercises').insert(payload).select().single()
        if (data) e.id = data.id
      }
    }
  }

  // 3. Sync plan days & planned exercises
  if (s.plan && s.plan.days) {
    for (let i = 0; i < s.plan.days.length; i++) {
      const day = s.plan.days[i]
      let planDayId = day.dbId
      if (planDayId) {
        await supabase.from('plan_days').update({
          name: day.name,
          is_rest: day.rest
        }).eq('id', planDayId)
      } else {
        const { data } = await supabase.from('plan_days').insert({
          day_of_week: i,
          name: day.name,
          is_rest: day.rest
        }).select().single()
        if (data) {
          day.dbId = data.id
          planDayId = data.id
        }
      }

      if (planDayId && day.items) {
        // Clear and rewrite planned_exercises for simplicity & position order
        await supabase.from('planned_exercises').delete().eq('plan_day_id', planDayId)
        if (!day.rest && day.items.length > 0) {
          const rows = day.items.map((item, idx) => ({
            plan_day_id: planDayId,
            exercise_id: (typeof item.exId === 'string' && item.exId.length === 36) ? item.exId : null,
            position: idx,
            sets: Number(item.sets) || 3,
            reps: Number(item.reps) || 10,
            rest: Number(item.rest) || 60
          }))
          const { data: insertedItems } = await supabase.from('planned_exercises').insert(rows).select()
          if (insertedItems) {
            insertedItems.forEach((row, k) => {
              if (day.items[k]) day.items[k].dbId = row.id
            })
          }
        }
      }
    }
  }

  // 4. Sync workout_sessions, session_exercises, and sets
  if (s.sessions && s.sessions.length > 0) {
    for (const sess of s.sessions) {
      const isUUID = typeof sess.id === 'string' && sess.id.length === 36
      let sessId = isUUID ? sess.id : null

      const sessPayload = {
        session_date: sess.date,
        day_name: sess.dayName || 'Workout',
        status: sess.status || 'in_progress',
        note: sess.note || ''
      }

      if (sessId) {
        sessPayload.id = sessId
        await supabase.from('workout_sessions').upsert(sessPayload)
      } else {
        const { data } = await supabase.from('workout_sessions').insert(sessPayload).select().single()
        if (data) {
          sess.id = data.id
          sessId = data.id
        }
      }

      if (sessId && sess.exercises) {
        for (let pos = 0; pos < sess.exercises.length; pos++) {
          const ex = sess.exercises[pos]
          let seId = ex.dbId
          const sePayload = {
            session_id: sessId,
            name: ex.name,
            muscle: ex.muscle,
            target_sets: ex.targetSets || 3,
            target_reps: ex.targetReps || 10,
            rest: ex.rest || 60,
            position: pos,
            done: !!ex.done,
            note: ex.note || ''
          }

          if (seId) {
            sePayload.id = seId
            await supabase.from('session_exercises').upsert(sePayload)
          } else {
            const { data } = await supabase.from('session_exercises').insert(sePayload).select().single()
            if (data) {
              ex.dbId = data.id
              seId = data.id
            }
          }

          if (seId && ex.sets) {
            // Delete old sets for this exercise and re-insert fresh
            await supabase.from('workout_sets').delete().eq('session_exercise_id', seId)
            const setRows = ex.sets.map((st, idx) => ({
              session_exercise_id: seId,
              set_no: idx + 1,
              reps: st.reps !== '' && st.reps != null ? Number(st.reps) : null,
              weight_kg: st.kg !== '' && st.kg != null ? Number(st.kg) : null,
              rest_sec: st.rest !== '' && st.rest != null ? Number(st.rest) : null,
              rpe: st.rpe !== '' && st.rpe != null ? Number(st.rpe) : null
            }))
            if (setRows.length > 0) {
              const { data: insertedSets } = await supabase.from('workout_sets').insert(setRows).select()
              if (insertedSets) {
                insertedSets.forEach((row, k) => {
                  if (ex.sets[k]) ex.sets[k].dbId = row.id
                })
              }
            }
          }
        }
      }
    }
  }
}
