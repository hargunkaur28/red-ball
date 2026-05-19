import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import useCartStore from '../../store/cartStore';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency, calcGST } from '../../lib/utils';
import { toast } from 'sonner';

export default function FoodOrdering() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useQuery({ queryKey: ['menu'], queryFn: () => api.get('/menu').then(r => r.data) });
  const { items, addItem, updateQuantity, getItemCount, getSubtotal, clearCart } = useCartStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderType, setOrderType] = useState('pickup');
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', lat: '', lng: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');


  const addMenuItem = (item, size) => {
    addItem({
      menuItemId: item._id,
      name: item.name,
      size: size.label,
      price: size.price,
    });
    toast.success('Added to cart');
  };

  const useLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location is not supported on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomer(prev => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: prev.address || `Live location: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        }));
        toast.success('Live location attached.');
      },
      () => toast.error('Could not fetch location.')
    );
  };

  const orderMutation = useMutation({
    mutationFn: () => api.post('/orders/direct', {
      items: items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        kitchenNote: item.kitchenNote,
      })),
      customerName: customer.name || 'Guest',
      customerPhone: customer.phone,
      orderType,
      deliveryAddress: orderType === 'delivery' ? customer.address : undefined,
      deliveryLocation: orderType === 'delivery' && customer.lat ? { lat: Number(customer.lat), lng: Number(customer.lng) } : undefined,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
      specialInstructions: orderType === 'delivery' ? `Delivery address: ${customer.address}` : undefined,
    }),
    onSuccess: (res) => {
      clearCart();
      setCheckoutOpen(false);
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      toast.success(`${res.data.order.orderNumber} sent to restaurant.`);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not place order'),
  });

  return (
    <div>
      <PageHeader
        title="Order Food"
        subtitle="Scan a table QR or skip the table for pickup and delivery"
        action={getItemCount() > 0 && (
          <button onClick={() => setCheckoutOpen(true)} className="btn-primary">
            <ShoppingBag size={16} /> {getItemCount()} items · {formatCurrency(getSubtotal())}
          </button>
        )}
      />

      <div className="card mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#111]">Food portal mode</h3>
          <p className="text-xs text-[#666]">Use table QR for dine-in, or continue directly for pickup/delivery.</p>
        </div>
        <a href="/table-portal" className="btn-ghost">Scan Table QR</a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data?.items || []).filter(i => i.isAvailable).map((item, idx) => (
          <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
            className="card hover:border-[#EAEAEA] transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-3 h-3 rounded-sm border-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                    <span className={`block w-1.5 h-1.5 rounded-full m-[1px] ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                  </span>
                  <h3 className="text-[#111111] font-semibold">{item.name}</h3>
                </div>
                <p className="text-xs text-[#888888] line-clamp-2">{item.description}</p>
              </div>
              {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />}
            </div>
            <div className="flex flex-wrap gap-2">
              {item.sizes?.map(size => (
                <button key={size.label} onClick={() => navigate(`/table-portal?itemId=${item._id}&size=${size.label}`)}
                  className="btn-ghost text-xs flex items-center gap-1 hover:border-black/20">
                  {size.label} · {formatCurrency(size.price)} <Plus size={13} />
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {(!data?.items || data.items.length === 0) && (
        <div className="card text-center py-12 text-[#888888]">Menu items will appear here</div>
      )}

      <AnimatePresence>
        {checkoutOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCheckoutOpen(false)} className="fixed inset-0 bg-black/50 z-50" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-screen w-[460px] max-w-full bg-white z-50 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-[#111]">Direct Order</h2>
                <button onClick={() => setCheckoutOpen(false)} className="btn-ghost p-2"><X size={18} /></button>
              </div>

              <div className="space-y-3 mb-5">
                {items.map(item => (
                  <div key={`${item.menuItemId}-${item.size}`} className="rounded-xl border border-[#EAEAEA] p-3 flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#111]">{item.name}</p>
                      <p className="text-xs text-[#666]">{item.size} · {formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="btn-ghost p-1" onClick={() => updateQuantity(item.menuItemId, item.size, item.quantity - 1)}><Minus size={14} /></button>
                      <span className="text-sm font-bold">{item.quantity}</span>
                      <button className="btn-ghost p-1" onClick={() => updateQuantity(item.menuItemId, item.size, item.quantity + 1)}><Plus size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { value: 'pickup', label: 'Pickup' },
                  { value: 'delivery', label: 'Delivery' },
                  { value: 'table', label: 'Table' },
                ].map(type => (
                  <button key={type.value} onClick={() => setOrderType(type.value)}
                    className={`py-2 rounded-lg text-sm font-medium ${orderType === type.value ? 'bg-black text-white' : 'btn-ghost'}`}>
                    {type.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <input className="input-field" placeholder="Name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                <input className="input-field" placeholder="Phone" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
                {orderType === 'delivery' && (
                  <div className="space-y-2">
                    <textarea className="input-field min-h-[90px]" placeholder="Delivery address" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} />
                    <button type="button" onClick={useLiveLocation} className="btn-ghost text-sm gap-2"><MapPin size={15} /> Fetch live location</button>
                  </div>
                )}
                <select className="input-field bg-white" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash / Pay at counter</option>
                  <option value="upi">UPI at counter</option>
                </select>
              </div>

              <div className="rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] p-4 my-5 space-y-2 text-sm">
                <div className="flex justify-between font-bold"><span>Total Amount</span><span>{formatCurrency(getSubtotal())}</span></div>
              </div>

              <button disabled={orderMutation.isPending || items.length === 0} onClick={() => orderMutation.mutate()} className="btn-primary w-full py-3 justify-center">
                {orderMutation.isPending ? 'Sending...' : 'Send Order'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
