import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency } from '../../lib/utils';
import { Trophy, Calendar, CreditCard, Utensils, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuthStore();

  const { data: membership } = useQuery({
    queryKey: ['my-membership'],
    queryFn: () => api.get(`/memberships/${user.id}`).then(r => r.data),
    enabled: !!user?.id,
  });

  const { data: orders } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/my-orders').then(r => r.data),
    enabled: !!user?.id,
  });

  const m = membership?.membership;
  const plan = m?.planId;
  const daysLeft = m?.endDate ? Math.max(0, Math.ceil((new Date(m.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
  const isExpired = m?.status === 'expired' || daysLeft <= 0;
  const isPending = m?.status === 'pending';

  const statusConfig = {
    active: { color: 'bg-green-50 border-green-200 text-green-700', icon: <CheckCircle size={20} />, text: 'Active' },
    pending: { color: 'bg-amber-50 border-amber-200 text-amber-700', icon: <Clock size={20} />, text: 'Payment Pending' },
    expired: { color: 'bg-red-50 border-red-200 text-red-700', icon: <AlertTriangle size={20} />, text: 'Expired' },
    frozen: { color: 'bg-blue-50 border-blue-200 text-blue-700', icon: <Clock size={20} />, text: 'Frozen' },
  };

  const sc = statusConfig[m?.status] || statusConfig.pending;

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name?.split(' ')[0]}!`} subtitle="Here's your academy overview" />

      {/* Membership Card */}
      {m ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border-2 p-6 mb-8 ${sc.color}`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {sc.icon}
                <span className="text-sm font-bold uppercase">{sc.text}</span>
              </div>
              <h2 className="text-2xl font-bold">{plan?.name || 'No Plan'}</h2>
              <p className="text-sm opacity-75 mt-1">
                {plan?.sportsIncluded?.join(' • ') || 'No sports assigned'}
              </p>
            </div>
            <div className="text-right">
              {!isPending && !isExpired && (
                <>
                  <p className="text-3xl font-bold">{daysLeft}</p>
                  <p className="text-xs opacity-75">days left</p>
                </>
              )}
            </div>
          </div>

          {m.endDate && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Valid until: {new Date(m.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              {(isExpired || daysLeft <= 7) && (
                <Link to="/user/membership" className="font-bold underline">Renew Now →</Link>
              )}
            </div>
          )}

          {isPending && (
            <div className="mt-4 p-3 bg-white/50 rounded-xl">
              <p className="text-sm font-medium">⚠ Your membership is pending payment. Please contact the reception to complete payment.</p>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="card mb-8 text-center py-8">
          <p className="text-[#888] text-sm">No active membership found.</p>
          <p className="text-xs text-[#999] mt-1">Visit the academy reception to get started!</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/user/membership">
          <motion.div whileHover={{ scale: 1.02 }} className="card flex items-center gap-4 cursor-pointer hover:bg-[#F5F5F5]">
            <Trophy size={28} strokeWidth={1.5} className="text-[#666]" />
            <div>
              <h3 className="font-semibold text-[#111]">Membership</h3>
              <p className="text-xs text-[#888]">View plan, sports & invoices</p>
            </div>
          </motion.div>
        </Link>
        <Link to="/user/food">
          <motion.div whileHover={{ scale: 1.02 }} className="card flex items-center gap-4 cursor-pointer hover:bg-[#F5F5F5]">
            <Utensils size={28} strokeWidth={1.5} className="text-[#666]" />
            <div>
              <h3 className="font-semibold text-[#111]">Order Food</h3>
              <p className="text-xs text-[#888]">Browse menu & place orders</p>
            </div>
          </motion.div>
        </Link>
        <Link to="/user/orders">
          <motion.div whileHover={{ scale: 1.02 }} className="card flex items-center gap-4 cursor-pointer hover:bg-[#F5F5F5]">
            <Calendar size={28} strokeWidth={1.5} className="text-[#666]" />
            <div>
              <h3 className="font-semibold text-[#111]">Order History</h3>
              <p className="text-xs text-[#888]">{orders?.orders?.length || 0} orders</p>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <h3 className="text-sm font-medium text-[#666666] mb-4">Recent Food Orders</h3>
        <div className="space-y-2">
          {(!orders?.orders || orders.orders.length === 0) ? (
            <p className="text-sm text-[#888] text-center py-6">No orders yet. Try ordering from the restaurant!</p>
          ) : (
            orders.orders.slice(0, 5).map(order => (
              <div key={order._id} className="flex items-center justify-between p-3 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA]">
                <div>
                  <p className="text-sm font-medium text-[#111]">{order.orderNumber}</p>
                  <p className="text-xs text-[#888]">{order.items?.length} items • {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#111]">{formatCurrency(order.totalAmount)}</p>
                  <span className={`text-[10px] font-bold uppercase ${
                    order.status === 'delivered' ? 'text-green-600' :
                    order.status === 'cancelled' ? 'text-red-600' : 'text-amber-600'
                  }`}>{order.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
