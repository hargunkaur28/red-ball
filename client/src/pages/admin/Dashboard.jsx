import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/axios';
import { formatCurrency } from '../../lib/utils';
import StatCard from '../../components/shared/StatCard';
import PageHeader from '../../components/shared/PageHeader';
import RevenueChart from '../../components/charts/RevenueChart';
import MembershipChart from '../../components/charts/MembershipChart';
import SalesChart from '../../components/charts/SalesChart';
import { Users, CheckCircle, Clock, IndianRupee, AlertTriangle, Utensils, GraduationCap, CreditCard, Activity, AlertCircle } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

export default function AdminDashboard() {
  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data),
  });

  const { data: revenue } = useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: () => api.get('/analytics/revenue?range=30').then(r => r.data),
  });

  const { data: memberships } = useQuery({
    queryKey: ['analytics', 'memberships'],
    queryFn: () => api.get('/analytics/memberships?range=90').then(r => r.data),
  });

  const { data: sports } = useQuery({
    queryKey: ['analytics', 'sports'],
    queryFn: () => api.get('/analytics/sports-popularity').then(r => r.data),
  });

  const { data: pending } = useQuery({
    queryKey: ['admissions', 'pending-fees'],
    queryFn: () => api.get('/admissions/pending-fees').then(r => r.data),
  });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back! Here's your academy overview." />

      {/* Fee Alert Banner */}
      {pending?.totalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 px-4 py-3 rounded-xl bg-black/5 border border-black/10 flex items-center justify-between"
        >
          <span className="text-sm text-black flex items-center gap-2">
            <AlertCircle size={16} /> {pending.totalCount} student(s) have pending or upcoming fees
          </span>
          <a href="/admin/payments" className="text-sm text-black font-medium hover:text-red-300">
            View All →
          </a>
        </motion.div>
      )}

      {/* Stat Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard title="Total Members" value={overview?.totalMembers || 0} icon={<Users size={20} />} />
        <StatCard title="Active Memberships" value={overview?.activeMemberships || 0} icon={<CheckCircle size={20} />} />
        <StatCard title="Expiring Soon" value={overview?.expiringSoon || 0} icon={<Clock size={20} />} accent />
        <StatCard title="Today's Revenue" value={overview?.todayRevenue || 0} icon={<IndianRupee size={20} />} subtitle={formatCurrency(overview?.todayRevenue || 0)} />
        <StatCard title="Pending Fees" value={overview?.pendingFees || 0} icon={<AlertTriangle size={20} />} accent />
        <StatCard title="Pending Orders" value={overview?.pendingOrders || 0} icon={<Utensils size={20} />} />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RevenueChart data={revenue?.revenue || []} />
        <MembershipChart data={memberships?.memberships || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={sports?.sports || []} />
        
        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-sm font-medium text-[#666666] mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {[
              { icon: <GraduationCap size={16} />, text: 'New admission: Rahul Sharma', time: '2 min ago' },
              { icon: <CreditCard size={16} />, text: 'Membership renewed: Priya Patel', time: '15 min ago' },
              { icon: <IndianRupee size={16} />, text: 'Payment received: ₹2,360', time: '1 hour ago' },
              { icon: <Utensils size={16} />, text: 'Order #ORD-0042 delivered', time: '2 hours ago' },
              { icon: <Activity size={16} />, text: 'One-time play: Amit (Cricket, 2hrs)', time: '3 hours ago' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#F5F5F5]"
              >
                <span className="text-[#666666]">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-[#111111]">{item.text}</p>
                  <p className="text-xs text-[#888888]">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
