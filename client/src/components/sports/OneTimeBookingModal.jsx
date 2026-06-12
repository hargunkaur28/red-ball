import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CreditCard, CheckCircle2, Loader2, User, Mail, Phone,
  ShieldCheck, Check, Calendar, Building2, Clock, ChevronLeft,
  Tag, AlertTriangle, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';
import { formatCurrency } from '../../lib/utils';
import useAuthStore from '../../store/authStore';
import { getSportFallback } from './sportFallbacks';
import PhoneCollectModal from '../shared/PhoneCollectModal';

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ── Slot status helpers ──────────────────────────────────────────────────────
const slotAvailable = (s) => s.isAvailable;

const slotColor = (s) => {
  if (!s.isAvailable) return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' };
  return { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#22c55e' };
};

export default function OneTimeBookingModal({ sport, isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, checkAuth, clearPendingEntryIntent, googleAuth } = useAuthStore();

  // ── Step state: 'date' | 'slot' | 'details' | 'success'
  const [step, setStep] = useState('date');
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [details, setDetails] = useState({ name: '', email: '', phone: '' });
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  // Data
  const [slotsData, setSlotsData] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const fallback = getSportFallback(sport?.slug || sport?.name || '');
  const accentColor = fallback.color || '#C8102E';

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('date');
      setSelectedDate(todayStr());
      setSelectedCourt(null);
      setSelectedSlot(null);
      setSlotsData(null);
    }
  }, [isOpen]);

  // Sync auth user
  useEffect(() => {
    if (isAuthenticated && user) {
      setDetails({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [isAuthenticated, user]);

  // Load Razorpay script once
  useEffect(() => {
    if (document.getElementById('rzp-script')) { setScriptLoaded(true); return; }
    const s = document.createElement('script');
    s.id = 'rzp-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => setScriptLoaded(true);
    document.body.appendChild(s);
  }, []);

  // Load slots when date is selected
  const loadSlots = useCallback(async (date) => {
    if (!sport?.slug) return;
    setSlotsLoading(true);
    try {
      const { data } = await api.get('/slots/public/available', {
        params: { sportSlug: sport.slug, date },
      });
      setSlotsData(data);
      setSelectedCourt(null);
      setSelectedSlot(null);
    } catch {
      toast.error('Failed to load available slots.');
    } finally {
      setSlotsLoading(false);
    }
  }, [sport?.slug]);

  const handleDateContinue = () => {
    loadSlots(selectedDate);
    setStep('slot');
  };

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
          s.async = true; s.defer = true; s.onload = render;
          document.body.appendChild(s);
        }
      }
    },
    [isAuthenticated, googleAuth]
  );

  const handlePayment = async () => {
    if (!selectedSlot) return toast.error('Please select a slot.');
    if (isAuthenticated && !user?.phone) { setShowPhoneModal(true); return; }
    if (!isAuthenticated && (!details.name || !details.email || !details.phone)) {
      return toast.error('Please fill in all contact fields.');
    }
    if (!scriptLoaded || !window.Razorpay) return toast.error('Payment gateway loading. Please retry.');
    if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
      return toast.error('Payment key not configured.');
    }

    setSubmitting(true);
    try {
      const { data: orderRes } = await api.post('/slots/public/slot-order', { slotId: selectedSlot._id });

      const playerName = isAuthenticated ? user.name : details.name;
      const playerPhone = isAuthenticated ? user.phone : details.phone;
      const playerEmail = isAuthenticated ? user.email : details.email;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderRes.razorpayOrder.amount,
        currency: orderRes.razorpayOrder.currency,
        name: 'Red Ball Academy',
        description: `${sport.name} — ${selectedSlot.startTime}–${selectedSlot.endTime}${selectedSlot.courtNameSnapshot ? ' · ' + selectedSlot.courtNameSnapshot : ''}`,
        order_id: orderRes.razorpayOrder.id,
        theme: { color: accentColor },
        prefill: { name: playerName, email: playerEmail, contact: playerPhone },
        handler: async (response) => {
          setSubmitting(true);
          try {
            const { data: verifyRes } = await api.post('/slots/public/slot-verify', {
              paymentId: orderRes.paymentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              playerName,
              playerPhone,
              playerEmail,
            });

            if (verifyRes.success) {
              if (verifyRes.token) {
                localStorage.setItem('token', verifyRes.token);
                await checkAuth();
              }
              clearPendingEntryIntent?.();
              setStep('success');
              toast.success(`Slot booked! Booking ID: ${verifyRes.bookingId}`);
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
          ondismiss: () => { toast.info('Payment cancelled.'); setSubmitting(false); },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { toast.error('Payment failed. Please try again.'); setSubmitting(false); });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Could not initialize payment.');
      setSubmitting(false);
    }
  };

  // ── Group slots by court ───────────────────────────────────────────────────
  const courtMap = {};
  (slotsData?.courts || []).forEach((c) => { courtMap[c._id] = c; });
  const slotsByCourt = {};
  (slotsData?.slots || []).forEach((s) => {
    const key = s.courtId || '__unassigned';
    if (!slotsByCourt[key]) slotsByCourt[key] = [];
    slotsByCourt[key].push(s);
  });

  const activeDiscount = slotsData?.discount;
  const isReferenceUser = !!slotsData?.isReferenceUser;

  return (
    <>
      <PhoneCollectModal
        open={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={(phone) => { setDetails((d) => ({ ...d, phone })); setShowPhoneModal(false); }}
      />
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
              />
              <motion.div
                key="modal"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
              >
                <div
                  className="relative w-full max-w-lg max-h-[96vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl pointer-events-auto"
                  style={{
                    background: '#0E1313',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
                    scrollbarWidth: 'none',
                  }}
                >
                  {/* Accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />

                  {/* Header */}
                  <div className="flex items-center justify-between p-5 pb-3">
                    <div className="flex items-center gap-3">
                      {step !== 'date' && step !== 'success' && (
                        <button
                          onClick={() => setStep(step === 'slot' ? 'date' : 'slot')}
                          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 mr-1"
                        >
                          <ChevronLeft size={16} />
                        </button>
                      )}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}>
                        {getSportFallback(sport?.slug || sport?.name || '').icon}
                      </div>
                      <div>
                        <p className="text-white font-black text-sm leading-tight">{sport?.name}</p>
                        <p className="text-white/40 text-[10px]">
                          {step === 'date' && 'Select date'}
                          {step === 'slot' && `${selectedDate ? new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}`}
                          {step === 'details' && `${selectedSlot?.startTime}–${selectedSlot?.endTime}`}
                          {step === 'success' && 'Booking confirmed'}
                        </p>
                      </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Reference-user banner */}
                  {isReferenceUser && step !== 'success' && (
                    <div className="mx-5 mb-3 rounded-xl px-3 py-2 flex items-center gap-2 text-xs" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}>
                      <ShieldCheck size={12} className="text-yellow-400 shrink-0" />
                      <span className="text-yellow-300 font-semibold">Reference rate applied — your special pricing is shown below</span>
                    </div>
                  )}
                  {/* Discount banner (only when not a reference user) */}
                  {activeDiscount && !isReferenceUser && step !== 'success' && (
                    <div className="mx-5 mb-3 rounded-xl px-3 py-2 flex items-center gap-2 text-xs" style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)' }}>
                      <Tag size={12} className="text-yellow-400 shrink-0" />
                      <span className="text-yellow-300 font-semibold">{activeDiscount.discountPercent}% off — active discount applied to all slots</span>
                    </div>
                  )}

                  <div className="px-5 pb-6">
                    {/* ── STEP: date ── */}
                    {step === 'date' && (
                      <div className="space-y-4">
                        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar size={14} className="text-white/40" />
                            <p className="text-white/70 text-sm font-semibold">Select Date</p>
                          </div>
                          <input
                            type="date"
                            value={selectedDate}
                            min={todayStr()}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                          />
                        </div>
                        <button
                          onClick={handleDateContinue}
                          disabled={!selectedDate}
                          className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}BB)`, boxShadow: `0 8px 24px ${accentColor}30` }}
                        >
                          <span className="text-white">View Available Slots</span>
                        </button>
                      </div>
                    )}

                    {/* ── STEP: slot ── */}
                    {step === 'slot' && (() => {
                      const totalSlots = slotsData?.slots?.length || 0;
                      const availableCount = (slotsData?.slots || []).filter(slotAvailable).length;
                      const isToday = selectedDate === todayStr();
                      return (
                      <div className="space-y-4">
                        {slotsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-white/40" />
                          </div>
                        ) : totalSlots === 0 ? (
                          <div className="text-center py-10 space-y-3">
                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                              <Calendar size={22} className="text-white/25" />
                            </div>
                            <p className="text-white/50 text-sm font-semibold">No slots available for this date.</p>
                            <p className="text-white/30 text-xs">No {sport?.name} slots have been configured for this date.</p>
                            <button
                              onClick={() => setStep('date')}
                              className="mx-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                            >
                              <Calendar size={13} /> Try Another Date
                            </button>
                          </div>
                        ) : availableCount === 0 ? (
                          <div className="text-center py-10 space-y-3">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                              <AlertTriangle size={22} className="text-red-400" />
                            </div>
                            <p className="text-white font-bold text-sm">
                              {isToday ? 'All slots are booked for today.' : 'All slots are booked for this date.'}
                            </p>
                            <p className="text-white/35 text-xs">
                              {totalSlots} slot{totalSlots !== 1 ? 's' : ''} exist but none are currently available.
                            </p>
                            <button
                              onClick={() => setStep('date')}
                              className="mx-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                            >
                              <Calendar size={13} /> Try Another Date
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Courts + slots */}
                            {Object.entries(slotsByCourt).map(([courtKey, slots]) => {
                              const court = courtMap[courtKey];
                              const courtClosed = court && !court.isOpen;
                              return (
                                <div key={courtKey}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Building2 size={12} className="text-white/30" />
                                    <p className="text-white/50 text-xs font-semibold">
                                      {court?.name || 'Available Slots'}
                                      {courtClosed && <span className="ml-2 text-red-400/70">(Closed)</span>}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {slots.map((s) => {
                                      const avail = !courtClosed && slotAvailable(s);
                                      const colors = slotColor({ isAvailable: avail });
                                      const isSelected = selectedSlot?._id === s._id;
                                      return (
                                        <button
                                          key={s._id}
                                          disabled={!avail}
                                          onClick={() => { setSelectedSlot(s); setSelectedCourt(court); }}
                                          className="rounded-xl p-3 text-left transition-all"
                                          style={{
                                            background: isSelected ? `${accentColor}20` : colors.bg,
                                            border: `1px solid ${isSelected ? accentColor : colors.border}`,
                                            opacity: avail ? 1 : 0.5,
                                            cursor: avail ? 'pointer' : 'not-allowed',
                                          }}
                                        >
                                          <div className="flex items-start justify-between gap-1">
                                            <div>
                                              <p className="text-white text-xs font-bold">{s.startTime}–{s.endTime}</p>
                                              <p className="text-white/40 text-[10px] mt-0.5">{s.duration}min</p>
                                            </div>
                                            <div className="text-right">
                                              {s.isReferencePrice ? (
                                                <>
                                                  <p className="text-[10px] line-through text-white/30">₹{s.originalPrice}</p>
                                                  <p className="text-xs font-bold text-yellow-400">₹{s.pricePerSlot}</p>
                                                  <p className="text-[9px] text-yellow-500/70 font-semibold">Ref rate</p>
                                                </>
                                              ) : s.discount ? (
                                                <>
                                                  <p className="text-[10px] line-through text-white/30">₹{s.originalPrice}</p>
                                                  <p className="text-xs font-bold" style={{ color: accentColor }}>₹{s.pricePerSlot}</p>
                                                </>
                                              ) : (
                                                <p className="text-xs font-bold text-white">₹{s.pricePerSlot}</p>
                                              )}
                                              {s.priceLabel && <p className="text-[9px] text-white/30 uppercase">{s.priceLabel}</p>}
                                            </div>
                                          </div>
                                          <div className="mt-1.5 flex items-center gap-1">
                                            <span className="text-[9px] font-bold" style={{ color: colors.text }}>
                                              {avail ? 'Available' : 'Booked'}
                                            </span>
                                            {isSelected && <Check size={10} style={{ color: accentColor }} />}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}

                            {selectedSlot && (
                              <button
                                onClick={() => setStep('details')}
                                className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
                                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}BB)`, boxShadow: `0 8px 24px ${accentColor}30` }}
                              >
                                <Clock size={15} className="text-white" />
                                <span className="text-white">Book {selectedSlot.startTime}–{selectedSlot.endTime} · ₹{selectedSlot.pricePerSlot}</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      );
                    })()}

                    {/* ── STEP: details ── */}
                    {step === 'details' && (
                      <div className="space-y-4">
                        {/* Summary */}
                        <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/50">{sport?.name}</span>
                            <span className="text-white/50">{selectedSlot?.courtNameSnapshot || ''}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/50">{new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            <span className="text-white/50">{selectedSlot?.startTime}–{selectedSlot?.endTime}</span>
                          </div>
                          {selectedSlot?.isReferencePrice && (
                            <div className="flex justify-between text-xs pt-1 border-t border-white/5">
                              <span className="text-yellow-400/80 flex items-center gap-1"><ShieldCheck size={10} /> Reference rate</span>
                              <span className="text-yellow-400/80">-₹{(selectedSlot.waivedAmount ?? (selectedSlot.originalPrice - selectedSlot.pricePerSlot))}</span>
                            </div>
                          )}
                          {!selectedSlot?.isReferencePrice && selectedSlot?.discount && (
                            <div className="flex justify-between text-xs pt-1 border-t border-white/5">
                              <span className="text-yellow-400/80">Discount ({selectedSlot.discount.discountPercent}%)</span>
                              <span className="text-yellow-400/80">-₹{selectedSlot.discount.discountAmount}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-1 border-t border-white/5">
                            <span className="text-white font-black">Total</span>
                            <span className="font-black text-lg" style={{ color: selectedSlot?.isReferencePrice ? '#fbbf24' : accentColor }}>₹{selectedSlot?.pricePerSlot}</span>
                          </div>
                        </div>

                        {/* Auth / guest details */}
                        {isAuthenticated ? (
                          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                            <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                            <div>
                              <p className="text-white text-sm font-semibold">{user?.name}</p>
                              <p className="text-white/40 text-xs">{user?.email}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <p className="text-white/50 text-xs mb-3">Sign in or fill in your details to continue.</p>
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
                                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={handlePayment}
                          disabled={submitting}
                          className="w-full py-4 rounded-2xl font-black text-sm flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}BB)`, boxShadow: `0 8px 24px ${accentColor}30` }}
                        >
                          {submitting ? (
                            <Loader2 size={20} className="animate-spin text-white" />
                          ) : (
                            <>
                              <div className="flex items-center gap-2 text-white">
                                <CreditCard size={15} />
                                Pay ₹{selectedSlot?.pricePerSlot} via Razorpay
                              </div>
                              <span className="text-[10px] text-white/60 font-normal normal-case">Secured by Razorpay</span>
                            </>
                          )}
                        </button>
                        <div className="flex items-center gap-2 text-white/30 text-xs justify-center">
                          <ShieldCheck size={12} />
                          <span>256-bit encrypted · PCI-DSS compliant</span>
                        </div>
                      </div>
                    )}

                    {/* ── STEP: success ── */}
                    {step === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-10 space-y-4"
                      >
                        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                          <Check className="text-green-500" size={32} />
                        </div>
                        <div>
                          <h3 className="text-white font-black text-xl">Slot Booked!</h3>
                          <p className="text-white/50 text-sm mt-1">
                            {sport?.name} · {selectedSlot?.startTime}–{selectedSlot?.endTime}
                          </p>
                          <p className="text-white/30 text-xs mt-1">
                            {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </p>
                        </div>
                        <button
                          onClick={onClose}
                          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:text-white border border-white/10 hover:border-white/20"
                        >
                          Close
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
