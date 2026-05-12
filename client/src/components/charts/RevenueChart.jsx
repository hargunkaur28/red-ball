import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function RevenueChart({ data = [] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-medium text-[#666666] mb-4">Monthly Revenue</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="academyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="restaurantGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E1E24" />
          <XAxis dataKey="_id" tick={{ fill: '#52525B', fontSize: 12 }} axisLine={{ stroke: '#1E1E24' }} />
          <YAxis tick={{ fill: '#52525B', fontSize: 12 }} axisLine={{ stroke: '#1E1E24' }} />
          <Tooltip contentStyle={{ background: '#111114', border: '1px solid #1E1E24', borderRadius: 8, color: '#FAFAFA' }} />
          <Legend />
          <Area type="monotone" dataKey="academy" name="Academy" stroke="#DC2626" fill="url(#academyGrad)" strokeWidth={2} animationDuration={800} />
          <Area type="monotone" dataKey="restaurant" name="Restaurant" stroke="#3B82F6" fill="url(#restaurantGrad)" strokeWidth={2} animationDuration={800} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
