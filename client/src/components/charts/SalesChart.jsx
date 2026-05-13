import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function SalesChart({ data = [] }) {
  const formatted = Array.isArray(data) ? data.map(d => ({
    sport: d._id,
    count: d.count,
  })) : [];

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-[#666666] mb-4">Sports Popularity</h3>
      {formatted.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={formatted} layout="vertical">
            <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#EAEAEA' }} />
            <YAxis dataKey="sport" type="category" tick={{ fill: '#666', fontSize: 12 }} axisLine={{ stroke: '#EAEAEA' }} width={80} />
            <Tooltip contentStyle={{ background: '#fff', border: '1px solid #EAEAEA', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="count" fill="#111111" radius={[0, 4, 4, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[280px] text-sm text-[#888]">
          No sports data yet
        </div>
      )}
    </div>
  );
}
