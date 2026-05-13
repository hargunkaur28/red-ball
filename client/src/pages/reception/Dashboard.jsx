import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency } from '../../lib/utils';
import { GraduationCap, CreditCard, Activity, Receipt, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

const actions = [
  { icon: <GraduationCap size={36} strokeWidth={1.5} />, title: 'New Admission', desc: 'Register a new student with membership', href: '/reception/admissions', color: 'border-black/20 hover:border-black/40' },
  { icon: <RefreshCw size={36} strokeWidth={1.5} />, title: 'Membership Renewal', desc: 'Renew an existing membership', href: '/reception/memberships', color: 'border-blue-600/20 hover:border-blue-600/40' },
  { icon: <Activity size={36} strokeWidth={1.5} />, title: 'One-Time Play', desc: 'Quick booking for walk-in players', href: '/reception/one-time-play', color: 'border-green-600/20 hover:border-green-600/40' },
  { icon: <Receipt size={36} strokeWidth={1.5} />, title: 'Payments & Receipts', desc: 'View payments, collect fees, print receipts', href: '/reception/payments', color: 'border-amber-600/20 hover:border-amber-600/40' },
];

export default function ReceptionDashboard() {
  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: pending } = useQuery({
    queryKey: ['admissions', 'pending-fees'],
    queryFn: () => api.get('/admissions/pending-fees').then(r => r.data),
    refetchInterval: 30000,
  });

  return (
    <div>
      <PageHeader title="Reception Panel" subtitle="Quick actions for daily operations" />

      {/* CRITICAL: Pending Fees Alerts */}
      {pending?.totalCount > 0 && (
        <div className="mb-6 space-y-2">
          {pending.pendingPayments?.length > 0 && (
            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                <span className="text-sm text-amber-800 font-medium">
                  {pending.pendingPayments.length} pending/partial fee(s) — {formatCurrency(pending.totalPendingFees)}
                </span>
              </div>
              <Link to="/reception/payments" className="text-sm text-amber-700 font-semibold hover:underline">Collect →</Link>
            </div>
          )}
          {pending.expiringMemberships?.length > 0 && (
            <div className="px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-orange-600" />
                <span className="text-sm text-orange-800 font-medium">
                  {pending.expiringMemberships.length} membership(s) expiring soon
                </span>
              </div>
              <Link to="/reception/memberships" className="text-sm text-orange-700 font-semibold hover:underline">Renew →</Link>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="p-4 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA]">
          <p className="text-xs text-[#888]">Today's Revenue</p>
          <p className="text-xl font-bold text-[#111]">{formatCurrency(overview?.todayRevenue || 0)}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA]">
          <p className="text-xs text-[#888]">Active Members</p>
          <p className="text-xl font-bold text-[#111]">{overview?.activeMemberships || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-xs text-amber-600">Pending Fees</p>
          <p className="text-xl font-bold text-amber-700">{overview?.pendingFees || 0}</p>
        </div>
        <div className="p-4 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA]">
          <p className="text-xs text-[#888]">Today's Admissions</p>
          <p className="text-xl font-bold text-[#111]">{overview?.todayAdmissions || 0}</p>
        </div>
      </div>

      {/* Large Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actions.map((a, i) => (
          <motion.div key={a.title}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <Link to={a.href} className={`card flex items-center gap-6 cursor-pointer hover:bg-[#F5F5F5] border-2 ${a.color} transition-all py-6`}>
              <span className="text-current">{a.icon}</span>
              <div>
                <h3 className="text-xl font-bold text-[#111111]">{a.title}</h3>
                <p className="text-sm text-[#888888]">{a.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
