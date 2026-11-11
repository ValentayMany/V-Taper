import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const METRICS = [
  { key: 'weight',   color: '#6366f1' },
  { key: 'shoulders', color: '#10b981' },
  { key: 'waist',    color: '#f59e0b' },
  { key: 'hips',     color: '#ef4444' },
]

export default function MeasurementChart({ data = [], metrics = ['weight', 'waist'] }) {
  const active = METRICS.filter(m => metrics.includes(m.key))
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {active.map(m => (
          <Line key={m.key} type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
