import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MembershipChart({ data = [] }) {
  const formatted = data.map(d => ({ name: `${d._id?.month}/${d._id?.year}`, count: d.count }));
  return (
    <div className="card">
      <h3 className="text-sm font-medium text-[#666666] mb-4">Membership Growth</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" />
          <XAxis dataKey="name" tick={{ fill: '#52525B', fontSize: 12 }} axisLine={{ stroke: '#1E1E24' }} />
          <YAxis tick={{ fill: '#52525B', fontSize: 12 }} axisLine={{ stroke: '#1E1E24' }} />
          <Tooltip contentStyle={{ background: '#111114', border: '1px solid #1E1E24', borderRadius: 8, color: '#FAFAFA' }} />
          <Bar dataKey="count" fill="#DC2626" radius={[4, 4, 0, 0]} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
