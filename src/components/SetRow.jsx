/**
 * SetRow – single workout set input row
 *
 * Props:
 *   index    – 0-based index (displays as 1-based)
 *   set      – { reps, weight, rpe }
 *   onChange – (updatedSet) => void
 *   onDelete – () => void
 *   showWeight – boolean (default true)
 */
export default function SetRow({ index, set, onChange, onDelete, showWeight = true }) {
  const handleChange = (field, value) => {
    onChange({ ...set, [field]: value === '' ? '' : Number(value) })
  }

  return (
    <div className="set-row">
      <div className="set-number">{index + 1}</div>

      {showWeight && (
        <div className="set-col">
          <span className="set-row-label">kg</span>
          <input
            type="number"
            className="form-input"
            value={set.weight ?? ''}
            onChange={e => handleChange('weight', e.target.value)}
            min={0}
            step={0.5}
            placeholder="0"
          />
        </div>
      )}

      <div className="set-col">
        <span className="set-row-label">reps</span>
        <input
          type="number"
          className="form-input"
          value={set.reps ?? ''}
          onChange={e => handleChange('reps', e.target.value)}
          min={0}
          placeholder="0"
        />
      </div>

      <div className="set-col">
        <span className="set-row-label">RPE</span>
        <input
          type="number"
          className="form-input"
          value={set.rpe ?? ''}
          onChange={e => handleChange('rpe', e.target.value)}
          min={1}
          max={10}
          step={0.5}
          placeholder="–"
        />
      </div>

      <button
        className="btn btn-ghost btn-icon btn-sm"
        onClick={onDelete}
        aria-label="Delete set"
        title="Delete set"
        style={{ color: 'var(--danger)', alignSelf: 'center', marginTop: '14px' }}
      >
        ✕
      </button>
    </div>
  )
}
