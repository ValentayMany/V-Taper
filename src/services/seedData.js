import { uid, today } from './db'

export function seed() {
  const L = [
    ['Push-up Board (Green Position)', 'Chest', 'Push-up Board', 3, 10, 90],
    ['Dumbbell Floor Press', 'Chest', 'Dumbbell', 3, 12, 90],
    ['One-arm Dumbbell Row', 'Back', 'Dumbbell', 3, 12, 75],
    ['Dumbbell Shoulder Press', 'Shoulders', 'Dumbbell', 3, 10, 90],
    ['Biceps Curl', 'Biceps', 'Dumbbell', 3, 12, 60],
    ['Overhead Triceps Extension', 'Triceps', 'Dumbbell', 3, 12, 60],
    ['Goblet Squat', 'Legs', 'Dumbbell', 3, 12, 90],
    ['Dumbbell Romanian Deadlift', 'Legs', 'Dumbbell', 3, 12, 90],
    ['Reverse Lunge', 'Legs', 'Dumbbell', 3, 10, 75],
    ['Calf Raise', 'Calves', 'Dumbbell', 3, 15, 45],
    ['Plank', 'Core', 'Bodyweight', 3, 40, 45],
    ['Bent-over Dumbbell Row', 'Back', 'Dumbbell', 3, 12, 75],
    ['Dumbbell Pullover', 'Chest', 'Dumbbell', 3, 12, 75],
    ['Prone Y-T Raise', 'Shoulders', 'Bodyweight', 3, 10, 60],
    ['Hammer Curl', 'Biceps', 'Dumbbell', 3, 12, 60],
    ['Close-grip Push-up', 'Triceps', 'Push-up Board', 3, 10, 75],
    ['Bodyweight Squat', 'Legs', 'Bodyweight', 3, 15, 60],
    ['Dumbbell Glute Bridge', 'Glutes', 'Dumbbell', 3, 15, 60],
    ['Reverse Crunch', 'Core', 'Bodyweight', 3, 15, 45],
  ]

  const ex = L.map(e => ({
    id: uid(), name: e[0], muscle: e[1], equip: e[2],
    sets: e[3], reps: e[4], rest: e[5],
  }))

  const it = (n) => {
    const e = ex.find(x => x.name === n)
    return { id: uid(), exId: e.id, sets: e.sets, reps: e.reps, rest: e.rest }
  }

  const D = (name, list) => ({
    name, rest: !list,
    items: (list || []).map(it),
  })

  return {
    v: 1,
    exercises: ex,
    settings: { start: today() },
    sessions: [],
    measures: [],
    plan: {
      days: [
        D('Upper A', ['Push-up Board (Green Position)', 'Dumbbell Floor Press', 'One-arm Dumbbell Row', 'Dumbbell Shoulder Press', 'Biceps Curl', 'Overhead Triceps Extension']),
        D('Lower A', ['Goblet Squat', 'Dumbbell Romanian Deadlift', 'Reverse Lunge', 'Calf Raise', 'Plank']),
        D('Rest Day'),
        D('Upper B', ['Push-up Board (Green Position)', 'Bent-over Dumbbell Row', 'Dumbbell Pullover', 'Prone Y-T Raise', 'Hammer Curl', 'Close-grip Push-up']),
        D('Rest Day'),
        D('Lower B', ['Bodyweight Squat', 'Dumbbell Glute Bridge', 'Dumbbell Romanian Deadlift', 'Reverse Lunge', 'Calf Raise', 'Reverse Crunch']),
        D('Rest Day'),
      ],
    },
  }
}
