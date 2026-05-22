import { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, QrCode, CreditCard, ShieldCheck, HelpCircle, Check, Info, Sparkles, User, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { formatCurrency } from '../lib/utils';
import useAuthStore from '../store/authStore';

export default function OneTimeBookingPortal({ embedded = false }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sportParam = searchParams.get('sport') || searchParams.get('sportSlug');

  const { user, isAuthenticated, checkAuth, clearPendingEntryIntent, googleAuth } = useAuthStore();

  const [details, setDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [selectedSportId, setSelectedSportId] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

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
          } catch (err) {
            toast.error(err.response?.data?.message || 'Google sign-in failed');
          }
        },
      });
      node.innerHTML = '';
      window.google.accounts.id.renderButton(node, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        width: node.offsetWidth || 320,
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

  // Sync auth user details if logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setDetails({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [isAuthenticated, user]);

  // Load Razorpay script
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

  // Fetch active sports
  const { data: sportsData, isLoading: sportsLoading } = useQuery({
    queryKey: ['public-sports'],
    queryFn: () => api.get('/sports/public').then((r) => r.data),
  });

  const sportsList = useMemo(() => (sportsData?.sports || []).filter(s => s.hourlyPrice > 0), [sportsData]);

  // Pre-select sport based on query parameters or select first active sport
  useEffect(() => {
    if (sportsList.length > 0) {
      if (sportParam) {
        const found = sportsList.find(
          (s) => s.slug === sportParam.toLowerCase() || s.name.toLowerCase() === sportParam.toLowerCase()
        );
        if (found) {
          setSelectedSportId(found._id);
          return;
        }
      }
      setSelectedSportId(sportsList[0]._id);
    }
  }, [sportsList, sportParam]);

  const selectedSport = useMemo(() => {
    return sportsList.find((s) => s._id === selectedSportId);
  }, [sportsList, selectedSportId]);

  const baseAmount = selectedSport ? selectedSport.hourlyPrice : 0;
  const gstAmount = Math.round(baseAmount * 0.18 * 100) / 100;
  const totalAmount = baseAmount + gstAmount;

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!selectedSportId) {
      toast.error('Please select a sport.');
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
      const { data: orderRes } = await api.post('/onetimeaccess/purchase-order', {
        sportId: selectedSportId,
      });

      if (!orderRes.success) {
        throw new Error(orderRes.message || 'Failed to initialize order.');
      }

      const options = {
        key: orderRes.keyId,
        amount: orderRes.rzpOrder.amount,
        currency: orderRes.rzpOrder.currency,
        name: 'Red Ball Academy',
        description: `1 Hour Prepaid ${selectedSport.name} Access Pass`,
        order_id: orderRes.rzpOrder.id,
        theme: { color: '#C8102E' },
        prefill: {
          name: details.name,
          email: details.email,
          contact: details.phone,
        },
        handler: async (response) => {
          setSubmitting(true);
          try {
            const verifyPayload = {
              sportId: selectedSportId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              ...(!isAuthenticated
                ? {
                    name: details.name,
                    email: details.email,
                    phone: details.phone,
                  }
                : {}),
            };

            const { data: verifyRes } = await api.post('/onetimeaccess/verify-purchase', verifyPayload);

            if (verifyRes.success) {
              toast.success(verifyRes.message || 'Payment verified!');

              if (verifyRes.accessToken) {
                localStorage.setItem('accessToken', verifyRes.accessToken);
                await checkAuth();
              }

              clearPendingEntryIntent();

              setSuccess({
                message: 'Your prepaid access pass is ready.',
                pass: verifyRes.pass,
              });

              setTimeout(() => {
                navigate('/user?focus=passes');
              }, 3200);
            } else {
              toast.error(verifyRes.message || 'Purchase verification failed.');
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed. Please contact reception.');
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment cancelled.');
            setSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Payment initialization failed.');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={`${embedded ? 'min-h-[520px] rounded-2xl' : 'min-h-screen'} bg-[#0A0D0D] text-white flex items-center justify-center p-4`}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
          .ota-success-root { font-family: 'Outfit', sans-serif; }
        `}</style>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="ota-success-root w-full max-w-md rounded-3xl bg-[#111515] border border-[#222A2A] p-8 text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C8102E] to-[#df1526]" />
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-5">
            <Check className="text-green-500" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">Payment Confirmed!</h1>
          <p className="text-sm text-white/70 mb-6">{success.message}</p>

          <div className="rounded-2xl bg-black/40 border border-white/5 p-5 text-left text-sm space-y-3 mb-6">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-white/50">Sport</span>
              <span className="font-semibold text-white uppercase">{selectedSport?.name}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-white/50">Pass Type</span>
              <span className="font-semibold text-white">1-Hour Flexible Access</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/50">Validity</span>
              <span className="text-amber-400 font-medium">Valid for 24 Hours</span>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center text-xs text-white/50 bg-white/5 rounded-xl py-3 px-4">
            <Loader2 size={14} className="animate-spin text-[#df1526]" />
            <span>Redirecting to your dashboard to view your pass...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? 'min-h-0 rounded-2xl' : 'min-h-screen'} bg-[#0A0D0D] text-white p-4 md:p-8 flex items-center justify-center`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        .ota-portal-root { font-family: 'Outfit', sans-serif; }
      `}</style>
      <div className="ota-portal-root w-full max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#df1526] to-[#C8102E] flex items-center justify-center shadow-lg shadow-red-950/40">
            <CreditCard className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Prepaid Access Portal</h1>
            <p className="text-sm text-white/50 mt-0.5">Flexible one-hour passes. Play whenever you want.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Action Block */}
          <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handlePurchase} className="bg-[#111515] border border-[#222A2A] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            {/* Step 1: Choose Sport */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-white/40">1. Select Sport</h3>
                {sportsLoading && <Loader2 size={16} className="animate-spin text-white/30" />}
              </div>

              {sportsList.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {sportsList.map((sport) => {
                    const isSelected = sport._id === selectedSportId;
                    return (
                      <button
                        key={sport._id}
                        type="button"
                        onClick={() => setSelectedSportId(sport._id)}
                        className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                          isSelected
                            ? 'border-[#df1526] bg-[#df1526]/5 text-white'
                            : 'border-[#222A2A] bg-white/5 text-white/70 hover:border-white/20'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-3 h-3 bg-[#df1526] rounded-bl-lg" />
                        )}
                        <p className="font-extrabold text-base uppercase tracking-tight group-hover:text-white transition-colors">{sport.name}</p>
                        <p className="text-xs text-white/40 mt-1">{formatCurrency(sport.hourlyPrice)}/hr</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                !sportsLoading && <div className="text-sm text-white/40">No active sports available.</div>
              )}
            </div>

            {/* Step 2: Customer Details */}
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white/40 mb-4">2. Your Account Details</h3>
              {isAuthenticated ? (
                <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="text-green-500" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Logged in: {user?.name}</p>
                    <p className="text-xs text-white/50">{user?.email}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-2">
                    <p className="text-xs text-white/60 leading-relaxed mb-3">
                      💡 <strong>No account? No problem!</strong> We will automatically create a secure account and profile for you with this email so you can access your pass.
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
            </div>

            {/* Pricing Summary */}
            {selectedSport && (
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/55">1 Hour Play Pass ({selectedSport.name})</span>
                  <span>{formatCurrency(baseAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/55">GST (18%)</span>
                  <span>{formatCurrency(gstAmount)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-base pt-2 border-t border-white/5">
                  <span className="text-white">Total Amount</span>
                  <span className="text-[#df1526]">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            )}

            {/* Pay Button */}
            <button
              type="submit"
              disabled={submitting || !selectedSportId}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#df1526] to-[#C8102E] hover:from-[#df1526]/90 hover:to-[#C8102E]/90 active:scale-[0.99] text-white shadow-xl shadow-red-950/20 flex flex-col items-center justify-center transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <div className="flex items-center gap-3 font-extrabold text-base uppercase tracking-wider">
                    <Sparkles size={18} />
                    <span>Pay & Confirm Pass</span>
                  </div>
                  <span className="text-[10px] text-white/70 mt-1 uppercase tracking-[0.2em] font-bold">Secured by Razorpay</span>
                </>
              )}
            </button>
          </form>

          {/* Memberships Upsell */}
          <div className="bg-gradient-to-r from-[#F5A623]/20 to-[#F5A623]/5 border border-[#F5A623]/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5A623]/10 rounded-full blur-2xl pointer-events-none group-hover:bg-[#F5A623]/20 transition-all duration-500" />
            <div className="relative z-10">
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Looking for a Membership?</h3>
              <p className="text-sm text-white/70 mt-1">Get unlimited access to your favorite sports without paying hourly rates.</p>
            </div>
            <button 
              type="button"
              onClick={() => window.location.href = '/#membership'}
              className="relative z-10 px-6 py-3 rounded-xl bg-[#F5A623] text-black font-extrabold uppercase tracking-widest text-xs hover:bg-[#E09410] transition-colors shrink-0 whitespace-nowrap shadow-lg shadow-[#F5A623]/20"
            >
              Explore Plans
            </button>
          </div>
          </div>

          {/* Flexible Entitlement Description Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#111515] border border-[#222A2A] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#df1526]/5 rounded-full blur-2xl pointer-events-none" />
              <h3 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
                <Info className="text-[#df1526]" size={20} />
                <span>How Flexible Access Works</span>
              </h3>

              <ul className="space-y-4 text-sm text-white/70">
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded bg-[#df1526]/10 border border-[#df1526]/20 flex items-center justify-center text-xs font-bold text-[#df1526] mt-0.5 shrink-0">1</div>
                  <div>
                    <strong className="text-white">Arrive Anytime</strong>
                    <p className="text-xs text-white/50 mt-0.5">No fixed slots. Your prepaid hour starts when you arrive and scan the QR code.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded bg-[#df1526]/10 border border-[#df1526]/20 flex items-center justify-center text-xs font-bold text-[#df1526] mt-0.5 shrink-0">2</div>
                  <div>
                    <strong className="text-white">24-Hour Validity</strong>
                    <p className="text-xs text-white/50 mt-0.5">Your purchased pass is valid for entry for 24 hours. Plan your day freely.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded bg-[#df1526]/10 border border-[#df1526]/20 flex items-center justify-center text-xs font-bold text-[#df1526] mt-0.5 shrink-0">3</div>
                  <div>
                    <strong className="text-white">Instant QR Entry</strong>
                    <p className="text-xs text-white/50 mt-0.5">Show up, point your phone at the facility QR code, tap Check-in, and start playing.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="w-5 h-5 rounded bg-[#df1526]/10 border border-[#df1526]/20 flex items-center justify-center text-xs font-bold text-[#df1526] mt-0.5 shrink-0">4</div>
                  <div>
                    <strong className="text-white">Overtime Safe-guard</strong>
                    <p className="text-xs text-white/50 mt-0.5">Play beyond 1 hour easily. Extra minutes will be computed automatically and charged at checkout.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-[#111515]/60 border border-[#222A2A]/60 rounded-3xl p-5 text-xs text-white/40 flex items-start gap-3">
              <ShieldCheck size={18} className="text-white/30 mt-0.5 shrink-0" />
              <p>
                Payments are processed securely via Razorpay. All entry events are logged for security and duration verification. Pass starts on scan and closes on checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
