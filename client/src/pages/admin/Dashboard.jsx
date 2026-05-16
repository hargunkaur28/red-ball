import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { formatCurrency } from '../../lib/utils';
import StatCard from '../../components/shared/StatCard';
import PageHeader from '../../components/shared/PageHeader';
import RevenueChart from '../../components/charts/RevenueChart';
import MembershipChart from '../../components/charts/MembershipChart';
import SalesChart from '../../components/charts/SalesChart';
import {
  Users, CheckCircle, Clock, IndianRupee, AlertTriangle, Utensils,
  GraduationCap, CreditCard, Activity, AlertCircle, ShoppingBag,
} from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

import QuickActions from '../../components/dashboard/QuickActions';
import LiveOccupancy from '../../components/dashboard/LiveOccupancy';

export default function AdminDashboard() {
  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data),
    refetchInterval: 30000, // refresh every 30s
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
    refetchInterval: 30000,
  });

  const { data: recentData } = useQuery({
    queryKey: ['analytics', 'recent-activity'],
    queryFn: () => api.get('/analytics/recent-activity').then(r => r.data),
    refetchInterval: 30000,
  });

  const activityIcons = {
    admission: <GraduationCap size={16} />,
    payment: <CreditCard size={16} />,
    order: <ShoppingBag size={16} />,
  };

  const statusColors = {
    paid: 'text-green-600',
    pending: 'text-amber-600',
    delivered: 'text-green-600',
    new: 'text-blue-600',
    preparing: 'text-amber-600',
    cancelled: 'text-red-600',
  };

  return (
    <div className="pb-24 lg:pb-0">
      <PageHeader title="Dashboard" subtitle="Welcome back! Here's your academy overview." />

      {/* Quick Actions — NEW */}
      <QuickActions />

      {/* Live Occupancy — NEW */}
      <LiveOccupancy />

      {/* CRITICAL: Pending Fees Alert Banner */}
      {pending?.totalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-xl overflow-hidden"
        >
          {/* Pending payments banner */}
          {pending.pendingPayments?.length > 0 && (
            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <span className="text-sm text-amber-800 font-medium">
                  {pending.pendingPayments.length} pending/partial fee(s) — {formatCurrency(pending.totalPendingFees)}
                </span>
              </div>
              <Link to="/admin/payments" className="text-sm text-amber-700 font-semibold hover:underline">
                Collect Now →
              </Link>
            </div>
          )}

          {/* Expiring memberships banner */}
          {pending.expiringMemberships?.length > 0 && (
            <div className="px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-orange-600" />
                <span className="text-sm text-orange-800 font-medium">
                  {pending.expiringMemberships.length} membership(s) expiring soon
                </span>
              </div>
              <Link to="/admin/memberships" className="text-sm text-orange-700 font-semibold hover:underline">
                Renew →
              </Link>
            </div>
          )}

          {/* Expired memberships banner */}
          {pending.expiredMemberships?.length > 0 && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600" />
                <span className="text-sm text-red-800 font-medium">
                  {pending.expiredMemberships.length} membership(s) have expired
                </span>
              </div>
              <Link to="/admin/admissions" className="text-sm text-red-700 font-semibold hover:underline">
                View →
              </Link>
            </div>
          )}
        </motion.div>
      )}

      {/* Stat Cards — Always reflect realtime system state */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard title="Total Members" value={overview?.totalMembers || 0} icon={<Users size={20} />} />
        <StatCard title="Active" value={overview?.activeMemberships || 0} icon={<CheckCircle size={20} />} />
        <StatCard title="Expiring Soon" value={overview?.expiringSoon || 0} icon={<Clock size={20} />} accent />
        <StatCard title="Today Revenue" value={formatCurrency(overview?.todayRevenue || 0)} icon={<IndianRupee size={20} />} />
        <StatCard title="Pending Fees" value={overview?.pendingFees || 0} icon={<AlertTriangle size={20} />} accent />
        <StatCard title="Pending Orders" value={overview?.pendingOrders || 0} icon={<Utensils size={20} />} />
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RevenueChart data={revenue?.revenue || []} />
        <MembershipChart data={memberships} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={sports?.membershipSports || []} />

        {/* Recent Activity — REAL DATA from API */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#666666]">Recent Activity</h3>
            <span className="text-[10px] text-[#999] font-mono">LIVE</span>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {(!recentData?.activity || recentData.activity.length === 0) ? (
              <p className="text-sm text-[#888] text-center py-8">No recent activity yet.</p>
            ) : (
              recentData.activity.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F5F5F5] transition-colors"
                >
                  <span className="text-[#666666]">{activityIcons[item.type] || <Activity size={16} />}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#111111] truncate">{item.text}</p>
                    <p className="text-xs text-[#888888]">
                      {new Date(item.time).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase ${statusColors[item.status] || 'text-[#888]'}`}>
                    {item.status}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
