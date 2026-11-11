import { getTable, insertRow, updateRow, deleteRow } from './db'

export const measurementsService = {
  getAll: () =>
    getTable('measurements').sort((a, b) => b.date.localeCompare(a.date)),

  getLatest: () => {
    const all = getTable('measurements').sort((a, b) => b.date.localeCompare(a.date))
    return all[0] || null
  },

  getByDateRange: (start, end) =>
    getTable('measurements')
      .filter(m => m.date >= start && m.date <= end)
      .sort((a, b) => a.date.localeCompare(b.date)),

  create: (data) =>
    insertRow('measurements', {
      weight:    null,
      height:    null,
      waist:     null,
      pushupMax: null,
      notes:     '',
      ...data,
      date: data.date || new Date().toISOString().slice(0, 10),
    }),

  update: (id, updates) => updateRow('measurements', id, updates),

  delete: (id) => deleteRow('measurements', id),
}
