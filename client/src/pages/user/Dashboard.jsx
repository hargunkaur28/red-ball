import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';
import StatCard from '../../components/shared/StatCard';
import PageHeader from '../../components/shared/PageHeader';

export default function UserDashboard() {
  const { user } = useAuthStore();
  const { data: membership } = useQuery({
    queryKey: ['my-membership'],
    queryFn: () => api.get(`/memberships/${user?.id}`).then(r => r.data),
    enabled: !!user?.id,
  });

  const m = membership?.membership;
  const daysLeft = m?.endDate ? Math.max(0, Math.ceil((new Date(m.endDate) - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name || 'User'}!`} subtitle="Here's your membership overview" />

      {/* Fee alert */}
      {m && daysLeft <= 7 && m.status === 'active' && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 px-4 py-3 rounded-xl bg-black/5 border border-black/10 flex items-center justify-between">
          <span className="text-sm text-black">
            {daysLeft === 0 ? '🚨 Your membership has expired!' : `⚠ Your membership expires in ${daysLeft} day(s). Renew now!`}
          </span>
          <button className="btn-primary text-sm">Renew Now →</button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Membership" value={0} icon="💳" subtitle={m?.planId?.name || 'No active plan'} />
        <StatCard title="Days Left" value={daysLeft} icon="⏰" accent={daysLeft <= 7} />
        <StatCard title="Status" value={0} icon="✅" subtitle={m?.status || 'N/A'} />
        <StatCard title="Sports" value={0} icon="🏏" subtitle={m?.planId?.sportsIncluded?.join(', ') || 'None'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.a href="/user/food" whileHover={{ scale: 1.02 }} className="card flex items-center gap-4 cursor-pointer hover:border-black/20 transition-all">
          <span className="text-3xl">🍔</span>
          <div><h3 className="text-[#111111] font-semibold">Order Food</h3><p className="text-sm text-[#888888]">Browse the restaurant menu</p></div>
        </motion.a>
        <motion.a href="/user/membership" whileHover={{ scale: 1.02 }} className="card flex items-center gap-4 cursor-pointer hover:border-black/20 transition-all">
          <span className="text-3xl">💳</span>
          <div><h3 className="text-[#111111] font-semibold">My Membership</h3><p className="text-sm text-[#888888]">View plan details & history</p></div>
        </motion.a>
      </div>
    </div>
  );
}
