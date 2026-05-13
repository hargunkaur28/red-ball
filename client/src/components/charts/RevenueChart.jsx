import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../lib/utils';

export default function RevenueChart({ data = [] }) {
  const formatted = data.map(d => ({
    date: d._id,
    revenue: d.total,
    count: d.count,
  }));

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-[#666666] mb-4">Revenue (Last 30 Days)</h3>
      {formatted.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#111111" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#111111" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#EAEAEA" />
            <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} axisLine={{ stroke: '#EAEAEA' }} />
            <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#EAEAEA' }}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #EAEAEA', borderRadius: 8, fontSize: 12 }}
              formatter={(value) => [formatCurrency(value), 'Revenue']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#111111" fill="url(#revenueGrad)" strokeWidth={2} animationDuration={800} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[280px] text-sm text-[#888]">
          No revenue data yet
        </div>
      )}
    </div>
  );
}
