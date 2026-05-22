import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Minus, Plus, ShoppingBag, X, AlertTriangle, Clock } from 'lucide-react';
import { io } from 'socket.io-client';
import api from '../../lib/axios';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000');

const inputClass = 'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/28 focus:border-[#df1526] focus:bg-white/[0.06]';

const KITCHEN_STATUS_CONFIG = {
  open:        { label: 'Kitchen Open',           color: 'border-green-500/30 bg-green-500/10 text-green-400',  dot: 'bg-green-400' },
  busy:        { label: 'High Demand — Delays Possible', color: 'border-amber-500/30 bg-amber-500/10 text-amber-400', dot: 'bg-amber-400' },
  closed:      { label: 'Kitchen Closed — Try Again Later', color: 'border-red-500/30 bg-red-500/10 text-red-400', dot: 'bg-red-500' },
  maintenance: { label: 'Kitchen Under Maintenance', color: 'border-red-500/30 bg-red-500/10 text-red-400', dot: 'bg-red-500' },
};

export default function FoodOrdering() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['menu'], queryFn: () => api.get('/menu').then(r => r.data) });
  const { data: kitchenData, refetch: refetchKitchen } = useQuery({
    queryKey: ['kitchen-status'],
    queryFn: () => api.get('/kitchen/status').then(r => r.data),
    staleTime: 30000,
  });

  const { items, addItem, updateQuantity, getItemCount, getSubtotal, clearCart } = useCartStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderType, setOrderType] = useState('pickup');
  const { user } = useAuthStore();
  const [customer, setCustomer] = useState({ 
    name: user?.name || '', 
    phone: user?.phone || '', 
    address: '', lat: '', lng: '', mapsUrl: '' 
  });
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [locationLoading, setLocationLoading] = useState(false);

  const kitchenStatus = kitchenData?.kitchenStatus || 'open';
  const kitchenClosed = kitchenStatus === 'closed' || kitchenStatus === 'maintenance';

  // Subscribe to real-time kitchen status changes
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.emit('join-kitchen-updates');
    socket.on('restaurant:kitchenStatus', ({ status }) => {
      qc.setQueryData(['kitchen-status'], (old) => ({ ...old, kitchenStatus: status }));
      if (status === 'closed') toast.error('Kitchen has closed. Orders are paused.');
      if (status === 'open') toast.success('Kitchen is now accepting orders!');
      if (status === 'busy') toast.warning('Kitchen is busy — delays possible.');
    });
    return () => socket.disconnect();
  }, [qc]);

  const useLiveLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Location is not supported on this device.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
        let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        // Reverse geocode via Nominatim (free, no API key)
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const geo = await resp.json();
          if (geo?.display_name) address = geo.display_name;
        } catch {
          // fallback to coordinates
        }

        setCustomer(prev => ({ ...prev, lat, lng, mapsUrl, address: prev.address || address }));
        setLocationLoading(false);
        toast.success('Live location attached.');
      },
      () => {
        setLocationLoading(false);
        toast.error('Could not fetch location.');
      }
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
      customerId: user?.id,
      orderType,
      deliveryAddress: orderType === 'delivery' ? customer.address : undefined,
      deliveryLocation: orderType === 'delivery' && customer.lat
        ? { lat: Number(customer.lat), lng: Number(customer.lng), address: customer.address, mapsUrl: customer.mapsUrl }
        : undefined,
      paymentMethod,
      paymentStatus: 'pending',
    }),
    onSuccess: (res) => {
      clearCart();
      setCheckoutOpen(false);
      qc.invalidateQueries({ queryKey: ['my-orders'] });
      toast.success(`${res.data.order.orderNumber} sent to restaurant.`);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not place order'),
  });

  const menuItems = (data?.items || []).filter(item => item.isAvailable);
  const kitchenCfg = KITCHEN_STATUS_CONFIG[kitchenStatus] || KITCHEN_STATUS_CONFIG.open;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#df1526]">Red Ball Academy</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl tracking-tight text-white">Order Food</h1>
          <p className="mt-2 text-sm text-white/50">Scan a table QR or skip the table for pickup and delivery</p>
        </div>

        {getItemCount() > 0 && !kitchenClosed && (
          <button onClick={() => setCheckoutOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#df1526] px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-950/25 transition hover:brightness-110">
            <ShoppingBag size={16} /> {getItemCount()} items — {formatCurrency(getSubtotal())}
          </button>
        )}
      </div>

      {/* Kitchen Status Banner */}
      {kitchenStatus !== 'open' && (
        <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${kitchenCfg.color}`}>
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${kitchenCfg.dot} ${kitchenClosed ? 'animate-none' : 'animate-pulse'}`} />
          <div>
            {kitchenClosed ? (
              <>
                <p className="font-black text-sm">Kitchen is currently closed.</p>
                <p className="text-xs opacity-70 mt-0.5">Please try again later. Menu browsing is still available.</p>
              </>
            ) : (
              <p className="font-bold text-sm">{kitchenCfg.label}</p>
            )}
          </div>
          {kitchenClosed && <AlertTriangle size={18} className="ml-auto shrink-0" />}
        </div>
      )}

      <div className="flex flex-col justify-between gap-3 rounded-[28px] border border-[#222A2A] bg-[#111515] p-6 shadow-2xl shadow-black/25 md:flex-row md:items-center">
        <div>
          <h3 className="text-sm font-black text-white">Food portal mode</h3>
          <p className="mt-1 text-xs text-white/48">Use table QR for dine-in, or continue directly for pickup/delivery.</p>
        </div>
        <a href="/table-portal" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-sm font-black text-white transition hover:bg-white/10">
          Scan Table QR
        </a>
      </div>

      {menuItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item, idx) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="rounded-[24px] border border-[#222A2A] bg-[#111515] p-5 shadow-xl shadow-black/18 transition-all hover:border-white/18"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-sm border-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                      <span className={`m-[1px] block h-1.5 w-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                    </span>
                    <h3 className="font-semibold text-white">{item.name}</h3>
                  </div>
                  <p className="line-clamp-2 text-xs text-white/45">{item.description}</p>
                </div>
                {item.image && <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />}
              </div>

              <div className="flex flex-wrap gap-2">
                {item.sizes?.map(size => (
                  <button
                    key={size.label}
                    disabled={kitchenClosed}
                    onClick={() => {
                      if (kitchenClosed) { toast.error('Kitchen is currently closed.'); return; }
                      addItem({ menuItemId: item._id, name: item.name, size: size.label, price: size.price });
                      toast.success('Added to cart');
                    }}
                    className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold text-white/72 transition hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {size.label} — {formatCurrency(size.price)} <Plus size={13} />
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-[#222A2A] bg-[#111515] py-14 text-center text-sm text-white/45 shadow-2xl shadow-black/25">
          Menu items will appear here
        </div>
      )}

      <AnimatePresence>
        {checkoutOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCheckoutOpen(false)} className="fixed inset-0 z-50 bg-black/70" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 z-50 h-screen w-[460px] max-w-full overflow-y-auto border-l border-white/10 bg-[#0E1212] p-4 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-black text-white">Direct Order</h2>
                <button onClick={() => setCheckoutOpen(false)} className="rounded-full border border-white/10 bg-white/[0.06] p-2 text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Kitchen busy warning inside checkout */}
              {kitchenStatus === 'busy' && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-400 text-xs font-bold">
                  <Clock size={14} />
                  High demand — delays possible.
                </div>
              )}

              <div className="mb-5 space-y-3">
                {items.map(item => (
                  <div key={`${item.menuItemId}-${item.size}`} className="flex justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.name}</p>
                      <p className="text-xs text-white/45">{item.size} — {formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="rounded-full border border-white/10 p-1 text-white" onClick={() => updateQuantity(item.menuItemId, item.size, item.quantity - 1)}>
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold text-white">{item.quantity}</span>
                      <button className="rounded-full border border-white/10 p-1 text-white" onClick={() => updateQuantity(item.menuItemId, item.size, item.quantity + 1)}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-5 grid grid-cols-3 gap-2">
                {[
                  { value: 'pickup', label: 'Pickup' },
                  { value: 'delivery', label: 'Delivery' },
                  { value: 'table', label: 'Table' },
                ].map(type => (
                  <button
                    key={type.value}
                    onClick={() => setOrderType(type.value)}
                    className={`rounded-xl border py-2 text-sm font-bold transition ${orderType === type.value ? 'border-[#df1526] bg-[#df1526] text-white' : 'border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.07]'}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <input className={inputClass} placeholder="Name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                <input className={inputClass} placeholder="Phone" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
                {orderType === 'delivery' && (
                  <div className="space-y-2">
                    <textarea className={`${inputClass} min-h-[90px]`} placeholder="Delivery address" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} />
                    <button type="button" onClick={useLiveLocation} disabled={locationLoading} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                      <MapPin size={15} />
                      {locationLoading ? 'Fetching location...' : 'Fetch live location'}
                    </button>
                    {customer.mapsUrl && (
                      <a href={customer.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold">
                        <MapPin size={12} /> View on Google Maps
                      </a>
                    )}
                  </div>
                )}
                <select className="w-full rounded-2xl border border-white/10 bg-[#151A1A] px-4 py-3 text-white outline-none focus:border-[#df1526]" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="upi">UPI at counter</option>
                </select>
              </div>

              <div className="my-5 space-y-2 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-sm text-white">
                <div className="flex justify-between font-bold"><span>Total Amount</span><span>{formatCurrency(getSubtotal())}</span></div>
              </div>

              <button disabled={orderMutation.isPending || items.length === 0 || kitchenClosed} onClick={() => orderMutation.mutate()} className="flex w-full justify-center rounded-full bg-[#df1526] py-3 font-black text-white transition hover:brightness-110 disabled:opacity-50">
                {orderMutation.isPending ? 'Sending...' : kitchenClosed ? 'Kitchen Closed' : 'Send Order'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
