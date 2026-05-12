import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { formatCurrency, calcGST } from '../../lib/utils';
import { toast } from 'sonner';

export default function TableOrder() {
  const { tableId } = useParams();
  const { isAuthenticated, user, login, register } = useAuthStore();
  const { items, addItem, removeItem, updateQuantity, getSubtotal, getItemCount, clearCart, setTableId } = useCartStore();
  const [authTab, setAuthTab] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setTableId(tableId); }, [tableId]);

  const { data: tableData } = useQuery({ queryKey: ['table-public', tableId], queryFn: () => api.get(`/tables/${tableId}/public`).then(r => r.data) });
  const { data: menuData } = useQuery({ queryKey: ['menu'], queryFn: () => api.get('/menu').then(r => r.data) });

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authTab === 'login') await login(authForm.email, authForm.password);
      else await register(authForm);
      toast.success('Welcome!');
    } catch (err) { toast.error(err.response?.data?.message || 'Auth failed'); }
    finally { setLoading(false); }
  };

  const placeOrder = async () => {
    try {
      const orderItems = items.map(i => ({ menuItemId: i.menuItemId, name: i.name, size: i.size, quantity: i.quantity, price: i.price, kitchenNote: i.kitchenNote }));
      await api.post('/orders', { tableId, items: orderItems });
      clearCart();
      setCartOpen(false);
      toast.success('Order placed! 🎉');
    } catch (err) { toast.error('Failed to place order'); }
  };

  const gst = calcGST(getSubtotal(), 5);

  // Auth screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-[#111111] font-bold text-xl mx-auto mb-3">RB</div>
            <h1 className="text-xl font-bold text-[#111111]">Welcome to Red Ball Restaurant</h1>
            <p className="text-sm text-[#666666] mt-1">{tableData?.table?.label || 'Table'}</p>
          </div>
          <div className="card">
            <div className="flex gap-2 mb-4">
              {['login', 'signup'].map(t => (
                <button key={t} onClick={() => setAuthTab(t)} className={`flex-1 py-2 rounded-lg text-sm ${authTab === t ? 'bg-black text-white' : 'btn-ghost'}`}>{t === 'login' ? 'Login' : 'Sign Up'}</button>
              ))}
            </div>
            <form onSubmit={handleAuth} className="space-y-3">
              {authTab === 'signup' && (<><div><input className="input-field" placeholder="Name" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} required /></div>
                <div><input className="input-field" placeholder="Phone" value={authForm.phone} onChange={e => setAuthForm({...authForm, phone: e.target.value})} /></div></>)}
              <div><input type="email" className="input-field" placeholder="Email" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} required /></div>
              <div><input type="password" className="input-field" placeholder="Password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required /></div>
              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>{loading ? 'Please wait...' : authTab === 'login' ? 'Login' : 'Create Account'}</button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // Menu + ordering
  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-24">
      <div className="sticky top-0 z-30 bg-white border-b border-[#EAEAEA] px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-[#111111] font-bold text-xs">RB</div>
            <span className="text-sm font-semibold text-[#111111]">{tableData?.table?.label || 'Menu'}</span>
          </div>
          <span className="text-xs text-[#888888]">Hi, {user?.name}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {(menuData?.items || []).filter(i => i.isAvailable).map((item, idx) => (
          <motion.div key={item._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
            className="card">
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-3 h-3 rounded-sm border-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}><span className={`block w-1.5 h-1.5 rounded-full m-[1px] ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} /></span>
              <h3 className="text-[#111111] font-semibold text-sm">{item.name}</h3>
            </div>
            {item.description && <p className="text-xs text-[#888888] mb-2">{item.description}</p>}
            <div className="flex flex-wrap gap-2">
              {item.sizes?.map(s => (
                <button key={s.label} onClick={() => { addItem({ menuItemId: item._id, name: item.name, size: s.label, price: s.price }); toast.success('Added!'); }}
                  className="btn-ghost text-xs">{s.label} · {formatCurrency(s.price)} <span className="text-black ml-1">+</span></button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating cart bar */}
      {getItemCount() > 0 && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-40">
          <div className="max-w-2xl mx-auto p-4">
            <button onClick={() => setCartOpen(!cartOpen)} className="w-full btn-primary py-4 text-base flex items-center justify-between rounded-xl">
              <span>{getItemCount()} items</span>
              <span>{formatCurrency(gst.totalAmount)}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 z-50" onClick={() => setCartOpen(false)} />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#EAEAEA] rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <div className="max-w-2xl mx-auto p-4">
              <h2 className="text-lg font-bold text-[#111111] mb-4">Your Cart</h2>
              <div className="space-y-3 mb-4">
                {items.map(i => (
                  <div key={`${i.menuItemId}-${i.size}`} className="flex items-center justify-between p-3 bg-[#F7F7F7] rounded-xl border border-[#EAEAEA]">
                    <div><p className="text-[#111111] text-sm font-medium">{i.name} ({i.size})</p><p className="text-xs text-[#888888]">{formatCurrency(i.price)} each</p></div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(i.menuItemId, i.size, i.quantity - 1)} className="w-7 h-7 rounded-md bg-[#F0F0F0] text-[#111111] text-sm">−</button>
                      <span className="text-[#111111] text-sm w-6 text-center">{i.quantity}</span>
                      <button onClick={() => updateQuantity(i.menuItemId, i.size, i.quantity + 1)} className="w-7 h-7 rounded-md bg-[#F0F0F0] text-[#111111] text-sm">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 mb-4 p-3 bg-[#F7F7F7] rounded-xl border border-[#EAEAEA]">
                <div className="flex justify-between text-sm"><span className="text-[#666666]">Subtotal</span><span className="text-[#111111]">{formatCurrency(gst.amount)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[#666666]">GST (5%)</span><span className="text-[#111111]">{formatCurrency(gst.gstAmount)}</span></div>
                <div className="flex justify-between text-base font-bold border-t border-[#EAEAEA] pt-2"><span className="text-[#111111]">Total</span><span className="text-black">{formatCurrency(gst.totalAmount)}</span></div>
              </div>
              <button onClick={placeOrder} className="btn-primary w-full py-4 text-base">Place Order</button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
