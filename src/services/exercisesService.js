import { getTable, insertRow, updateRow, deleteRow, findById, findWhere } from './db'

export const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core']
export const EQUIPMENT_TYPES = ['bodyweight', 'dumbbell', 'pushup-board']

export const exercisesService = {
  getAll: () =>
    getTable('exercises').sort((a, b) => a.name.localeCompare(b.name)),

  getById: (id) => findById('exercises', id),

  getByMuscleGroup: (group) =>
    getTable('exercises').filter(e => e.muscleGroup === group),

  create: (data) =>
    insertRow('exercises', {
      name: '',
      muscleGroup: 'chest',
      equipment: 'bodyweight',
      targetSets: 3,
      targetReps: 10,
      restSeconds: 60,
      notes: '',
      ...data,
    }),

  update: (id, updates) => updateRow('exercises', id, updates),

  delete: (id) => deleteRow('exercises', id),
}
