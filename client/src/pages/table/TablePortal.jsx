import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import { QrCode, Camera, ArrowRight, Sparkles, AlertCircle, Utensils, MapPin, Minus, Plus, X, ShoppingBag, Clock } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { formatCurrency, calcGST } from '../../lib/utils';
import { toast } from 'sonner';

export default function TablePortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scanning, setScanning] = useState(false);
  const { items, addItem, updateQuantity, getSubtotal, clearCart } = useCartStore();
  const { user, isAuthenticated, googleAuth } = useAuthStore();
  const googleButtonRef = useRef(null);
  
  const [orderType, setOrderType] = useState('pickup');
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', lat: '', lng: '' });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedTable, setSelectedTable] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ 
    queryKey: ['tables-public-list'], 
    queryFn: () => api.get('/tables/public-list').then(r => r.data) 
  });

  const tables = data?.tables || [];

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return;

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential) return;
          try {
            await googleAuth(credential);
            toast.success('Signed in with Google.');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Google sign-in failed');
          }
        },
      });
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        width: googleButtonRef.current.offsetWidth || 320,
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    const script = existing || document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    if (!existing) document.body.appendChild(script);
  }, [googleAuth]);

  const { data: menuData } = useQuery({ 
    queryKey: ['menu'], 
    queryFn: () => api.get('/menu').then(r => r.data) 
  });

  const menuItems = menuData?.items || [];

  const { data: ordersData } = useQuery({ 
    queryKey: ['my-orders'], 
    queryFn: () => api.get('/orders/my-orders').then(r => r.data),
    enabled: ordersOpen,
    refetchInterval: ordersOpen ? 5000 : false,
  });



  useEffect(() => {
    import('../../lib/socket').then(({ default: socket, connectSocket }) => {
      connectSocket();
      const refresh = () => qc.invalidateQueries({ queryKey: ['tables-public-list'] });
      socket.on('tables:updated', refresh);
      return () => {
        socket.off('tables:updated', refresh);
      };
    });
  }, [qc]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const itemId = params.get('itemId');
    const size = params.get('size');
    
    if (itemId && size) {
      api.get(`/menu/${itemId}`).then(res => {
        const item = res.data.item || res.data;
        if (item && item.sizes) {
          const sizeOption = item.sizes.find(s => s.label === size);
          if (sizeOption) {
            addItem({
              menuItemId: item._id,
              name: item.name,
              size: size,
              price: sizeOption.price,
              quantity: 1,
            });
            toast.success(`Added ${item.name} to cart`);
          }
        } else {
          console.error('Menu item or sizes not found in response');
        }
      }).catch(err => {
        console.error('Failed to fetch menu item:', err);
      });
    }
  }, [location.search, addItem]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setCustomer(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || '',
      }));
    }
  }, [isAuthenticated, user]);

  const useLiveLocation = () => {
    if (navigator.geolocation) {
      const loadingToast = toast.loading('Fetching location name...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
            headers: {
              'User-Agent': 'RedBallCricketAcademy/1.0'
            }
          })
            .then(res => res.json())
            .then(data => {
              toast.dismiss(loadingToast);
              const addressName = data.display_name || "Unknown Location";
              setCustomer(prev => ({
                ...prev,
                lat: lat.toString(),
                lng: lng.toString(),
                address: `${addressName} (${lat.toFixed(4)}, ${lng.toFixed(4)})`
              }));
              toast.success('Location fetched successfully!');
            })
            .catch(err => {
              toast.dismiss(loadingToast);
              console.error('Reverse geocoding error:', err);
              setCustomer(prev => ({
                ...prev,
                lat: lat.toString(),
                lng: lng.toString(),
                address: `Live location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
              }));
              toast.success('Coordinates fetched (could not resolve name).');
            });
        },
        () => {
          toast.dismiss(loadingToast);
          toast.error('Failed to get coordinates. Please enter manually.');
        }
      );
    } else {
      toast.error('Geolocation not supported.');
    }
  };

  const handleSimulatedScan = (tableId) => {
    setScanning(true);
    setTimeout(() => {
      navigate(`/table/${tableId}`);
    }, 1200);
  };

  const handleSubmitOrder = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty.');
      return;
    }
    
    if (paymentMethod === 'razorpay') {
      if (!scriptLoaded || !window.Razorpay) {
        toast.error('Razorpay SDK failed to load. Please refresh.');
        return;
      }
      
      try {
        // 1. Create order on backend to get razorpayOrderId
        const orderRes = await api.post('/orders/create-razorpay-order', {
          amount: getSubtotal(),
        });
        
        const { orderId, amount, currency, keyId } = orderRes.data;
        
        // 2. Open Razorpay Modal
        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          name: 'Red Ball Sports Club',
          description: 'Food Order Payment',
          order_id: orderId,
          handler: async (response) => {
            // Payment successful! Now send the actual order!
            try {
              const res = await api.post('/orders/direct', {
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
                paymentStatus: 'paid', // Mark as paid!
                tableId: orderType === 'table' ? selectedTable : undefined,
                customerId: user?._id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });
              
              clearCart();
              toast.success(`${res.data.order.orderNumber} sent to restaurant.`);
              if (orderType === 'table' && selectedTable) {
                navigate(`/table/${selectedTable}`);
              }
            } catch (error) {
              toast.error('Failed to record order after payment. Please contact support.');
            }
          },
          prefill: {
            name: customer.name || 'Guest',
            contact: customer.phone || '',
          },
          theme: {
            color: '#C8102E',
          },
        };
        
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          toast.error('Payment failed. Try again or pay using cash.');
        });
        rzp.open();
        
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to initialize payment');
      }
      return; // Stop here for razorpay!
    }
    
    // Fallback for Cash/UPI
    try {
      const res = await api.post('/orders/direct', {
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
        paymentStatus: 'pending',
        tableId: orderType === 'table' ? selectedTable : undefined,
        customerId: user?._id,
      });
      
      clearCart();
      toast.success(`${res.data.order.orderNumber} sent to restaurant.`);
      if (orderType === 'table' && selectedTable) {
        navigate(`/table/${selectedTable}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not place order');
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Background Lighting decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C8102E]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#F5A623]/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between z-10 mb-12 px-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#C8102E] text-white rounded-2xl flex items-center justify-center font-black text-xl tracking-tighter shadow-lg">
            RB
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-wide leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              RED BALL SPORTS CLUB
            </h1>
            <p className="text-xs text-[#F5A623] font-bold tracking-widest uppercase mt-0.5">
              WHERE GREAT FOOD MEETS GREAT GAMES
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setOrdersOpen(true)} 
            className="p-2 sm:px-4 sm:py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] text-[#F5A623] text-[10px] sm:text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all border border-white/5 uppercase tracking-wider relative"
          >
            <Clock size={16} />
            <span className="hidden sm:inline">My Orders</span>
          </button>

          <button 
            onClick={() => setCartOpen(true)} 
            className="px-4 py-2 rounded-xl bg-[#C8102E] hover:bg-[#A00D24] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all border border-white/10"
          >
            <ShoppingBag size={16} />
            <span>Cart ({items.length})</span>
          </button>
          
          <button onClick={() => navigate('/')} className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold transition-all">
            ← Back Home
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-4 z-10 grow my-auto py-8">
        
        {/* Hero Section */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F5A623]/10 border border-[#F5A623]/20 text-[#F5A623] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles size={14} /> Premium Athlete Hub
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-wide text-white mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            FEATURED RECOVERY ITEMS
          </h2>
          <p className="text-gray-400 text-xs md:text-sm max-w-2xl leading-relaxed">
            Handcrafted inside the Red Ball Kitchen using premium recovery-focused ingredients mapped for rapid muscle refuel and hydration.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {['All', ...new Set(menuItems.map(item => item.category))].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-[#F5A623] text-black border-[#F5A623]' 
                  : 'bg-[#1A1A1A] text-gray-400 border-white/5 hover:bg-[#252525] hover:text-white'
              } border`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {menuItems
            .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
            .map(item => {
                  const inCart = items.find(i => i.menuItemId === item._id && (i.size === 'Regular' || i.size === item.sizes?.[0]?.label));
                  const qty = inCart ? inCart.quantity : 0;
                  const price = item.sizes?.[0]?.price || item.price || 249;
                  const sizeLabel = item.sizes?.[0]?.label || 'Regular';

                  return (
                    <motion.div 
                      key={item._id}
                      whileHover={{ y: -6 }}
                      transition={{ duration: 0.2 }}
                      className={`bg-[#161616] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between group transition-all duration-300 hover:border-white/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${
                        !item.isAvailable ? 'opacity-60 grayscale' : ''
                      }`}
                    >
                      {/* Clickable Area */}
                      <div className="flex-1 flex flex-col">
                        {/* Immersive Image Header */}
                        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#161616] to-[#2D1215]">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#161616] via-black/20 to-transparent" />

                          {/* Top Badges */}
                          <div className="absolute top-3 inset-x-3 flex items-start justify-between pointer-events-none">
                            <span className="px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-white text-[10px] font-black tracking-widest uppercase border border-white/10">
                              {item.category || 'Food'}
                            </span>
                            {item.chefRecommended && (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F5A623] text-black text-[10px] font-extrabold shadow-lg">
                                Choice
                              </span>
                            )}
                          </div>

                          {/* Veg/Non-Veg Tag */}
                          <div className="absolute top-12 left-3 flex flex-wrap gap-1">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider text-white uppercase ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}>
                              {item.isVeg ? 'Veg' : 'Non-Veg'}
                            </span>
                          </div>

                          {/* Out of stock overlay */}
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-10">
                              <span className="px-4 py-1.5 bg-red-600 text-white text-xs font-black tracking-widest uppercase rounded-full">
                                Out of Stock
                              </span>
                            </div>
                          )}

                          {/* Price Tag */}
                          <div className="absolute bottom-3 right-3 px-3 py-1 bg-[#C8102E] text-white rounded-xl font-bold text-sm shadow-xl font-mono">
                            {formatCurrency(price)}
                          </div>
                        </div>

                        {/* Content Details Area */}
                        <div className="p-4 flex flex-col justify-between grow">
                          <div>
                            {/* Nutrition stats strip */}
                            {(item.protein || item.calories) && (
                              <div className="text-[#F5A623] font-bold text-xs tracking-wider mb-2 flex items-center gap-2">
                                {item.protein && <span>⚡ {item.protein}g Protein</span>}
                                {item.protein && item.calories && <span>•</span>}
                                {item.calories && <span>{item.calories} kcal</span>}
                              </div>
                            )}

                            <h3 className="text-sm sm:text-lg font-bold text-white tracking-wide mb-1 line-clamp-1 group-hover:text-[#F5A623] transition-colors">
                              {item.name}
                            </h3>

                            <p className="text-gray-200 text-xs leading-relaxed mb-3 min-h-[32px]">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quantity & CTA Action Bar */}
                      <div className="p-4 pt-0">
                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <div className="flex items-center gap-1 text-[11px] text-gray-500">
                            <span>{item.preparationTime || 10} min prep</span>
                          </div>

                          {item.isAvailable && (
                            <div>
                              {qty > 0 ? (
                                <div className="flex items-center gap-2 bg-black rounded-full p-1 border border-white/10 shadow-lg">
                                  <button 
                                    onClick={() => updateQuantity(item._id, sizeLabel, qty - 1)}
                                    className="w-6 h-6 rounded-full bg-[#222] text-white hover:bg-[#333] flex items-center justify-center font-bold text-xs"
                                  >
                                    −
                                  </button>
                                  <span className="text-xs font-bold text-white min-w-[14px] text-center">{qty}</span>
                                  <button 
                                    onClick={() => updateQuantity(item._id, sizeLabel, qty + 1)}
                                    className="w-6 h-6 rounded-full bg-[#C8102E] text-white hover:bg-[#A60D25] flex items-center justify-center font-bold text-xs"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => {
                                    addItem({ menuItemId: item._id, name: item.name, size: sizeLabel, price: price, quantity: 1 });
                                    toast.success(`Added ${item.name} to cart`);
                                  }}
                                  className="px-4 py-1.5 bg-[#C8102E] hover:bg-[#A60D25] text-white text-xs font-black tracking-widest uppercase rounded-full transition-colors"
                                >
                                  ADD +
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {menuItems.length === 0 && (
                  <div className="text-sm text-white/40 text-center py-4 col-span-full">No menu items found.</div>
                )}
              </div>
      </main>

      {/* Cart Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#161616] border-l border-white/10 z-50 transform transition-transform duration-300 ${cartOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Your Cart</h3>
          <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Cart Items */}
          <div className="space-y-3 mb-5">
            {items.map(item => (
              <div key={`${item.menuItemId}-${item.size}`} className="rounded-xl border border-white/10 p-3 flex justify-between gap-3 bg-black/20">
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-white/60">{item.size} · {formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:text-[#C8102E]" onClick={() => updateQuantity(item.menuItemId, item.size, item.quantity - 1)}><Minus size={14} /></button>
                  <span className="text-sm font-bold">{item.quantity}</span>
                  <button className="p-1 hover:text-[#C8102E]" onClick={() => updateQuantity(item.menuItemId, item.size, item.quantity + 1)}><Plus size={14} /></button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-sm text-white/40 text-center py-4">No items in cart.</div>
            )}
          </div>

          {items.length > 0 && (
            <>
              {/* Order Type Tabs */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { value: 'pickup', label: 'Pickup' },
                  { value: 'delivery', label: 'Delivery' },
                  { value: 'table', label: 'Table' },
                ].map(type => (
                  <button key={type.value} onClick={() => setOrderType(type.value)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${orderType === type.value ? 'bg-[#C8102E] text-white' : 'bg-white/5 hover:bg-white/10 text-white/70'}`}>
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                {!isAuthenticated && (
                  <div className="mb-4">
                    <p className="text-xs text-white/50 mb-2 text-center">Sign in for a faster checkout</p>
                    
                    {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                      <div ref={googleButtonRef} className="w-full flex justify-center" />
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => toast.info('Google sign-in is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.')}
                        className="w-full flex items-center justify-center gap-3 bg-white text-black font-medium py-2.5 px-4 rounded-xl hover:bg-white/90 transition-colors"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.14-4.53z" fill="#EA4335"/>
                        </svg>
                        Sign in with Google
                      </button>
                    )}

                    <div className="relative flex items-center justify-center my-4">
                      <div className="border-t border-white/5 w-full"></div>
                      <span className="bg-[#161616] px-3 text-xs text-white/30 absolute">or continue as guest</span>
                    </div>
                  </div>
                )}
                
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#C8102E] outline-none" placeholder="Name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} />
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#C8102E] outline-none" placeholder="Phone" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} />
                
                {orderType === 'delivery' && (
                  <div className="space-y-2">
                    <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#C8102E] outline-none min-h-[80px]" placeholder="Delivery address" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} />
                    <button type="button" onClick={useLiveLocation} className="flex items-center gap-2 text-xs text-[#F5A623] hover:text-[#C8102E] transition-colors"><MapPin size={14} /> Fetch live location</button>
                  </div>
                )}

                {orderType === 'table' && (
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#C8102E]" value={selectedTable} onChange={e => setSelectedTable(e.target.value)}>
                    <option value="" className="bg-[#161616]">Select Table</option>
                    {tables.map(table => (
                      <option key={table._id} value={table._id} className="bg-[#161616]">
                        {table.label} ({table.section || 'Indoor'})
                      </option>
                    ))}
                  </select>
                )}

                <select className="w-full bg-white/10 border border-[#F5A623]/40 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#F5A623] shadow-[0_0_15px_rgba(245,166,35,0.15)] transition-all" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="cash" className="bg-[#161616]">Cash / Pay at counter</option>
                  <option value="razorpay" className="bg-[#161616]">Pay Online (Razorpay)</option>
                </select>
              </div>

              {/* Totals */}
              <div className="rounded-xl bg-black/40 border border-white/10 p-4 my-5 space-y-2 text-sm">
                <div className="flex justify-between font-bold text-[#F5A623]"><span>Total Amount</span><span>{formatCurrency(getSubtotal())}</span></div>
              </div>

              {/* Submit Button */}
              <button onClick={handleSubmitOrder} className="w-full bg-[#C8102E] hover:bg-[#A60D25] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed" disabled={items.length === 0 || !customer.name || !customer.phone || (orderType === 'table' && !selectedTable)}>
                Send Order
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live Order Status Tracking Drawer */}
      <AnimatePresence>
        {ordersOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" 
              onClick={() => setOrdersOpen(false)} 
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#161616] rounded-t-3xl max-h-[88vh] overflow-y-auto shadow-2xl border-t border-white/10"
            >
              <div className="max-w-xl mx-auto p-6 md:p-8 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="text-[#F5A623]" size={22} />
                    <h2 className="text-xl font-extrabold tracking-wide text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      LIVE TABLE ORDERS & STATUS
                    </h2>
                  </div>
                  <button onClick={() => setOrdersOpen(false)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-400">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 mb-4">
                  {!ordersData?.orders || ordersData.orders.length === 0 ? (
                    <div className="text-center py-10 bg-black/30 rounded-2xl border border-white/5 text-gray-400 text-xs font-bold">
                      No orders placed yet. Place your first order from the menu!
                    </div>
                  ) : (
                    ordersData.orders.map(order => (
                      <div key={order._id} className="p-4 bg-black/50 rounded-2xl border border-white/10 space-y-3 text-left">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                          <div>
                            <span className="text-xs font-mono text-gray-400">Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}</span>
                            <span className="text-[10px] text-gray-500 ml-2">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            order.status === 'delivered' ? 'bg-green-950 text-green-400 border border-green-500/30' :
                            order.status === 'served' ? 'bg-blue-950 text-blue-400 border border-blue-500/30' :
                            order.status === 'preparing' ? 'bg-amber-950 text-amber-400 border border-amber-500/30 font-bold animate-pulse' :
                            order.status === 'cancelled' ? 'bg-red-950 text-red-400 border border-red-500/30' :
                            'bg-gray-800 text-gray-300 border border-white/10'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
                          {order.items.map(item => (
                            <div key={item._id} className="flex justify-between text-xs font-bold text-gray-200">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="text-[#F5A623] font-mono">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between border-t border-white/5 pt-2 text-xs font-bold">
                          <span className="text-gray-400">Payment: <span className="uppercase text-white">{order.paymentMethod} ({order.paymentStatus})</span></span>
                          <span className="text-[#C8102E] font-mono">{formatCurrency(order.totalAmount)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer info */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-gray-600 border-t border-white/5 pt-6 z-10">
        Red Ball Cricket Academy © {new Date().getFullYear()} • Secure Digital Table Ordering System
      </footer>
    </div>
  );
}
