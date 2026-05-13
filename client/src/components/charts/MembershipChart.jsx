import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

export default function MembershipChart({ data }) {
  // data = { active, pending, expired, frozen, trend }
  const statusData = data ? [
    { name: 'Active', value: data.active || 0 },
    { name: 'Pending', value: data.pending || 0 },
    { name: 'Expired', value: data.expired || 0 },
    { name: 'Frozen', value: data.frozen || 0 },
  ].filter(d => d.value > 0) : [];

  const trendData = (data?.trend || []).map(d => ({
    name: d._id,
    count: d.count,
  }));

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-[#666666] mb-4">Membership Overview</h3>

      {/* Status summary pills */}
      {data && (
        <div className="flex gap-3 mb-4 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-semibold">Active: {data.active || 0}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold">Pending: {data.pending || 0}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-semibold">Expired: {data.expired || 0}</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">Frozen: {data.frozen || 0}</span>
        </div>
      )}

      {/* Trend Chart */}
      {trendData.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" />
            <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} axisLine={{ stroke: '#EAEAEA' }} />
            <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#EAEAEA' }} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #EAEAEA', borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="count" fill="#111111" radius={[4, 4, 0, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[220px] text-sm text-[#888]">
          No membership data yet
        </div>
      )}
    </div>
  );
}
