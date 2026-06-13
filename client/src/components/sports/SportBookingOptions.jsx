import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, QrCode, Zap, ChevronRight, Loader2, Sun, Moon, GraduationCap } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { getSportFallback } from './sportFallbacks';
import MembershipPlanCard from './MembershipPlanCard';
import KidsAcademyPlanCard from './KidsAcademyPlanCard';
import OneTimeBookingModal from './OneTimeBookingModal';

export default function SportBookingOptions({ sport, plans = [], plansLoading = false }) {
  const [modalOpen, setModalOpen] = useState(false);
  const fallback = getSportFallback(sport?.slug || sport?.name || '');
  const accentColor = fallback.color || '#C8102E';

  const isDayNight = sport?.slotPricingMode === 'dayNight';
  const hasOneTime = (sport?.hourlyPrice > 0) ||
    (isDayNight && (sport?.daySlotPrice > 0 || sport?.nightSlotPrice > 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-8"
    >
      {/* ── One-Time Play ─────────────────────────────── */}
      {hasOneTime && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: accentColor }} />
            <h3 className="text-white/40 text-xs uppercase tracking-[3px] font-bold">One-Time Play</h3>
          </div>

          <div
            className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #161B1B 0%, #111515 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
          >
            <div className="space-y-3 flex-1">
              {isDayNight ? (
                <div className="space-y-2">
                  <p className="text-white font-black text-lg leading-tight">Book a Slot</p>
                  <div className="flex flex-wrap gap-4 mt-1">
                    {sport.daySlotPrice > 0 && (
                      <div className="flex items-center gap-2">
                        <Sun size={14} className="text-amber-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Day</p>
                          <p className="font-black text-xl leading-tight" style={{ color: accentColor }}>
                            {formatCurrency(sport.daySlotPrice)}
                          </p>
                        </div>
                      </div>
                    )}
                    {sport.nightSlotPrice > 0 && (
                      <div className="flex items-center gap-2">
                        <Moon size={14} className="text-indigo-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
                            Night
                          </p>
                          <p className="font-black text-xl leading-tight" style={{ color: accentColor }}>
                            {formatCurrency(sport.nightSlotPrice)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-white font-black text-lg leading-tight">1 Hour Session</p>
                  <p className="font-black text-3xl leading-tight mt-1" style={{ color: accentColor }}>
                    {formatCurrency(sport.hourlyPrice)}
                  </p>
                </div>
              )}

              <ul className="space-y-1.5">
                {[
                  { icon: Clock, text: 'Select date & pick from available slots' },
                  { icon: QrCode, text: 'Instant QR check-in' },
                  { icon: Zap, text: 'Secure online payment' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2 text-xs text-white/50">
                    <Icon size={12} className="text-white/30 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] hover:gap-3"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}BB)`,
                boxShadow: `0 6px 20px ${accentColor}25`,
              }}
            >
              Book Now
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Membership Plans ──────────────────────────── */}
      {(() => {
        const regularPlans = plans.filter(p => !p.isKidsAcademy && ['1 Month', '3 Months', '6 Months', '1 Year'].includes(p.duration));
        const kidsPlans = plans.filter(p => p.isKidsAcademy);
        return (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">🏅</span>
                <h3 className="text-white/40 text-xs uppercase tracking-[3px] font-bold">Membership Plans</h3>
              </div>

              {plansLoading ? (
                <div className="flex items-center justify-center py-10 text-white/30 gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm">Loading plans...</span>
                </div>
              ) : regularPlans.length === 0 ? (
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <p className="text-white/30 text-sm">No membership plans available for this sport.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {regularPlans.map((plan, i) => (
                    <MembershipPlanCard key={plan._id} plan={plan} index={i} />
                  ))}
                </div>
              )}
            </div>

            {/* ── Kids Academy Plans ───────────────────── */}
            {kidsPlans.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap size={16} className="text-violet-400" />
                  <h3 className="text-white/40 text-xs uppercase tracking-[3px] font-bold">Kids Academy Programme</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {kidsPlans.map((plan, i) => (
                    <KidsAcademyPlanCard key={plan._id} plan={plan} sport={sport} index={i} />
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* One-time booking modal */}
      <OneTimeBookingModal
        sport={sport}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </motion.div>
  );
}
