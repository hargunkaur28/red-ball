import { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Sparkles, User, Mail, Phone, Crown, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { formatCurrency } from '../lib/utils';
import useAuthStore from '../store/authStore';
import { queryClient } from '../lib/queryClient';

export default function MembershipPortal({ embedded = false }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { user, isAuthenticated, checkAuth, googleAuth } = useAuthStore();

  const [details, setDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [selectedSport, setSelectedSport] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const googleButtonRef = useCallback((node) => {
    if (!node) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !node) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential) return;
          try {
            await googleAuth(credential);
            toast.success('Signed in with Google.');
            if (!embedded) {
              navigate('/user/buy-memberships');
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Google sign-in failed');
          }
        },
      });
      node.innerHTML = '';
      window.google.accounts.id.renderButton(node, {
        theme: 'filled_black',
        size: 'large',
        type: 'standard',
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener('load', renderGoogleButton);
      } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderGoogleButton;
        document.body.appendChild(script);
      }
    }
  }, [googleAuth]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setDetails({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['public-membership-plans'],
    queryFn: () => api.get('/plans').then((r) => r.data),
  });

  const activePlans = useMemo(() => {
    return (plansData?.plans || []).filter(p => ['1 Month', '3 Months', '6 Months', '1 Year'].includes(p.duration));
  }, [plansData]);

  // Group plans by sport
  const groupedPlans = useMemo(() => {
    const groups = {};
    activePlans.forEach(plan => {
      let groupName = 'All Services';
      if (!plan.isAllServices && plan.sportsIncluded && plan.sportsIncluded.length > 0) {
        // Just take the first sport for grouping in V1
        groupName = plan.sportsIncluded[0] || 'Other'; 
        // Title case it
        groupName = groupName.charAt(0).toUpperCase() + groupName.slice(1);
      }
      
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(plan);
    });

    // Sort plans in each group by duration/price
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.price - b.price);
    });

    return groups;
  }, [activePlans]);

  const availableSports = Object.keys(groupedPlans).sort((a, b) => {
    if (a === 'All Services') return -1;
    if (b === 'All Services') return 1;
    return a.localeCompare(b);
  });

  // Pre-select first sport if none selected
  useEffect(() => {
    if (!selectedSport && availableSports.length > 0) {
      setSelectedSport(availableSports[0]);
    }
  }, [availableSports, selectedSport]);

  const currentSportPlans = useMemo(() => {
    if (!selectedSport || !groupedPlans[selectedSport]) return [];
    return groupedPlans[selectedSport];
  }, [groupedPlans, selectedSport]);

  // Pre-select first plan of sport if none selected
  useEffect(() => {
    if (currentSportPlans.length > 0) {
      // check if selectedPlanId is in currentSportPlans
      const exists = currentSportPlans.find(p => p._id === selectedPlanId);
      if (!exists) {
        setSelectedPlanId(currentSportPlans[0]._id);
      }
    } else {
      setSelectedPlanId('');
    }
  }, [currentSportPlans, selectedPlanId]);

  const selectedPlan = useMemo(() => {
    return activePlans.find((p) => p._id === selectedPlanId);
  }, [activePlans, selectedPlanId]);

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!selectedPlanId) {
      toast.error('Please select a membership plan.');
      return;
    }
    if (!isAuthenticated && (!details.name || !details.email || !details.phone)) {
      toast.error('Please complete all contact fields.');
      return;
    }
    if (!scriptLoaded || !window.Razorpay) {
      toast.error('Payment gateway is still loading. Please try again.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: orderRes } = await api.post('/memberships/public-purchase', {
        planId: selectedPlanId,
      });

      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Failed to initialize order.');
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderRes.rzpOrder.amount,
        currency: orderRes.rzpOrder.currency,
        name: 'Red Ball',
        description: `Membership: ${selectedPlan.name}`,
        order_id: orderRes.rzpOrder.id,
        prefill: {
          name: isAuthenticated ? user.name : details.name,
          email: isAuthenticated ? user.email : details.email,
          contact: isAuthenticated ? user.phone : details.phone,
        },
        theme: { color: '#df1526' },
        handler: async (response) => {
          try {
            const { data: verifyRes } = await api.post('/memberships/public-verify', {
              planId: selectedPlanId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              customerDetails: details,
            });

            if (verifyRes.success) {
              if (verifyRes.token) {
                localStorage.setItem('token', verifyRes.token);
                await checkAuth();
              }
              queryClient.invalidateQueries({ queryKey: ['my-membership'] });
              toast.success('Membership purchased successfully!');
              navigate('/user');
            } else {
              toast.error(verifyRes.message || 'Payment verification failed');
            }
          } catch (error) {
            toast.error(error.response?.data?.message || 'Verification failed. Contact support.');
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(response.error.description || 'Payment failed.');
        setSubmitting(false);
      });
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      setSubmitting(false);
    }
  };

  return (
    <div className={`${embedded ? 'min-h-[500px] rounded-2xl overflow-hidden' : 'min-h-screen'} bg-[#0D0D0D] text-[#EAEAEA] font-sans selection:bg-[#df1526]/30 relative pb-20`}>
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#df1526]/5 to-transparent pointer-events-none" />

      {/* Header */}
      {!embedded && (
        <header className="sticky top-0 z-40 bg-[#0D0D0D]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-[#df1526] flex items-center justify-center shadow-lg shadow-red-900/50 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-sm tracking-tighter">RB</span>
            </div>
            <span className="font-black text-lg tracking-tight uppercase text-white hidden sm:block">Red Ball</span>
          </Link>
          <Link to="/book-slots" className="text-sm font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10">
            One-Time Play →
          </Link>
        </div>
      </header>
      )}

      <main className={`${embedded ? 'p-6 md:p-8' : 'max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 pt-10 pb-20'} relative z-10`}>
        
        <div className="mb-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#df1526]/10 border border-[#df1526]/20 text-[#df1526] text-xs font-bold tracking-widest uppercase">
              <Crown size={14} />
              <span>Memberships</span>
            </div>
            {embedded && (
              <Link to="/user/book-slots" className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors border border-white/10 hover:border-white/20 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 whitespace-nowrap">
                <span>← One-Time Play</span>
              </Link>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[1.1] mb-4">
            Join the Club.
          </h1>
          <p className="text-[#A1A1AA] text-lg leading-relaxed">
            Get unlimited access to your favorite sports without paying hourly rates. Select a sport and pick your plan.
          </p>
        </div>

        {plansLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="animate-spin text-[#df1526]" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Column: Selection */}
            <div className="lg:col-span-7 space-y-10">
              
              {/* Step 1: Select Sport Group */}
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white/40 mb-4">1. Select Sport</h3>
                <div className="flex flex-wrap gap-2">
                  {availableSports.map((sportName) => (
                    <button
                      key={sportName}
                      onClick={() => setSelectedSport(sportName)}
                      className={`px-5 py-3 rounded-xl border text-sm font-bold uppercase tracking-tight transition-all ${
                        selectedSport === sportName
                          ? 'bg-[#df1526] border-[#df1526] text-white shadow-lg shadow-red-950/30'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {sportName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Select Plan */}
              {currentSportPlans.length > 0 && (
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-white/40 mb-4">2. Select Duration</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentSportPlans.map((plan) => {
                      const isSelected = plan._id === selectedPlanId;
                      return (
                        <button
                          key={plan._id}
                          type="button"
                          onClick={() => setSelectedPlanId(plan._id)}
                          className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                            isSelected
                              ? 'border-[#df1526] bg-[#df1526]/5 text-white'
                              : 'border-[#222A2A] bg-white/5 text-white/70 hover:border-white/20'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-0 right-0 w-3 h-3 bg-[#df1526] rounded-bl-lg" />
                          )}
                          <p className="font-extrabold text-lg tracking-tight group-hover:text-white transition-colors">{plan.duration}</p>
                          <p className="text-sm text-white/50 mb-3">{plan.name}</p>
                          <p className="text-xl font-bold text-[#df1526]">{formatCurrency(plan.price)}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Customer Details */}
              <form onSubmit={handlePurchase}>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white/40 mb-4">3. Your Account Details</h3>
                {isAuthenticated ? (
                  <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <CheckCircle2 className="text-green-500" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Logged in: {user?.name}</p>
                      <p className="text-xs text-white/50">{user?.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 mb-8">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-2">
                      <p className="text-xs text-white/60 leading-relaxed mb-3">
                        💡 <strong>No account? No problem!</strong> We will automatically create a secure account for you.
                      </p>
                      <div ref={googleButtonRef} className="w-full flex justify-center mt-2" />
                    </div>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 text-white/40" size={18} />
                      <input
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-[#222A2A] text-white placeholder-white/30 focus:border-[#df1526] focus:bg-[#df1526]/5 transition-all text-sm outline-none"
                        placeholder="Full Name"
                        value={details.name}
                        onChange={(e) => setDetails({ ...details, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 text-white/40" size={18} />
                      <input
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-[#222A2A] text-white placeholder-white/30 focus:border-[#df1526] focus:bg-[#df1526]/5 transition-all text-sm outline-none"
                        type="email"
                        placeholder="Email Address"
                        value={details.email}
                        onChange={(e) => setDetails({ ...details, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 text-white/40" size={18} />
                      <input
                        className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-[#222A2A] text-white placeholder-white/30 focus:border-[#df1526] focus:bg-[#df1526]/5 transition-all text-sm outline-none"
                        placeholder="Mobile Phone Number"
                        value={details.phone}
                        onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Pricing Summary */}
                {selectedPlan && (
                  <div className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-3 text-sm mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-white/55 font-bold">Plan</span>
                      <span className="text-white">{selectedPlan.name} ({selectedPlan.duration})</span>
                    </div>
                    <div className="flex justify-between items-center font-extrabold text-lg pt-3 border-t border-white/5">
                      <span className="text-white">Total Amount</span>
                      <span className="text-[#df1526]">{formatCurrency(selectedPlan.price)}</span>
                    </div>
                  </div>
                )}

                {/* Pay Button */}
                <button
                  type="submit"
                  disabled={submitting || !selectedPlanId}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#df1526] to-[#C8102E] hover:from-[#df1526]/90 hover:to-[#C8102E]/90 active:scale-[0.99] text-white shadow-xl shadow-red-950/20 flex flex-col items-center justify-center transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      <div className="flex items-center gap-3 font-extrabold text-base uppercase tracking-wider">
                        <Sparkles size={18} />
                        <span>Pay & Subscribe</span>
                      </div>
                      <span className="text-[10px] text-white/70 mt-1 uppercase tracking-[0.2em] font-bold">Secured by Razorpay</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Perks */}
            <div className="lg:col-span-5 space-y-6 lg:mt-10">
              <div className="bg-[#111515] border border-[#222A2A] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#df1526]/5 rounded-full blur-3xl pointer-events-none" />
                <h3 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2">
                  <Crown className="text-[#F5A623]" size={20} />
                  <span>Membership Perks</span>
                </h3>

                <ul className="space-y-5 text-sm text-white/70">
                  {[
                    { title: "Unlimited Access", desc: "Play as much as you want without hourly fees." },
                    { title: "Priority Bookings", desc: "Reserve your courts and turf slots before non-members." },
                    { title: "Member Events", desc: "Exclusive invites to tournaments and social events." },
                    { title: "Restaurant Discounts", desc: "Enjoy 15% off at the academy café & restaurant." },
                  ].map((perk, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#df1526]/10 flex items-center justify-center">
                        <Check size={12} className="text-[#df1526]" />
                      </div>
                      <div>
                        <strong className="text-white block mb-0.5">{perk.title}</strong>
                        <span className="text-white/50">{perk.desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
