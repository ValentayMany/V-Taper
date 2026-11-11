import { getTable, insertRow, updateRow, deleteRow, findById, findOneWhere } from './db'

export const sessionsService = {
  // ── Sessions ───────────────────────────────────────────────
  getAll: () =>
    getTable('sessions').sort((a, b) => b.date.localeCompare(a.date)),

  getByDate: (date) =>
    findOneWhere('sessions', s => s.date === date),

  getByDateRange: (start, end) =>
    getTable('sessions')
      .filter(s => s.date >= start && s.date <= end)
      .sort((a, b) => b.date.localeCompare(a.date)),

  create: ({ date, planDayId = null, planDayName = 'Custom', notes = '' }) =>
    insertRow('sessions', {
      date,
      planDayId,
      planDayName,
      status: 'in_progress',   // 'in_progress' | 'completed' | 'partial'
      notes,
      startedAt: new Date().toISOString(),
      completedAt: null,
    }),

  update: (id, updates) => updateRow('sessions', id, updates),

  complete: (id) =>
    updateRow('sessions', id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    }),

  markPartial: (id) =>
    updateRow('sessions', id, {
      status: 'partial',
      completedAt: new Date().toISOString(),
    }),

  delete: (id) => {
    // Cascade delete logs and sets
    const logs = getTable('exerciseLogs').filter(l => l.sessionId === id)
    logs.forEach(log => {
      getTable('workoutSets')
        .filter(s => s.exerciseLogId === log.id)
        .forEach(set => deleteRow('workoutSets', set.id))
      deleteRow('exerciseLogs', log.id)
    })
    deleteRow('sessions', id)
  },

  // ── Exercise Logs ──────────────────────────────────────────
  getExerciseLogs: (sessionId) =>
    getTable('exerciseLogs')
      .filter(l => l.sessionId === sessionId)
      .sort((a, b) => a.order - b.order),

  createExerciseLog: (data) =>
    insertRow('exerciseLogs', {
      status: 'pending',   // 'pending' | 'in_progress' | 'completed' | 'skipped'
      notes: '',
      ...data,
    }),

  updateExerciseLog: (id, updates) => updateRow('exerciseLogs', id, updates),

  // ── Workout Sets ───────────────────────────────────────────
  getSets: (exerciseLogId) =>
    getTable('workoutSets')
      .filter(s => s.exerciseLogId === exerciseLogId)
      .sort((a, b) => a.setNumber - b.setNumber),

  createSet: (data) =>
    insertRow('workoutSets', {
      reps: 0,
      weight: 0,
      rpe: null,
      restSeconds: 60,
      completedAt: new Date().toISOString(),
      ...data,
    }),

  updateSet: (id, updates) => updateRow('workoutSets', id, updates),
  deleteSet: (id) => deleteRow('workoutSets', id),

  // ── Stats ──────────────────────────────────────────────────
  /**
   * Get stats for the week containing the given date.
   * @param {string} weekMonDate - 'YYYY-MM-DD' of Monday
   * @param {string[]} plannedDates - dates that have workouts planned (non-rest)
   */
  getWeekStats: (weekMonDate, plannedDates = []) => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekMonDate)
      d.setDate(d.getDate() + i)
      return d.toISOString().slice(0, 10)
    })
    const sessions = getTable('sessions').filter(s => days.includes(s.date))
    const completed = sessions.filter(s => s.status === 'completed').length
    const partial   = sessions.filter(s => s.status === 'partial').length
    const trained   = sessions.length

    // A planned day is "skipped" if it has no session and the date has passed
    const today = new Date().toISOString().slice(0, 10)
    const skipped = plannedDates.filter(d => d < today && !sessions.find(s => s.date === d)).length

    return { trained, completed, partial, skipped, days, sessions }
  },

  /**
   * Returns day status for each date: 'completed' | 'partial' | 'rest' | 'skipped' | 'planned' | null
   */
  getDayStatuses: (dates, planDaysByDate = {}) => {
    const sessions = getTable('sessions')
    const today = new Date().toISOString().slice(0, 10)
    const result = {}
    dates.forEach(date => {
      const session = sessions.find(s => s.date === date)
      const planDay = planDaysByDate[date]
      if (session) {
        result[date] = session.status
      } else if (planDay?.isRest) {
        result[date] = 'rest'
      } else if (planDay && date < today) {
        result[date] = 'skipped'
      } else if (planDay && date >= today) {
        result[date] = 'planned'
      } else {
        result[date] = null
      }
    })
    return result
  },
}
