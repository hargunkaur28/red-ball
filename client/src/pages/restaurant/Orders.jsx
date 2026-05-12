import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import socket, { connectSocket } from '../../lib/socket';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { Circle, Flame, CheckCircle, Truck } from 'lucide-react';

const statusCols = [
  { key: 'new', label: 'New', icon: <Circle size={14} className="text-red-500" />, color: 'border-red-500' },
  { key: 'preparing', label: 'Preparing', icon: <Flame size={14} className="text-amber-500" />, color: 'border-amber-500' },
  { key: 'ready', label: 'Ready', icon: <CheckCircle size={14} className="text-green-500" />, color: 'border-green-500' },
  { key: 'delivered', label: 'Delivered', icon: <Truck size={14} className="text-[#888888]" />, color: 'border-[#888888]' },
];

export default function Orders() {
  const qc = useQueryClient();

  // Initial data fetch (no polling — socket handles updates)
  const { data } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders').then(r => r.data),
  });

  // Socket.io real-time listeners
  const invalidateOrders = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['orders'] });
  }, [qc]);

  useEffect(() => {
    connectSocket();
    socket.emit('join-managers');

    const onNewOrder = ({ order }) => {
      invalidateOrders();
      toast.success(`New order from ${order?.tableId?.label || 'a table'}!`, {
        description: `${order?.items?.length || 0} item(s) • ${formatCurrency(order?.totalAmount || 0)}`,
      });
    };

    const onOrderUpdated = () => {
      invalidateOrders();
    };

    const onOrderCancelled = ({ orderId }) => {
      invalidateOrders();
      toast.error(`Order cancelled`, { description: orderId });
    };

    socket.on('order:new', onNewOrder);
    socket.on('order:updated', onOrderUpdated);
    socket.on('order:cancelled', onOrderCancelled);

    return () => {
      socket.off('order:new', onNewOrder);
      socket.off('order:updated', onOrderUpdated);
      socket.off('order:cancelled', onOrderCancelled);
    };
  }, [invalidateOrders]);

  // Status mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      invalidateOrders();
      toast.success('Order updated');
    },
  });

  const getNextStatus = (s) => ({ new: 'preparing', preparing: 'ready', ready: 'delivered' }[s]);
  const getNextLabel = (s) => ({ new: 'Accept', preparing: 'Mark Ready', ready: 'Mark Delivered' }[s]);
  const getNextStyle = (s) => ({
    new: 'bg-amber-500 hover:bg-amber-600 text-white',
    preparing: 'bg-green-600 hover:bg-green-700 text-white',
    ready: 'bg-[#111111] hover:bg-[#333333] text-white',
  }[s] || 'btn-primary');

  const orders = data?.orders || [];

  return (
    <div>
      <PageHeader
        title="Kitchen Orders"
        subtitle="Live updates via WebSocket"
        action={
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${socket.connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <span className="text-xs text-[#888888]">{socket.connected ? 'Live' : 'Reconnecting...'}</span>
          </div>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusCols.map(col => {
          const colOrders = orders.filter(o => o.status === col.key);
          return (
            <div key={col.key}>
              <div className={`flex items-center gap-2 text-sm font-medium text-[#666666] mb-3 pb-2 border-b-2 ${col.color}`}>
                {col.icon}
                <span>{col.label}</span>
                <span className="ml-auto text-xs bg-[#F0F0F0] rounded-full px-2 py-0.5">{colOrders.length}</span>
              </div>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {colOrders.map((order) => (
                    <motion.div
                      key={order._id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      className="card text-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[#111111] font-semibold">{order.orderNumber}</span>
                        <span className="text-[10px] text-[#888888]">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-[#666666]">{order.customerId?.name}</p>
                        <span className="text-[10px] text-[#888888] bg-[#F0F0F0] px-1.5 py-0.5 rounded">{order.tableId?.label}</span>
                      </div>
                      <div className="space-y-1 mb-3 border-t border-[#F0F0F0] pt-2">
                        {order.items?.map((item, j) => (
                          <div key={j} className="text-xs text-[#666666] flex justify-between">
                            <span>{item.quantity}× {item.name} <span className="text-[#A1A1AA]">({item.size})</span></span>
                            <span>{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs font-semibold text-[#111111] mb-3">
                        Total: {formatCurrency(order.totalAmount)}
                      </div>
                      {getNextStatus(order.status) && (
                        <button
                          onClick={() => updateMutation.mutate({ id: order._id, status: getNextStatus(order.status) })}
                          disabled={updateMutation.isPending}
                          className={`w-full text-xs py-2 rounded-lg font-medium transition-all ${getNextStyle(order.status)} disabled:opacity-50`}
                        >
                          {getNextLabel(order.status)}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {colOrders.length === 0 && (
                  <p className="text-center text-xs text-[#A1A1AA] py-6">No orders</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
