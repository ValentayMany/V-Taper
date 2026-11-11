import { getTable, insertRow, updateRow, deleteRow, findById, findOneWhere } from './db'

export const planService = {
  // ── Plans ──────────────────────────────────────────────────
  getActivePlan: () =>
    findOneWhere('plans', p => p.isActive),

  // ── Plan Days ──────────────────────────────────────────────
  getPlanDays: (planId) =>
    getTable('planDays')
      .filter(pd => pd.planId === planId)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek),

  getPlanDayByDow: (planId, dayOfWeek) =>
    findOneWhere('planDays', pd => pd.planId === planId && pd.dayOfWeek === dayOfWeek),

  updatePlanDay: (id, updates) => updateRow('planDays', id, updates),

  // ── Plan Day Exercises ─────────────────────────────────────
  getPlanDayExercises: (planDayId) => {
    const pdes = getTable('planDayExercises')
      .filter(pde => pde.planDayId === planDayId)
      .sort((a, b) => a.order - b.order)
    return pdes.map(pde => ({
      ...pde,
      exercise: findById('exercises', pde.exerciseId),
    }))
  },

  addExerciseToPlanDay: (planDayId, data) => {
    const existing = getTable('planDayExercises').filter(e => e.planDayId === planDayId)
    const maxOrder = existing.reduce((max, e) => Math.max(max, e.order), 0)
    return insertRow('planDayExercises', { ...data, planDayId, order: maxOrder + 1 })
  },

  updatePlanDayExercise: (id, updates) => updateRow('planDayExercises', id, updates),

  removePlanDayExercise: (id) => deleteRow('planDayExercises', id),

  reorderPlanDayExercises: (planDayId, orderedIds) => {
    orderedIds.forEach((id, idx) => updateRow('planDayExercises', id, { order: idx + 1 }))
  },
}
