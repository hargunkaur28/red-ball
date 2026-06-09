import { useEffect, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import socket, { connectSocket } from '../../lib/socket';
import StatCard from '../../components/shared/StatCard';
import { ClipboardList, IndianRupee, AlertTriangle, Timer, ShoppingBag, DollarSign, ChefHat } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

const KITCHEN_STATES = [
  { value: 'open',        label: 'Open',        dot: 'bg-green-500',  ring: 'ring-green-500/30', bar: 'bg-green-500/10 border-green-500/30 text-green-800'  },
  { value: 'busy',        label: 'Busy',        dot: 'bg-amber-500',  ring: 'ring-amber-500/30', bar: 'bg-amber-500/10 border-amber-500/30 text-amber-800'  },
  { value: 'closed',      label: 'Closed',      dot: 'bg-red-500',    ring: 'ring-red-500/30',   bar: 'bg-red-500/10 border-red-500/30 text-red-800'        },
  { value: 'maintenance', label: 'Maintenance', dot: 'bg-gray-500',   ring: 'ring-gray-500/30',  bar: 'bg-gray-500/10 border-gray-500/30 text-gray-800'     },
];

export default function RestaurantDashboard() {
  const qc = useQueryClient();
  const [statusLoading, setStatusLoading] = useState(false);

  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: () => api.get('/orders').then(r => r.data) });
  const { data: menuData } = useQuery({ queryKey: ['menu'], queryFn: () => api.get('/menu').then(r => r.data) });
  const { data: kitchenData, refetch: refetchKitchen } = useQuery({
    queryKey: ['kitchen-status'],
    queryFn: () => api.get('/kitchen/status').then(r => r.data),
    staleTime: 30000,
  });

  const kitchenStatus = kitchenData?.kitchenStatus || 'open';
  const currentState = KITCHEN_STATES.find(s => s.value === kitchenStatus) || KITCHEN_STATES[0];

  const kitchenMutation = useMutation({
    mutationFn: (status) => api.put('/kitchen/status', { status }),
    onMutate: () => setStatusLoading(true),
    onSuccess: (_, status) => {
      qc.setQueryData(['kitchen-status'], { kitchenStatus: status });
      setStatusLoading(false);
      toast.success(`Kitchen status set to ${status}.`);
    },
    onError: () => {
      setStatusLoading(false);
      toast.error('Failed to update kitchen status.');
    },
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['orders'] });
  }, [qc]);

  useEffect(() => {
    connectSocket();
    socket.emit('join-managers', { token: localStorage.getItem('accessToken') });
    socket.on('order:new', invalidate);
    socket.on('order:updated', invalidate);
    socket.on('menu:updated', () => qc.invalidateQueries({ queryKey: ['menu'] }));
    socket.on('restaurant:kitchenStatus', ({ status }) => {
      qc.setQueryData(['kitchen-status'], { kitchenStatus: status });
    });
    return () => {
      socket.off('order:new', invalidate);
      socket.off('order:updated', invalidate);
      socket.off('menu:updated');
      socket.off('restaurant:kitchenStatus');
    };
  }, [invalidate, qc]);

  const isToday = (dateString) => {
    const today = new Date();
    const d = new Date(dateString);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  const validOrders = (orders?.orders || []).filter(o => ['cash', 'upi', 'online'].includes(o.paymentMethod) || o.paymentStatus === 'paid');
  const todaysValidOrders = validOrders.filter(o => isToday(o.createdAt));
  const activeOrders = validOrders.filter(o => ['new', 'preparing'].includes(o.status));
  const manualPaymentsPending = validOrders.filter(o => ['cash', 'upi'].includes(o.paymentMethod) && o.paymentStatus === 'pending');
  const todaySales = todaysValidOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.totalAmount, 0);
  const outOfStockCount = (menuData?.items || []).filter(item => !item.isAvailable).length;

  return (
    <div>
      <PageHeader title="Restaurant Dashboard" subtitle="Overview of today's operations" />

      {/* Kitchen Status Control */}
      <div className={`mb-6 rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${currentState.bar}`}>
        <div className="flex items-center gap-3">
          <div className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-2 ${currentState.ring}`}>
            <span className={`h-4 w-4 rounded-full ${currentState.dot} ${kitchenStatus === 'open' ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest opacity-60">Kitchen Status</p>
            <p className="text-base font-black">{currentState.label}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {KITCHEN_STATES.map(state => (
            <button
              key={state.value}
              disabled={statusLoading || state.value === kitchenStatus}
              onClick={() => kitchenMutation.mutate(state.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all disabled:cursor-not-allowed ${
                state.value === kitchenStatus
                  ? `ring-2 ${state.ring} bg-white shadow-sm opacity-100`
                  : 'bg-white/60 border-transparent hover:bg-white hover:shadow-sm opacity-70 hover:opacity-100'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${state.dot}`} />
              {state.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Alerts Section */}
      {(manualPaymentsPending.length > 0 || activeOrders.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {manualPaymentsPending.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-red-900 text-sm">Action Required</h4>
                  <p className="text-xs text-red-700 font-medium">{manualPaymentsPending.length} order(s) pending manual cash collection!</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Urgent</span>
            </div>
          )}

          {activeOrders.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <ChefHat size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 text-sm">Kitchen Active</h4>
                  <p className="text-xs text-blue-700 font-medium">{activeOrders.length} order(s) currently being prepared.</p>
                </div>
              </div>
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Active Orders" value={activeOrders.length} icon={<ClipboardList size={20} />} accent />
        <StatCard title="Today's Orders" value={todaysValidOrders.length} icon={<ShoppingBag size={20} />} accent />
        <StatCard title="Today's Sales" value={todaySales} icon={<IndianRupee size={20} />} subtitle={formatCurrency(todaySales)} />
        <StatCard title="Out of Stock" value={outOfStockCount} icon={<AlertTriangle size={20} />} accent />
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
                <span className="text-[#888888] text-xs ml-2">
                  {o.orderType === 'delivery' ? '🛵 Delivery' : o.tableId?.label || 'Dine-in'}
                </span>
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
