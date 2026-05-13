import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { Clock, ChefHat, CheckCircle, Truck, X } from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const statusConfig = {
  new: { label: 'New Orders', color: 'border-blue-400 bg-blue-50', icon: <Clock size={16} />, badge: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Preparing', color: 'border-amber-400 bg-amber-50', icon: <ChefHat size={16} />, badge: 'bg-amber-100 text-amber-700' },
  ready: { label: 'Ready', color: 'border-green-400 bg-green-50', icon: <CheckCircle size={16} />, badge: 'bg-green-100 text-green-700' },
  delivered: { label: 'Delivered', color: 'border-gray-300 bg-gray-50', icon: <Truck size={16} />, badge: 'bg-gray-100 text-gray-600' },
};

export default function RestaurantOrders() {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState('kanban');

  const { data } = useQuery({
    queryKey: ['restaurant-orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
    refetchInterval: 10000,
  });

  // Socket.io for realtime order updates
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.emit('join-managers');

    socket.on('order:new', () => {
      qc.invalidateQueries({ queryKey: ['restaurant-orders'] });
      toast.success('🔔 New order received!');
    });

    socket.on('order:updated', () => {
      qc.invalidateQueries({ queryKey: ['restaurant-orders'] });
    });

    socket.on('order:cancelled', () => {
      qc.invalidateQueries({ queryKey: ['restaurant-orders'] });
    });

    return () => socket.disconnect();
  }, [qc]);

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant-orders'] });
      toast.success('Order updated!');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => api.put(`/orders/${id}/cancel`, { reason, refund: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['restaurant-orders'] });
      toast.success('Order cancelled');
    },
  });

  const orders = data?.orders || [];
  const kanbanColumns = ['new', 'preparing', 'ready', 'delivered'];
  const nextStatus = { new: 'preparing', preparing: 'ready', ready: 'delivered' };

  return (
    <div>
      <PageHeader
        title="Kitchen Orders"
        subtitle={`${orders.filter(o => o.status === 'new').length} new • ${orders.filter(o => o.status === 'preparing').length} preparing • ${orders.filter(o => o.status === 'ready').length} ready`}
      />

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {kanbanColumns.map(status => {
          const config = statusConfig[status];
          const columnOrders = orders.filter(o => o.status === status);

          return (
            <div key={status} className={`rounded-2xl border-2 ${config.color} p-4 min-h-[400px]`}>
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {config.icon}
                  <h3 className="font-bold text-sm">{config.label}</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.badge}`}>
                  {columnOrders.length}
                </span>
              </div>

              {/* Order Cards */}
              <div className="space-y-3">
                {columnOrders.length === 0 && (
                  <p className="text-xs text-[#999] text-center py-8">No orders</p>
                )}
                {columnOrders.map((order, i) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-xl p-3 border border-[#EAEAEA] shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs text-black">{order.orderNumber}</span>
                      <span className="text-[10px] text-[#888]">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Table & Customer */}
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-[#111]">
                        📍 {order.tableId?.label || 'Takeaway'}
                      </p>
                      <p className="text-[10px] text-[#888]">{order.customerId?.name || 'Guest'}</p>
                    </div>

                    {/* Items */}
                    <div className="space-y-1 mb-3">
                      {order.items?.map((item, j) => (
                        <div key={j} className="flex justify-between text-xs">
                          <span className="text-[#444]">{item.quantity}× {item.name} {item.size ? `(${item.size})` : ''}</span>
                          <span className="text-[#888]">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between text-sm font-bold border-t border-[#EAEAEA] pt-2 mb-3">
                      <span>Total</span>
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>

                    {/* Actions */}
                    {status !== 'delivered' && (
                      <div className="flex gap-2">
                        {nextStatus[status] && (
                          <button
                            onClick={() => updateMutation.mutate({ id: order._id, status: nextStatus[status] })}
                            className="flex-1 py-2 rounded-lg text-xs font-semibold bg-black text-white hover:bg-black/80 transition-all"
                          >
                            {status === 'new' ? '✓ Accept' : status === 'preparing' ? '🍽 Mark Ready' : '🚚 Delivered'}
                          </button>
                        )}
                        {status === 'new' && (
                          <button
                            onClick={() => cancelMutation.mutate({ id: order._id, reason: 'Rejected by kitchen' })}
                            className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
