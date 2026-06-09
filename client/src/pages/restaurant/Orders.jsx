import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import socket from '../../lib/socket';
import {
  Clock, ChefHat, CheckCircle, Truck, X, DollarSign, FileText, User,
  LayoutGrid, List, MapPin, Timer, Ban, RefreshCw, ExternalLink,
} from 'lucide-react';


const statusConfig = {
  new:       { label: 'New Orders',         color: 'border-blue-500 bg-blue-50/40',   headerBg: 'bg-blue-600 text-white',        icon: <Clock size={18} /> },
  preparing: { label: 'Preparing',           color: 'border-amber-500 bg-amber-50/40', headerBg: 'bg-amber-500 text-black',       icon: <ChefHat size={18} /> },
  ready:     { label: 'Ready for Table',     color: 'border-green-500 bg-green-50/40', headerBg: 'bg-green-600 text-white',       icon: <CheckCircle size={18} /> },
  delivered: { label: 'Delivered / Closed',  color: 'border-gray-300 bg-gray-50/40',   headerBg: 'bg-gray-700 text-white',        icon: <Truck size={18} /> },
};

const itemStatusStyle = {
  pending:    'text-gray-500',
  preparing:  'text-amber-600 font-bold',
  ready:      'text-green-600 font-bold',
  delivered:  'text-gray-400 line-through',
  cancelled:  'text-red-500 line-through',
  refunded:   'text-purple-500 line-through',
};

const PREP_OPTIONS = [10, 15, 20, 30, 45, 60];

const getTimeAgo = (mins) => {
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  return `${Math.floor(hours / 24)}d ${hours % 24}h ago`;
};

const getReadyIn = (estimatedReadyAt) => {
  if (!estimatedReadyAt) return null;
  const diff = Math.ceil((new Date(estimatedReadyAt) - Date.now()) / 60000);
  if (diff <= 0) return 'Ready now';
  return `Ready in ${diff} min`;
};

export default function RestaurantOrders() {
  const qc = useQueryClient();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [viewMode, setViewMode] = useState('card');
  const [prepInputs, setPrepInputs] = useState({});   // orderId → open state
  const [prepValues, setPrepValues] = useState({});   // orderId → minutes value
  const [prepCustom, setPrepCustom] = useState({});   // orderId → custom string input
  const [cancelDialog, setCancelDialog] = useState(null); // { orderId, itemId, itemName }
  const [cancelRemark, setCancelRemark] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { data } = useQuery({
    queryKey: ['restaurant-orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
    refetchInterval: 10000,
  });

  // Socket subscriptions — use shared singleton (no new connection per mount)
  useEffect(() => {
    socket.emit('join-managers', { token: localStorage.getItem('accessToken') });

    const invalidateOrders = () => qc.invalidateQueries({ queryKey: ['restaurant-orders'] });

    const handleOrderNew = (payload) => {
      invalidateOrders();
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch {}
      const tableLbl = payload?.order?.tableId?.label || 'a Table';
      toast.success(`🔔 Incoming Order from ${tableLbl}!`, { description: 'Check New Orders column.' });
    };

    socket.on('order:new', handleOrderNew);
    socket.on('order:updated', invalidateOrders);
    socket.on('order:cancelled', invalidateOrders);
    socket.on('restaurant:orderUpdated', invalidateOrders);
    socket.on('restaurant:itemCancelled', invalidateOrders);
    socket.on('restaurant:itemRefunded', invalidateOrders);
    socket.on('dashboard:refresh', invalidateOrders);

    return () => {
      socket.off('order:new', handleOrderNew);
      socket.off('order:updated', invalidateOrders);
      socket.off('order:cancelled', invalidateOrders);
      socket.off('restaurant:orderUpdated', invalidateOrders);
      socket.off('restaurant:itemCancelled', invalidateOrders);
      socket.off('restaurant:itemRefunded', invalidateOrders);
      socket.off('dashboard:refresh', invalidateOrders);
    };
  }, [qc]);

  const updateMutation = useMutation({
    mutationFn: ({ id, status, paymentStatus }) => api.put(`/orders/${id}/status`, { status, paymentStatus }),
    onMutate: async ({ id, status, paymentStatus }) => {
      await qc.cancelQueries({ queryKey: ['restaurant-orders'] });
      const previous = qc.getQueryData(['restaurant-orders']);
      qc.setQueryData(['restaurant-orders'], (old) => {
        if (!old?.orders) return old;
        return {
          ...old,
          orders: old.orders.map(o =>
            o._id === id
              ? { ...o, ...(status && { status }), ...(paymentStatus && { paymentStatus }) }
              : o
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      qc.setQueryData(['restaurant-orders'], context.previous);
      toast.error('Failed to update order. Please try again.');
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['restaurant-orders'] }); },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => api.put(`/orders/${id}/cancel`, { reason, refund: false }),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ['restaurant-orders'] });
      const previous = qc.getQueryData(['restaurant-orders']);
      qc.setQueryData(['restaurant-orders'], (old) => {
        if (!old?.orders) return old;
        return { ...old, orders: old.orders.map(o => o._id === id ? { ...o, status: 'cancelled' } : o) };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      qc.setQueryData(['restaurant-orders'], context.previous);
      toast.error('Failed to cancel order.');
    },
    onSettled: () => { qc.invalidateQueries({ queryKey: ['restaurant-orders'] }); },
    onSuccess: () => toast.success('Order cancelled.'),
  });

  const prepTimeMutation = useMutation({
    mutationFn: ({ id, minutes }) => api.put(`/orders/${id}/prep-time`, { estimatedPrepMinutes: minutes }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['restaurant-orders'] });
      setPrepInputs(p => ({ ...p, [id]: false }));
      toast.success('Prep time set.');
    },
  });

  const cancelItemMutation = useMutation({
    mutationFn: ({ orderId, itemId, reason }) => api.put(`/orders/${orderId}/items/${itemId}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant-orders'] });
      setCancelDialog(null);
      setCancelRemark('');
      toast.success('Item cancelled.');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to cancel item.'),
  });

  const refundItemMutation = useMutation({
    mutationFn: ({ orderId, itemId }) => api.put(`/orders/${orderId}/items/${itemId}/refund`, { note: 'Manual refund by manager' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['restaurant-orders'] }); toast.success('Item marked as refunded.'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to mark refund.'),
  });

  const rawOrders = data?.orders || [];
  const orders = rawOrders.filter(o => ['cash', 'upi', 'online'].includes(o.paymentMethod) || o.paymentStatus === 'paid');
  const kanbanColumns = ['new', 'preparing', 'ready', 'delivered'];
  const nextStatus = { new: 'preparing', preparing: 'ready', ready: 'delivered' };
  const actionLabels = { new: '✓ Accept & Start Prep', preparing: '🍽️ Mark Ready', ready: '🚚 Delivered' };

  const renderOrderCard = (order, index) => {
    const orderTimeMs = new Date(order.createdAt).getTime();
    const diffMins = Math.max(0, Math.floor((currentTime - orderTimeMs) / 60000));
    const isManualPending = ['cash', 'upi'].includes(order.paymentMethod) && order.paymentStatus === 'pending';
    const status = order.status;
    const readyIn = getReadyIn(order.estimatedReadyAt);
    const hasCancelledItems = order.items?.some(i => i.status === 'cancelled' || i.status === 'refunded');
    const isPrepOpen = prepInputs[order._id];

    return (
      <motion.div
        key={order._id}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, delay: index * 0.04 }}
        className={`bg-white rounded-2xl p-4 border shadow-md flex flex-col gap-3 transition-all ${
          status === 'new' ? 'border-l-8 border-l-blue-600' :
          status === 'preparing' ? 'border-l-8 border-l-amber-500' :
          status === 'ready' ? 'border-l-8 border-l-green-600' : ''
        }`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <span className="font-mono font-black text-xs text-black">{order.orderNumber}</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${diffMins > 25 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
            ⏱️ {getTimeAgo(diffMins)}
          </span>
        </div>

        {/* Table / Customer info */}
        <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-[#C8102E]">
              {order.orderType === 'delivery' ? '🛵 Delivery Order' : order.orderType === 'pickup' ? '🏃 Pickup Order' : (order.tableId?.label || `Table #${order.tableId?.tableNumber || 'Dine-in'}`)}
            </span>
            <span className="text-xs text-gray-500 font-semibold">{order.orderType || order.tableId?.section || 'Indoor'}</span>
          </div>
          {(order.customerName || order.customerId?.name) && (
            <p className="text-xs text-gray-600 flex items-center gap-1 font-medium">
              <User size={12} />
              {order.customerName || order.customerId?.name}
              {order.customerPhone && <span className="text-gray-400">({order.customerPhone})</span>}
            </p>
          )}

          {/* Delivery location */}
          {order.orderType === 'delivery' && (
            <div className="mt-1 space-y-1">
              {order.deliveryAddress && (
                <p className="text-xs text-gray-600 flex items-start gap-1 font-medium">
                  <MapPin size={11} className="mt-0.5 shrink-0 text-[#C8102E]" />
                  <span>{order.deliveryAddress}</span>
                </p>
              )}
              {(order.deliveryLocation?.mapsUrl || (order.deliveryLocation?.lat && order.deliveryLocation?.lng)) && (
                <a
                  href={order.deliveryLocation.mapsUrl || `https://maps.google.com/?q=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full transition-all"
                >
                  <ExternalLink size={10} /> Open in Maps
                </a>
              )}
            </div>
          )}
        </div>

        {/* Prep time badge / setter */}
        {status !== 'delivered' && status !== 'cancelled' && (
          <div>
            {order.estimatedPrepMinutes && !isPrepOpen ? (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                  <Timer size={13} />
                  <span>{readyIn || `${order.estimatedPrepMinutes} min prep`}</span>
                </div>
                <button
                  onClick={() => setPrepInputs(p => ({ ...p, [order._id]: true }))}
                  className="text-[10px] text-amber-600 font-bold underline underline-offset-2"
                >
                  Edit
                </button>
              </div>
            ) : isPrepOpen ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 space-y-2">
                <p className="text-xs font-bold text-amber-800 flex items-center gap-1"><Timer size={12} /> Set Prep Time</p>
                <div className="flex flex-wrap gap-1.5">
                  {PREP_OPTIONS.map(m => (
                    <button
                      key={m}
                      onClick={() => { setPrepValues(p => ({ ...p, [order._id]: m })); setPrepCustom(p => ({ ...p, [order._id]: '' })); }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all border ${prepValues[order._id] === m && !prepCustom[order._id] ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-amber-200 text-amber-700 hover:bg-amber-100'}`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    placeholder="Custom"
                    value={prepCustom[order._id] || ''}
                    onChange={e => { setPrepCustom(p => ({ ...p, [order._id]: e.target.value })); setPrepValues(p => ({ ...p, [order._id]: null })); }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white text-[11px] font-bold text-amber-800 placeholder:text-amber-300 outline-none focus:border-amber-500"
                  />
                  <span className="text-[11px] text-amber-600 font-bold shrink-0">min</span>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={(!prepValues[order._id] && !prepCustom[order._id]) || prepTimeMutation.isPending}
                    onClick={() => {
                      const mins = prepCustom[order._id] ? Number(prepCustom[order._id]) : prepValues[order._id];
                      if (!mins || mins < 1) return;
                      prepTimeMutation.mutate({ id: order._id, minutes: mins });
                    }}
                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black rounded-lg disabled:opacity-50 transition-all"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => { setPrepInputs(p => ({ ...p, [order._id]: false })); setPrepCustom(p => ({ ...p, [order._id]: '' })); }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[11px] font-black rounded-lg hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setPrepInputs(p => ({ ...p, [order._id]: true }))}
                className="w-full py-1.5 bg-gray-50 hover:bg-amber-50 border border-dashed border-gray-200 hover:border-amber-300 text-gray-400 hover:text-amber-600 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <Timer size={12} /> Set Prep Time
              </button>
            )}
          </div>
        )}

        {/* Payment status */}
        {isManualPending ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-2 text-xs text-red-700 animate-pulse flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-1.5 font-bold">
              <DollarSign size={14} /> Collect Payment from Table
            </div>
            <button
              onClick={() => updateMutation.mutate({ id: order._id, paymentStatus: 'paid' })}
              className="px-2.5 py-1 bg-[#C8102E] text-white rounded-lg text-[10px] font-black shadow hover:bg-[#A00D24] transition-all cursor-pointer"
            >
              Mark Paid
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-1.5 text-[11px] text-green-700 font-extrabold flex items-center gap-1">
            <CheckCircle size={13} />
            <span className="uppercase tracking-wider">Paid via {order.paymentMethod}</span>
          </div>
        )}

        {/* Special instructions */}
        {order.specialInstructions && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-1 font-bold text-amber-800 mb-0.5"><FileText size={12} /> Instructions:</div>
            <p className="italic">{order.specialInstructions}</p>
          </div>
        )}

        {/* Items list with per-item cancel */}
        <div className="space-y-1.5 border-t border-gray-100 pt-2">
          {order.items?.map((item) => {
            const isCancelled = item.status === 'cancelled' || item.status === 'refunded';
            const canCancel = !isCancelled && status !== 'delivered' && status !== 'cancelled';
            const needsRefund = item.refundStatus === 'pending';
            const isRefunded = item.refundStatus === 'refunded';

            return (
              <div key={item._id || item.name} className={`flex items-start justify-between gap-2 text-xs rounded-lg px-1.5 py-1 ${isCancelled ? 'bg-red-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <span className={`font-extrabold text-[#C8102E]`}>{item.quantity}×</span>
                  <span className={`ml-1 ${itemStatusStyle[item.status] || 'text-black font-semibold'}`}>
                    {item.name}{item.size && item.size !== 'Regular' ? ` (${item.size})` : ''}
                  </span>
                  {isCancelled && (
                    <span className="ml-1.5 text-[10px] font-black uppercase tracking-wider">
                      {item.status === 'refunded' || isRefunded ? (
                        <span className="text-purple-600">✓ Refunded</span>
                      ) : needsRefund ? (
                        <span className="text-orange-500">Refund Pending</span>
                      ) : (
                        <span className="text-red-500">Cancelled</span>
                      )}
                    </span>
                  )}
                  {item.kitchenNote && <p className="text-[10px] text-gray-400 italic">Note: {item.kitchenNote}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-mono text-gray-500 text-[11px]">{formatCurrency(item.price * item.quantity)}</span>
                  {canCancel && (
                    <button
                      onClick={() => { setCancelDialog({ orderId: order._id, itemId: item._id, itemName: item.name }); setCancelRemark(''); }}
                      title="Cancel this item"
                      className="p-0.5 rounded-md text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"
                    >
                      <Ban size={12} />
                    </button>
                  )}
                  {needsRefund && !isRefunded && (
                    <button
                      onClick={() => refundItemMutation.mutate({ orderId: order._id, itemId: item._id })}
                      disabled={refundItemMutation.isPending}
                      title="Mark refunded"
                      className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 text-[9px] font-black transition-all"
                    >
                      Refund
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total & actions */}
        <div className="border-t border-gray-100 pt-2">
          <div className="flex justify-between items-center text-sm font-extrabold mb-3 text-black">
            <span>Bill Total</span>
            <span className="font-mono text-[#C8102E]">{formatCurrency(order.totalAmount)}</span>
          </div>

          {status !== 'delivered' && status !== 'cancelled' && (
            <div className="flex gap-2">
              {nextStatus[status] && (
                <button
                  onClick={() => updateMutation.mutate({ id: order._id, status: nextStatus[status] })}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    status === 'new' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                    status === 'preparing' ? 'bg-[#F5A623] hover:bg-[#E09410] text-black font-black' :
                    'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {actionLabels[status]}
                </button>
              )}
              {status === 'new' && (
                <button
                  onClick={() => cancelMutation.mutate({ id: order._id, reason: 'Rejected by kitchen' })}
                  className="px-3 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-600 font-bold transition-all cursor-pointer"
                  title="Reject Order"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <PageHeader
          title="Live Kitchen Orders"
          subtitle={`${orders.filter(o => o.status === 'new').length} New • ${orders.filter(o => o.status === 'preparing').length} Preparing • ${orders.filter(o => o.status === 'ready').length} Ready`}
        />
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('card')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'card' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid size={16} /> Card View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List size={16} /> List View
          </button>
        </div>
      </div>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
          {kanbanColumns.map(status => {
            const config = statusConfig[status];
            const columnOrders = orders.filter(o => o.status === status);
            return (
              <div key={status} className={`rounded-3xl border-2 ${config.color} shadow-sm overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[500px]`}>
                <div className={`p-4 ${config.headerBg} flex items-center justify-between shadow-md shrink-0`}>
                  <div className="flex items-center gap-2 font-black tracking-wide uppercase text-sm">
                    {config.icon}<span>{config.label}</span>
                  </div>
                  <span className="text-xs font-black px-3 py-1 bg-black/30 rounded-full text-white">{columnOrders.length}</span>
                </div>
                <div className="p-4 flex-1 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                  {columnOrders.length === 0 && (
                    <div className="text-center py-16 text-gray-400 font-medium text-xs">No active orders</div>
                  )}
                  <AnimatePresence>
                    {columnOrders.map((order, index) => renderOrderCard(order, index))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="card overflow-hidden border border-gray-100 shadow-sm mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-500">Time & Table</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-500">Customer</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-500">Items</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-500">Status / Prep</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-500">Amount</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-500 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic text-sm">No live orders.</td>
                  </tr>
                ) : (
                  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(order => {
                    const orderTimeMs = new Date(order.createdAt).getTime();
                    const diffMins = Math.max(0, Math.floor((currentTime - orderTimeMs) / 60000));
                    const isManualPending = ['cash', 'upi'].includes(order.paymentMethod) && order.paymentStatus === 'pending';
                    const sConf = statusConfig[order.status];
                    const readyIn = getReadyIn(order.estimatedReadyAt);

                    return (
                      <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-full">{order.orderNumber}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diffMins > 25 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>⏱️ {getTimeAgo(diffMins)}</span>
                            </div>
                            <div className="text-xs text-black font-black uppercase tracking-tighter">
                              {order.orderType === 'delivery' ? '🛵 Delivery' : order.orderType === 'pickup' ? '🏃 Pickup' : (order.tableId?.label || 'Dine-in')}
                            </div>
                            {order.orderType === 'delivery' && (order.deliveryLocation?.mapsUrl || order.deliveryLocation?.lat) && (
                              <a
                                href={order.deliveryLocation.mapsUrl || `https://maps.google.com/?q=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`}
                                target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                              >
                                <ExternalLink size={9} /> Open in Maps
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                              {(order.customerName || order.customerId?.name || 'GU').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="text-xs">
                              <p className="font-bold">{order.customerName || order.customerId?.name || 'Guest'}</p>
                              <p className="text-[10px] text-gray-400">{order.customerPhone || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[220px]">
                          <div className="text-xs space-y-1">
                            {order.items?.map((item, idx) => (
                              <div key={idx} className={`flex items-center justify-between gap-2 ${item.status === 'cancelled' || item.status === 'refunded' ? 'opacity-60' : ''}`}>
                                <span className={item.status === 'cancelled' || item.status === 'refunded' ? 'line-through text-red-400' : ''}>
                                  <span className="font-extrabold text-[#C8102E]">{item.quantity}×</span> {item.name}
                                </span>
                                {item.status === 'cancelled' && item.refundStatus === 'pending' && (
                                  <button
                                    onClick={() => refundItemMutation.mutate({ orderId: order._id, itemId: item._id })}
                                    className="text-[9px] font-black bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded shrink-0"
                                  >Refund</button>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${sConf?.color || 'bg-gray-100'} shadow-sm mb-1`}>
                            {sConf?.icon}
                            <span className="text-[10px] font-black uppercase tracking-wider">{sConf?.label || order.status}</span>
                          </div>
                          {readyIn && (
                            <div className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                              <Timer size={10} /> {readyIn}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-extrabold font-mono">{formatCurrency(order.totalAmount)}</p>
                          {isManualPending ? (
                            <button onClick={() => updateMutation.mutate({ id: order._id, paymentStatus: 'paid' })} className="text-[10px] font-bold text-white bg-[#C8102E] px-2 py-1 rounded shadow mt-1 cursor-pointer">Mark Paid</button>
                          ) : (
                            <span className="inline-flex text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 mt-1">
                              <CheckCircle size={10} className="mr-1" /> {order.paymentMethod}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <div className="flex items-center justify-center gap-2">
                              {nextStatus[order.status] && (
                                <button
                                  onClick={() => updateMutation.mutate({ id: order._id, status: nextStatus[order.status] })}
                                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                                    order.status === 'new' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                                    order.status === 'preparing' ? 'bg-[#F5A623] hover:bg-[#E09410] text-black' :
                                    'bg-green-600 hover:bg-green-700 text-white'
                                  }`}
                                >
                                  {actionLabels[order.status].replace(/[^\w\s]/g, '').trim()}
                                </button>
                              )}
                              {order.status === 'new' && (
                                <button
                                  onClick={() => cancelMutation.mutate({ id: order._id, reason: 'Rejected by kitchen' })}
                                  className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all border border-red-100 cursor-pointer"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Cancel Dialog */}
      <AnimatePresence>
        {cancelDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => { setCancelDialog(null); setCancelRemark(''); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                  <Ban size={16} className="text-red-500" /> Cancel Item
                </h3>
                <button onClick={() => { setCancelDialog(null); setCancelRemark(''); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-all">
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Cancelling <span className="font-black text-red-600">{cancelDialog.itemName}</span>. Add a reason (optional).
              </p>
              <textarea
                autoFocus
                rows={3}
                placeholder="e.g. Item unavailable, Customer requested, Out of stock…"
                value={cancelRemark}
                onChange={e => setCancelRemark(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-red-400 focus:bg-white resize-none transition-all placeholder:text-gray-400"
              />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => cancelItemMutation.mutate({ orderId: cancelDialog.orderId, itemId: cancelDialog.itemId, reason: cancelRemark.trim() || undefined })}
                  disabled={cancelItemMutation.isPending}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black transition-all disabled:opacity-60"
                >
                  {cancelItemMutation.isPending ? 'Cancelling…' : 'Confirm Cancel'}
                </button>
                <button
                  onClick={() => { setCancelDialog(null); setCancelRemark(''); }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm font-bold transition-all"
                >
                  Back
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
