import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function SalesChart({ data = [] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-medium text-[#666666] mb-4">Sport Popularity</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" tick={{ fill: '#52525B', fontSize: 12 }} axisLine={{ stroke: '#1E1E24' }} />
          <YAxis dataKey="_id" type="category" tick={{ fill: '#A1A1AA', fontSize: 12 }} axisLine={{ stroke: '#1E1E24' }} width={80} />
          <Tooltip contentStyle={{ background: '#111114', border: '1px solid #1E1E24', borderRadius: 8, color: '#FAFAFA' }} />
          <Bar dataKey="count" fill="#EF4444" radius={[0, 4, 4, 0]} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
