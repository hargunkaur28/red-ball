import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import socket, { connectSocket } from '../../lib/socket';
import StatCard from '../../components/shared/StatCard';
import { ClipboardList, IndianRupee, AlertTriangle, Timer } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency } from '../../lib/utils';

export default function RestaurantDashboard() {
  const qc = useQueryClient();
  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: () => api.get('/orders').then(r => r.data) });
  const { data: lowStock } = useQuery({ queryKey: ['inventory', 'low-stock'], queryFn: () => api.get('/inventory/low-stock').then(r => r.data) });

  // Live updates for dashboard stats
  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['orders'] });
  }, [qc]);

  useEffect(() => {
    connectSocket();
    socket.emit('join-managers');
    socket.on('order:new', invalidate);
    socket.on('order:updated', invalidate);
    return () => {
      socket.off('order:new', invalidate);
      socket.off('order:updated', invalidate);
    };
  }, [invalidate]);

  const activeOrders = (orders?.orders || []).filter(o => ['new', 'preparing'].includes(o.status));
  const todaySales = (orders?.orders || []).filter(o => o.status === 'delivered').reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div>
      <PageHeader title="Restaurant Dashboard" subtitle="Overview of today's operations" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Orders" value={activeOrders.length} icon={<ClipboardList size={20} />} accent />
        <StatCard title="Today's Sales" value={todaySales} icon={<IndianRupee size={20} />} subtitle={formatCurrency(todaySales)} />
        <StatCard title="Out of Stock" value={lowStock?.count || 0} icon={<AlertTriangle size={20} />} accent />
        <StatCard title="Avg Prep Time" value={15} icon={<Timer size={20} />} subtitle="minutes" />
      </div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-[#666666]">Active Orders</h3>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${socket.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-[10px] text-[#888888]">Live</span>
          </div>
        </div>
        <div className="space-y-2">
          {activeOrders.slice(0, 8).map(o => (
            <div key={o._id} className="flex items-center justify-between p-3 rounded-lg bg-[#F7F7F7] border border-[#EAEAEA]">
              <div>
                <span className="font-mono text-black text-sm">{o.orderNumber}</span>
                <span className="text-[#888888] text-xs ml-2">{o.tableId?.label}</span>
              </div>
              <span className={`badge ${o.status === 'new' ? 'badge-info' : 'badge-warning'}`}>{o.status}</span>
            </div>
          ))}
          {activeOrders.length === 0 && <p className="text-[#888888] text-sm text-center py-4">No active orders</p>}
        </div>
      </div>
    </div>
  );
}
