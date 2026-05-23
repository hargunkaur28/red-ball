import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CreditCard, CheckCircle2, Loader2, User, Mail, Phone,
  Sparkles, ShieldCheck, Check, Clock, QrCode, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { formatCurrency } from '../../lib/utils';
import useAuthStore from '../../store/authStore';
import { getSportFallback } from './sportFallbacks';

export default function OneTimeBookingModal({ sport, isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, checkAuth, clearPendingEntryIntent, googleAuth } = useAuthStore();

  const [details, setDetails] = useState({ name: '', email: '', phone: '' });
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fallback = getSportFallback(sport?.slug || sport?.name || '');
  const accentColor = fallback.color || '#C8102E';

  // Sync auth user details
  useEffect(() => {
    if (isAuthenticated && user) {
      setDetails({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [isAuthenticated, user]);

  // Load Razorpay script once
  useEffect(() => {
    if (document.getElementById('rzp-script')) {
      setScriptLoaded(true);
      return;
    }
    const s = document.createElement('script');
    s.id = 'rzp-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => setScriptLoaded(true);
    document.body.appendChild(s);
  }, []);

  // Google Sign-In button
  const googleButtonRef = useCallback(
    (node) => {
      if (!node || isAuthenticated) return;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) return;
      const render = () => {
        if (!window.google?.accounts?.id) return;
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
        window.google.accounts.id.renderButton(node, { theme: 'filled_black', size: 'large', type: 'standard' });
      };
      if (window.google?.accounts?.id) render();
      else {
        const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existing) existing.addEventListener('load', render);
        else {
          const s = document.createElement('script');
          s.src = 'https://accounts.google.com/gsi/client';
          s.async = true;
          s.defer = true;
          s.onload = render;
          document.body.appendChild(s);
        }
      }
    },
    [isAuthenticated, googleAuth]
  );

  const handlePurchase = async () => {
    if (!sport?._id) return toast.error('Sport not selected.');
    if (!isAuthenticated && (!details.name || !details.email || !details.phone)) {
      return toast.error('Please fill in all contact fields.');
    }
    if (!scriptLoaded || !window.Razorpay) {
      return toast.error('Payment gateway loading. Please retry.');
    }

    setSubmitting(true);
    try {
      const { data: orderRes } = await api.post('/onetimeaccess/purchase-order', { sportId: sport._id });
      if (!orderRes.success) throw new Error(orderRes.message);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderRes.rzpOrder.amount,
        currency: orderRes.rzpOrder.currency,
        name: 'Red Ball Academy',
        description: `1 Hour Prepaid ${sport.name} Access Pass`,
        order_id: orderRes.rzpOrder.id,
        theme: { color: accentColor },
        prefill: { name: details.name, email: details.email, contact: details.phone },
        handler: async (response) => {
          setSubmitting(true);
          try {
            const payload = {
              sportId: sport._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              ...(!isAuthenticated ? { name: details.name, email: details.email, phone: details.phone } : {}),
            };

            const { data: verifyRes } = await api.post('/onetimeaccess/verify-purchase', payload);

            if (verifyRes.success) {
              if (verifyRes.accessToken) {
                localStorage.setItem('accessToken', verifyRes.accessToken);
                await checkAuth();
              }
              clearPendingEntryIntent?.();
              setSuccess(true);
              toast.success('Pass confirmed! Redirecting to dashboard...');
              setTimeout(() => {
                navigate('/user?focus=passes');
              }, 2800);
            } else {
              toast.error(verifyRes.message || 'Verification failed.');
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed. Contact reception.');
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

      if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
        toast.error('Payment key not configured. Add VITE_RAZORPAY_KEY_ID to your .env file.');
        setSubmitting(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setSubmitting(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not initialize payment.');
      setSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md max-h-[96vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl pointer-events-auto hide-scrollbar"
              style={{
                background: '#0E1313',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />

              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
                  >
                    {getSportFallback(sport?.slug || sport?.name || '').icon}
                  </div>
                  <div>
                    <p className="text-white font-black text-base leading-tight">{sport?.name}</p>
                    <p className="text-white/40 text-xs">1-Hour Flexible Play Pass</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 pb-6 space-y-5">
                {success ? (
                  /* Success State */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                      <Check className="text-green-500" size={32} />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-xl">Payment Confirmed!</h3>
                      <p className="text-white/50 text-sm mt-1">Your 1-hour pass is active for 24 hours.</p>
                    </div>
                    <div className="flex items-center gap-2 justify-center text-xs text-white/40">
                      <Loader2 size={12} className="animate-spin" />
                      Redirecting to dashboard...
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* Pricing summary */}
                    <div
                      className="rounded-2xl p-4 space-y-2"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-white/50">1 Hour {sport?.name} Pass</span>
                        <span className="text-white font-semibold">{formatCurrency(sport?.hourlyPrice || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <span className="text-white font-black">Total</span>
                        <span className="font-black text-lg" style={{ color: accentColor }}>{formatCurrency(sport?.hourlyPrice || 0)}</span>
                      </div>
                    </div>

                    {/* How it works — compact */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { icon: Zap, label: 'Arrive Anytime' },
                        { icon: Clock, label: '24hr Validity' },
                        { icon: QrCode, label: 'QR Entry' },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <Icon size={16} className="mx-auto mb-1 text-white/40" />
                          <p className="text-white/50 text-[10px] font-semibold">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Account details */}
                    {isAuthenticated ? (
                      <div
                        className="rounded-2xl p-4 flex items-center gap-3"
                        style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}
                      >
                        <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                          <CheckCircle2 className="text-green-500" size={16} />
                        </div>
                        <div>
                          <p className="text-white text-sm font-semibold">{user?.name}</p>
                          <p className="text-white/40 text-xs">{user?.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div
                          className="rounded-2xl p-4 text-center"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          <p className="text-white/50 text-xs mb-3">
                            Sign in for a faster checkout, or fill in your details below.
                          </p>
                          <div ref={googleButtonRef} className="flex justify-center" />
                        </div>
                        {[
                          { icon: User, placeholder: 'Full Name', key: 'name', type: 'text' },
                          { icon: Mail, placeholder: 'Email Address', key: 'email', type: 'email' },
                          { icon: Phone, placeholder: 'Mobile Number', key: 'phone', type: 'tel' },
                        ].map(({ icon: Icon, placeholder, key, type }) => (
                          <div key={key} className="relative">
                            <Icon className="absolute left-4 top-3.5 text-white/30" size={16} />
                            <input
                              type={type}
                              placeholder={placeholder}
                              value={details[key]}
                              onChange={(e) => setDetails({ ...details, [key]: e.target.value })}
                              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }}
                              onFocus={(e) => { e.currentTarget.style.borderColor = `${accentColor}60`; e.currentTarget.style.background = `${accentColor}08`; }}
                              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pay button */}
                    <button
                      onClick={handlePurchase}
                      disabled={submitting || !sport?._id}
                      className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, ${accentColor}BB)`,
                        boxShadow: `0 8px 24px ${accentColor}30`,
                      }}
                    >
                      {submitting ? (
                        <Loader2 size={20} className="animate-spin text-white" />
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-white">
                            <Sparkles size={16} />
                            Pay {formatCurrency(sport?.hourlyPrice || 0)} & Get Pass
                          </div>
                          <span className="text-[10px] text-white/60 font-semibold normal-case tracking-normal">
                            Secured by Razorpay
                          </span>
                        </>
                      )}
                    </button>

                    {/* Security note */}
                    <div className="flex items-center gap-2 text-white/30 text-xs justify-center">
                      <ShieldCheck size={12} />
                      <span>256-bit encrypted · PCI-DSS compliant</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
