import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, ShoppingBag, Utensils, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import socket, { connectSocket } from '../../lib/socket';
import { formatCurrency } from '../../lib/utils';

// Format standard dates
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Countdown Hook
function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(0);
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      setTimeLeft(difference);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

// Item Status Badge
function ItemBadge({ status }) {
  const configs = {
    pending: { color: 'border-gray-500/30 bg-gray-500/10 text-gray-400', label: 'Pending', icon: <Clock size={12} /> },
    preparing: { color: 'border-orange-500/30 bg-orange-500/10 text-orange-400', label: 'Preparing', icon: <Utensils size={12} className="animate-pulse" /> },
    ready: { color: 'border-blue-500/30 bg-blue-500/10 text-blue-400', label: 'Ready', icon: <CheckCircle size={12} /> },
    delivered: { color: 'border-green-500/30 bg-green-500/10 text-green-400', label: 'Delivered', icon: <CheckCircle size={12} /> },
    cancelled: { color: 'border-red-500/30 bg-red-500/10 text-red-400', label: 'Cancelled', icon: <XCircle size={12} /> },
    refunded: { color: 'border-purple-500/30 bg-purple-500/10 text-purple-400', label: 'Refunded', icon: <RefreshCw size={12} /> },
  };
  
  const config = configs[status] || configs.pending;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-black uppercase tracking-wider ${config.color}`}>
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

// Render individual item
function OrderItem({ item, orderStatus, estimatedPrepMinutes, estimatedReadyAt }) {
  // Compute aggregate item status based on order status if not cancelled/refunded
  let displayStatus = item.status;
  if (displayStatus !== 'cancelled' && displayStatus !== 'refunded') {
    if (orderStatus === 'new') displayStatus = 'pending';
    else if (orderStatus === 'preparing') displayStatus = 'preparing';
    else if (orderStatus === 'ready') displayStatus = 'ready';
    else if (orderStatus === 'delivered') displayStatus = 'delivered';
  }

  const timeLeftMs = useCountdown(displayStatus === 'preparing' ? estimatedReadyAt : null);
  
  let prepText = null;
  if (displayStatus === 'preparing' && estimatedReadyAt) {
    if (timeLeftMs > 0) {
      const mins = Math.ceil(timeLeftMs / 60000);
      prepText = `Ready in ${mins} min${mins !== 1 ? 's' : ''}`;
    } else {
      prepText = 'Delayed';
    }
  }

  let refundText = null;
  if (displayStatus === 'cancelled' || displayStatus === 'refunded') {
    if (item.refundStatus === 'pending') {
      refundText = 'Refund Pending';
    } else if (item.refundStatus === 'refunded') {
      refundText = 'Refund Completed';
    }
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-[#222A2A] rounded-2xl gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-white/5 flex items-center justify-center shrink-0">
          <span className="text-xl">🍲</span>
        </div>
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            {item.name}
            <span className="text-white/40 text-xs font-medium">×{item.quantity}</span>
          </h4>
          <p className="text-xs text-white/50 mt-1">{formatCurrency(item.price * item.quantity)}</p>
        </div>
      </div>
      
      <div className="flex flex-col sm:items-end gap-2">
        <ItemBadge status={displayStatus} />
        {prepText && (
          <p className={`text-xs font-semibold ${prepText === 'Delayed' ? 'text-red-400' : 'text-orange-400'}`}>
            {prepText}
          </p>
        )}
        {refundText && (
          <p className={`text-xs font-semibold ${item.refundStatus === 'refunded' ? 'text-purple-400' : 'text-red-400'}`}>
            {refundText}
          </p>
        )}
      </div>
    </div>
  );
}

// Render entire order block
function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  
  // Aggregate order status logically
  const allCancelled = order.items.every(i => i.status === 'cancelled' || i.status === 'refunded');
  const displayStatus = allCancelled ? 'cancelled' : order.status;

  const statusColors = {
    new: 'text-gray-400',
    preparing: 'text-orange-400',
    ready: 'text-blue-400',
    delivered: 'text-green-400',
    cancelled: 'text-red-400',
  };

  const statusText = {
    new: 'Order Received',
    preparing: 'Preparing',
    ready: 'Ready for Pickup/Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };

  return (
    <div className="bg-[#111515] border border-[#222A2A] rounded-[28px] overflow-hidden shadow-xl">
      {/* Header */}
      <div 
        className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <ShoppingBag className={statusColors[displayStatus] || 'text-white/50'} size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-white">{order.orderNumber}</h3>
              <span className={`text-xs font-bold uppercase tracking-wider ${statusColors[displayStatus] || 'text-white/50'}`}>
                {statusText[displayStatus] || displayStatus}
              </span>
            </div>
            <p className="text-xs text-white/50 mt-1">{formatDateTime(order.createdAt)} • {order.items.length} items</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
          <span className="text-lg font-black text-white">{formatCurrency(order.totalAmount)}</span>
          <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 transition-colors">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 sm:px-6 sm:pb-6 border-t border-white/5 pt-5 space-y-4">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Order Items</h4>
              <div className="space-y-3">
                {order.items.map(item => (
                  <OrderItem 
                    key={item._id} 
                    item={item} 
                    orderStatus={order.status} 
                    estimatedPrepMinutes={order.estimatedPrepMinutes}
                    estimatedReadyAt={order.estimatedReadyAt}
                  />
                ))}
              </div>

              {/* Order Meta info */}
              <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">Payment Status</p>
                  <p className="text-sm font-semibold text-white capitalize">{order.paymentStatus}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-1">Order Type</p>
                  <p className="text-sm font-semibold text-white capitalize">{order.orderType}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrderHistory() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/my-orders').then(r => r.data),
  });

  const orders = data?.orders || [];

  useEffect(() => {
    connectSocket();

    const activeOrders = orders.filter(o => ['new', 'preparing'].includes(o.status));
    if (activeOrders.length > 0 && socket.connected) {
      activeOrders.forEach(o => socket.emit('join-order', o._id));
    }

    const handleOrderUpdated = (payload) => {
      qc.setQueryData(['my-orders'], (old) => {
        if (!old) return old;
        return {
          ...old,
          orders: old.orders.map(o => 
            o._id === payload.orderId 
              ? { ...o, estimatedPrepMinutes: payload.estimatedPrepMinutes, estimatedReadyAt: payload.estimatedReadyAt } 
              : o
          )
        };
      });
    };

    const handleOrderStatus = (payload) => {
      qc.setQueryData(['my-orders'], (old) => {
        if (!old) return old;
        return {
          ...old,
          orders: old.orders.map(o => 
            o._id === payload.orderId ? { ...o, status: payload.status } : o
          )
        };
      });
    };

    const handleItemCancelled = (payload) => {
      qc.setQueryData(['my-orders'], (old) => {
        if (!old) return old;
        return {
          ...old,
          orders: old.orders.map(o => o._id === payload.orderId ? payload.order : o)
        };
      });
    };

    const handleItemRefunded = (payload) => {
      qc.setQueryData(['my-orders'], (old) => {
        if (!old) return old;
        return {
          ...old,
          orders: old.orders.map(o => o._id === payload.orderId ? payload.order : o)
        };
      });
    };

    socket.on('restaurant:orderUpdated', handleOrderUpdated);
    socket.on('order:status', handleOrderStatus);
    socket.on('restaurant:itemCancelled', handleItemCancelled);
    socket.on('restaurant:itemRefunded', handleItemRefunded);

    return () => {
      socket.off('restaurant:orderUpdated', handleOrderUpdated);
      socket.off('order:status', handleOrderStatus);
      socket.off('restaurant:itemCancelled', handleItemCancelled);
      socket.off('restaurant:itemRefunded', handleItemRefunded);
    };
  }, [orders, qc]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#df1526]">Red Ball Academy</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl tracking-tight text-white">Order History</h1>
        <p className="mt-2 text-sm text-white/50">Live tracking for your food orders</p>
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <RefreshCw className="animate-spin text-white/20 mb-4" size={32} />
            <p className="text-white/40 text-sm">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-[#111515] border border-[#222A2A] rounded-[32px] p-10 sm:p-16 text-center shadow-2xl flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner shadow-white/5">
              <ShoppingBag className="text-[#F5A623]" size={32} />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">No orders yet</h2>
            <p className="text-sm text-white/50 max-w-md mb-8">
              You haven't placed any food orders yet. Explore our restaurant menu to get started.
            </p>
            <Link 
              to="/table-portal"
              className="px-8 py-3.5 rounded-full bg-[#C8102E] text-white text-sm font-semibold transition-all hover:bg-[#8B0B1E] hover:scale-105 shadow-xl shadow-red-950/20"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <OrderCard key={order._id || order.orderNumber} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
