import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Calendar, ChevronRight, ChevronLeft, Check, Loader2,
  CalendarCheck, Trophy, Clock, Users, Crown,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../../lib/axios';
import { getSportFallback } from './sportFallbacks';

// ─── helpers ────────────────────────────────────────────────────────────────
const isAllServicesKey = (k) => {
  const n = (k || '').trim().toLowerCase();
  return n === 'all' || n === 'all-services';
};

const localDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const next7Days = () => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return days;
};

const fmtDate = (str) => {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

// ─── sub-components ─────────────────────────────────────────────────────────
function SportSelectorStep({ plan, onSelect }) {
  const { data: sportsData } = useQuery({
    queryKey: ['public-sports'],
    queryFn: () => api.get('/sports/public').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const allSports = sportsData?.sports || [];
  const availableSports = allSports.filter((s) => {
    const keys = (plan?.sportsIncluded || []).map((k) => (k || '').toLowerCase());
    return keys.some((k) => isAllServicesKey(k) || k === s.slug || k === s.name?.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <p className="text-white font-bold text-base">Which sport do you want to play?</p>
        <p className="text-white/40 text-xs mt-1">Select a sport covered by your {plan?.name}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {availableSports.map((sport) => {
          const fallback = getSportFallback(sport.slug || sport.name);
          return (
            <button
              key={sport._id}
              onClick={() => onSelect(sport)}
              className="rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${fallback.color}30`,
              }}
            >
              {sport.imageUrl ? (
                <img src={sport.imageUrl} alt={sport.name} className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: `${fallback.color}20` }}>
                  {fallback.emoji}
                </div>
              )}
              <p className="text-white text-sm font-bold">{sport.name}</p>
            </button>
          );
        })}
      </div>
      {availableSports.length === 0 && (
        <p className="text-center text-white/40 text-sm py-6">No sports available under your membership.</p>
      )}
    </div>
  );
}

function SlotPickerStep({ sport, membership, onBack, onBooked }) {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(localDateStr());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const days = next7Days();

  const { data, isLoading } = useQuery({
    queryKey: ['membership-slots', sport._id, selectedDate, membership._id],
    queryFn: () =>
      api.get('/slots/membership/available', {
        params: { sportSlug: sport.slug, date: selectedDate, membershipId: membership._id },
      }).then((r) => r.data),
    enabled: !!sport && !!selectedDate && !!membership,
    staleTime: 30_000,
  });

  const fallback = getSportFallback(sport.slug || sport.name);
  const slots = data?.slots || [];
  const courts = data?.courts || [];

  // Group by court
  const byCourt = slots.reduce((acc, s) => {
    const key = s.courtId || 'unassigned';
    if (!acc[key]) acc[key] = { name: s.courtNameSnapshot || 'Court', slots: [] };
    acc[key].slots.push(s);
    return acc;
  }, {});

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    // Use sportId from API response (covers slug-only sport objects)
    const resolvedSportId = data?.sport?._id || sport._id;
    if (!resolvedSportId) return toast.error('Sport not resolved. Please try again.');
    setBooking(true);
    try {
      await api.post('/slots/membership/book', {
        membershipId: membership._id,
        slotId: selectedSlot._id,
        sportId: resolvedSportId,
      });
      qc.invalidateQueries({ queryKey: ['membership-bookings'] });
      qc.invalidateQueries({ queryKey: ['membership-slots'] });
      toast.success('Slot booked successfully!');
      onBooked();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Back button if sport selector was shown */}
      {onBack && (
        <button onClick={onBack} className="flex items-center gap-1 text-white/50 hover:text-white text-xs font-semibold transition-colors">
          <ChevronLeft size={14} /> Change sport
        </button>
      )}

      {/* Sport header */}
      <div className="flex items-center gap-3 pb-2 border-b border-white/8">
        {sport.imageUrl ? (
          <img src={sport.imageUrl} alt={sport.name} className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
            style={{ background: `${fallback.color}20` }}>{fallback.emoji}</div>
        )}
        <div>
          <p className="text-white font-bold text-sm">{sport.name}</p>
          <p className="text-white/40 text-[11px]">Included in your membership · Free</p>
        </div>
      </div>

      {/* Date picker */}
      <div>
        <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-2">Select Date</p>
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
              className="shrink-0 rounded-xl px-3 py-2 text-center transition-all text-xs font-bold"
              style={{
                background: selectedDate === d ? fallback.color : 'rgba(255,255,255,0.05)',
                color: selectedDate === d ? '#fff' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${selectedDate === d ? fallback.color : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <div>{fmtDate(d).split(' ')[0]}</div>
              <div className="text-[11px] opacity-80">{fmtDate(d).split(' ').slice(1).join(' ')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Slots */}
      <div>
        <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-2">Available Slots</p>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-white/40" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">No slots available for this date.</div>
        ) : (
          <div className="space-y-3 max-h-52 overflow-y-auto pr-1 hide-scrollbar">
            {Object.entries(byCourt).map(([courtKey, { name: courtName, slots: courtSlots }]) => (
              <div key={courtKey}>
                <p className="text-white/30 text-[10px] uppercase font-bold mb-1.5 px-1">{courtName}</p>
                <div className="grid grid-cols-2 gap-2">
                  {courtSlots.map((slot) => {
                    const isSelected = selectedSlot?._id === slot._id;
                    const unavailable = !slot.isAvailable || slot.alreadyBooked;
                    return (
                      <button
                        key={slot._id}
                        disabled={unavailable}
                        onClick={() => setSelectedSlot(isSelected ? null : slot)}
                        className="rounded-xl p-2.5 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: isSelected ? `${fallback.color}20` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isSelected ? fallback.color : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        <p className="text-white text-xs font-bold">{slot.startTime} – {slot.endTime}</p>
                        <p className="text-white/40 text-[10px] mt-0.5">
                          {slot.alreadyBooked ? 'Already booked' : unavailable ? 'Full' : `${slot.capacity - slot.currentBookings} left`}
                        </p>
                        {isSelected && <Check size={12} className="text-green-400 mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm button */}
      {selectedSlot && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 space-y-3"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/50">{sport.name} · {selectedSlot.startTime}–{selectedSlot.endTime}</span>
            <span className="text-green-400 font-bold text-xs">Free</span>
          </div>
          <div className="flex justify-between items-center text-sm border-t border-white/8 pt-2">
            <span className="text-white font-black">Total</span>
            <span className="text-green-400 font-black">₹0 · Included in membership</span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={booking}
            className="w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${fallback.color}, ${fallback.color}CC)` }}
          >
            {booking ? <Loader2 size={16} className="animate-spin" /> : <CalendarCheck size={16} />}
            {booking ? 'Confirming…' : 'Confirm Slot'}
          </button>
          <p className="text-center text-white/30 text-[10px]">Included in your membership · No payment required</p>
        </motion.div>
      )}
    </div>
  );
}

// ─── main modal ─────────────────────────────────────────────────────────────
export default function MembershipSlotBookingModal({ membership, isOpen, onClose }) {
  const [step, setStep] = useState('sport'); // 'sport' | 'slots' | 'success'
  const [selectedSport, setSelectedSport] = useState(null);

  const plan = membership?.planId;
  const isAllServices = plan && (
    plan.isAllServices ||
    (plan.sportsIncluded || []).some((k) => isAllServicesKey(k))
  );

  // For sport-specific memberships, skip sport selection
  useEffect(() => {
    if (!isOpen) { setStep('sport'); setSelectedSport(null); }
    else if (!isAllServices && plan?.sportsIncluded?.length === 1) {
      setStep('slots');
    }
  }, [isOpen, isAllServices]);

  if (!membership || !plan) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl pointer-events-auto hide-scrollbar"
              style={{
                background: '#0E1313',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
              }}
            >
              <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }} />

              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
                    <Crown size={18} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-white font-black text-sm leading-tight">Book a Slot</p>
                    <p className="text-white/40 text-[11px]">{plan.name}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-5 pb-6">
                <AnimatePresence mode="wait">
                  {step === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8 space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                        <Check className="text-green-500" size={32} />
                      </div>
                      <div>
                        <h3 className="text-white font-black text-xl">Slot Booked!</h3>
                        <p className="text-white/50 text-sm mt-1">Your slot is confirmed. See you there!</p>
                      </div>
                      <button
                        onClick={onClose}
                        className="px-8 py-2.5 rounded-full bg-white/10 text-white text-sm font-bold hover:bg-white/15 transition-colors"
                      >
                        Done
                      </button>
                    </motion.div>
                  ) : step === 'sport' && isAllServices ? (
                    <motion.div key="sport" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      <SportSelectorStep
                        plan={plan}
                        onSelect={(sport) => { setSelectedSport(sport); setStep('slots'); }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div key="slots" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <SlotPickerStep
                        sport={selectedSport || { slug: plan.sportsIncluded?.[0], name: plan.sportsIncluded?.[0], _id: null }}
                        membership={membership}
                        onBack={isAllServices ? () => { setStep('sport'); setSelectedSport(null); } : null}
                        onBooked={() => setStep('success')}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
