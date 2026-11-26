import { uid, today } from './db'

const BASE_EXERCISES = [
  { name: 'Push-up Board (Green Position)', muscle: 'Chest', equip: 'Push-up Board', sets: 3, reps: 15, repRange: '8–15', rest: 90 },
  { name: 'Dumbbell Floor Press', muscle: 'Chest', equip: 'Dumbbell', sets: 2, reps: 15, repRange: '10–15', rest: 90 },
  { name: 'Incline Dumbbell Press', muscle: 'Chest', equip: 'Dumbbell', sets: 3, reps: 12, repRange: '10–12', rest: 90 },
  { name: 'Dumbbell Lateral Raise', muscle: 'Shoulders', equip: 'Dumbbell', sets: 3, reps: 20, repRange: '12–20', rest: 60 },
  { name: 'Dumbbell Reverse Fly', muscle: 'Shoulders', equip: 'Dumbbell', sets: 2, reps: 15, repRange: '12–15', rest: 60 },
  { name: 'One-arm Dumbbell Row', muscle: 'Back', equip: 'Dumbbell', sets: 3, reps: 20, repRange: '12–20/side', rest: 75, perSide: true },
  { name: 'Dumbbell Shoulder Press', muscle: 'Shoulders', equip: 'Dumbbell', sets: 3, reps: 10, repRange: '8–12', rest: 90 },
  { name: 'Biceps Curl', muscle: 'Biceps', equip: 'Dumbbell', sets: 2, reps: 15, repRange: '10–15', rest: 60 },
  { name: 'Overhead Triceps Extension', muscle: 'Triceps', equip: 'Dumbbell', sets: 2, reps: 15, repRange: '10–15', rest: 60 },
  { name: 'Goblet Squat', muscle: 'Legs', equip: 'Dumbbell', sets: 3, reps: 15, repRange: '12–15', rest: 90 },
  { name: 'Dumbbell Romanian Deadlift', muscle: 'Legs', equip: 'Dumbbell', sets: 3, reps: 15, repRange: '12–15', rest: 90 },
  { name: 'Reverse Lunge', muscle: 'Legs', equip: 'Dumbbell', sets: 2, reps: 12, repRange: '10–12/side', rest: 75, perSide: true },
  { name: 'Calf Raise', muscle: 'Calves', equip: 'Dumbbell', sets: 3, reps: 20, repRange: '15–20', rest: 45 },
  { name: 'Plank', muscle: 'Core', equip: 'Bodyweight', sets: 3, reps: 45, repRange: '30–45 sec', rest: 45, timed: true },
  { name: 'Side Plank', muscle: 'Core', equip: 'Bodyweight', sets: 2, reps: 40, repRange: '20–40 sec/side', rest: 45, timed: true, perSide: true },
  { name: 'Bent-over Dumbbell Row', muscle: 'Back', equip: 'Dumbbell', sets: 3, reps: 15, repRange: '12–15', rest: 90 },
  { name: 'Dumbbell Pullover', muscle: 'Chest', equip: 'Dumbbell', sets: 2, reps: 15, repRange: '12–15', rest: 75 },
  { name: 'Prone Y-T Raise', muscle: 'Shoulders', equip: 'Bodyweight', sets: 3, reps: 10, repRange: '10–12', rest: 60 },
  { name: 'Hammer Curl', muscle: 'Biceps', equip: 'Dumbbell', sets: 2, reps: 15, repRange: '10–15', rest: 60 },
  { name: 'Close-grip Push-up', muscle: 'Triceps', equip: 'Push-up Board', sets: 2, reps: 12, repRange: '6–12', rest: 75 },
  { name: 'Bodyweight Squat', muscle: 'Legs', equip: 'Bodyweight', sets: 3, reps: 15, repRange: '12–15', rest: 60 },
  { name: 'Glute Bridge', muscle: 'Glutes', equip: 'Dumbbell', sets: 2, reps: 20, repRange: '15–20', rest: 60 },
  { name: 'Reverse Crunch', muscle: 'Core', equip: 'Bodyweight', sets: 3, reps: 15, repRange: '12–15', rest: 45 },
]

export const NEW_WEEKLY_PROGRAM = [
  {
    name: 'Upper A (อก, หลัง, ไหล่, แขน)',
    rest: false,
    items: [
      { name: 'Push-up Board (Green Position)', sets: 3, reps: 15, repRange: '8–15', rest: 90 },
      { name: 'Dumbbell Floor Press', sets: 2, reps: 15, repRange: '10–15', rest: 90 },
      { name: 'One-arm Dumbbell Row', sets: 3, reps: 20, repRange: '12–20/side', rest: 75, perSide: true },
      { name: 'Dumbbell Lateral Raise', sets: 3, reps: 20, repRange: '12–20', rest: 60 },
      { name: 'Biceps Curl', sets: 2, reps: 15, repRange: '10–15', rest: 60 },
      { name: 'Overhead Triceps Extension', sets: 2, reps: 15, repRange: '10–15', rest: 60 },
    ],
  },
  {
    name: 'Lower A (ขา, สะโพก, น่อง, ท้อง)',
    rest: false,
    items: [
      { name: 'Goblet Squat', sets: 3, reps: 15, repRange: '12–15', rest: 90 },
      { name: 'Dumbbell Romanian Deadlift', sets: 3, reps: 15, repRange: '12–15', rest: 90 },
      { name: 'Reverse Lunge', sets: 2, reps: 12, repRange: '10–12/side', rest: 75, perSide: true },
      { name: 'Calf Raise', sets: 3, reps: 20, repRange: '15–20', rest: 45 },
      { name: 'Plank', sets: 3, reps: 45, repRange: '30–45 sec', rest: 45, timed: true },
    ],
  },
  { name: 'Rest Day (วันพักฟื้นฟู)', rest: true, items: [] },
  {
    name: 'Upper B (ปีกกว้าง, อก, ไหล่ 3 มิติ, แขน)',
    rest: false,
    items: [
      { name: 'Bent-over Dumbbell Row', sets: 3, reps: 15, repRange: '12–15', rest: 90 },
      { name: 'Push-up Board (Green Position)', sets: 3, reps: 15, repRange: '8–15', rest: 90 },
      { name: 'Dumbbell Pullover', sets: 2, reps: 15, repRange: '12–15', rest: 75 },
      { name: 'Dumbbell Lateral Raise', sets: 3, reps: 20, repRange: '12–20', rest: 60 },
      { name: 'Dumbbell Reverse Fly', sets: 2, reps: 15, repRange: '12–15', rest: 60 },
      { name: 'Hammer Curl', sets: 2, reps: 15, repRange: '10–15', rest: 60 },
      { name: 'Close-grip Push-up', sets: 2, reps: 12, repRange: '6–12', rest: 75 },
    ],
  },
  { name: 'Rest Day (วันพักฟื้นฟู)', rest: true, items: [] },
  {
    name: 'Lower B (ขา, สะโพก, น่อง, ท้อง)',
    rest: false,
    items: [
      { name: 'Goblet Squat', sets: 3, reps: 15, repRange: '12–15', rest: 90 },
      { name: 'Dumbbell Romanian Deadlift', sets: 2, reps: 15, repRange: '12–15', rest: 90 },
      { name: 'Glute Bridge', sets: 2, reps: 20, repRange: '15–20', rest: 60 },
      { name: 'Calf Raise', sets: 3, reps: 20, repRange: '15–20', rest: 45 },
      { name: 'Side Plank', sets: 2, reps: 40, repRange: '20–40 sec/side', rest: 45, timed: true, perSide: true },
    ],
  },
  { name: 'Rest Day (วันพักฟื้นฟู)', rest: true, items: [] },
]

/** Ensure all exercises needed by the new program exist without removing user's custom/old exercises */
export function ensureProgramExercises(store) {
  if (!store.exercises) store.exercises = []
  BASE_EXERCISES.forEach(def => {
    const match = store.exercises.find(e =>
      e.name.toLowerCase() === def.name.toLowerCase() ||
      (def.name === 'Glute Bridge' && e.name.toLowerCase() === 'dumbbell glute bridge')
    )
    if (!match) {
      store.exercises.push({ id: uid(), ...def })
    } else {
      // Enrich existing exercise metadata safely without changing its id or user's name
      if (def.perSide && !match.perSide) match.perSide = true
      if (def.timed && !match.timed) match.timed = true
      if (def.repRange && !match.repRange) match.repRange = def.repRange
    }
  })
}

/** Apply the 4-day Lean V-Taper program to store.plan.days while preserving sessions & measures */
export function applyLeanVTaperProgram(store) {
  ensureProgramExercises(store)
  const findEx = (name) => store.exercises.find(e =>
    e.name.toLowerCase() === name.toLowerCase() ||
    (name === 'Glute Bridge' && e.name.toLowerCase() === 'dumbbell glute bridge')
  )
  if (!store.plan) store.plan = {}
  store.plan.days = NEW_WEEKLY_PROGRAM.map(day => ({
    name: day.name,
    rest: day.rest,
    items: (day.items || []).map(it => {
      const ex = findEx(it.name)
      if (!ex) return null
      return {
        id: uid(),
        exId: ex.id,
        sets: it.sets,
        reps: it.reps,
        repRange: it.repRange,
        rest: it.rest,
        ...(it.perSide ? { perSide: true } : {}),
        ...(it.timed ? { timed: true } : {}),
      }
    }).filter(Boolean),
  }))
  store.planVersion = 2
}

/** Clean up sets that were accidentally doubled (2x/4x targetSets) by earlier concurrent Supabase syncs */
export function cleanDuplicatedSets(store) {
  let changed = false
  ;(store.sessions || []).forEach(sess => {
    ;(sess.exercises || []).forEach(ex => {
      const tSets = Number(ex.targetSets) || 3
      if (Array.isArray(ex.sets) && ex.sets.length >= tSets * 2 && ex.sets.length % tSets === 0) {
        // Verify first set and repeated block share the same reps before trimming
        const firstReps = String(ex.sets[0]?.reps ?? '')
        const blockReps = String(ex.sets[tSets]?.reps ?? '')
        if (firstReps && firstReps === blockReps) {
          ex.sets = ex.sets.slice(0, tSets)
          changed = true
        }
      }
    })
  })
  return changed
}

/** Safe one-time migration that preserves all workout history, measures, and settings */
export function migrateStore(store) {
  if (!store || !store.plan) return false
  let changed = false
  ensureProgramExercises(store)

  const forceLean4 = typeof localStorage !== 'undefined' && localStorage.getItem('vtaper.forceLean4.v1') === '1'
  if (!forceLean4) {
    applyLeanVTaperProgram(store)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('vtaper.planV2', '1')
      localStorage.setItem('vtaper.forceLean4.v1', '1')
    }
    changed = true
  } else {
    store.planVersion = 2
  }

  const dupCleaned = typeof localStorage !== 'undefined' && localStorage.getItem('vtaper.cleanedDupSets.v1') === '1'
  if (!dupCleaned) {
    if (cleanDuplicatedSets(store)) changed = true
    if (typeof localStorage !== 'undefined') localStorage.setItem('vtaper.cleanedDupSets.v1', '1')
  }

  return changed
}

export function seed() {
  const store = {
    v: 1,
    planVersion: 2,
    exercises: BASE_EXERCISES.map(e => ({ id: uid(), ...e })),
    settings: { start: today() },
    sessions: [],
    measures: [],
    plan: { days: [] },
  }
  applyLeanVTaperProgram(store)
  return store
}
