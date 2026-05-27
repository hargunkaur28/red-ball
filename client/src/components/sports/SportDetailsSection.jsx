import { motion } from 'framer-motion';
import { CheckCircle2, Star } from 'lucide-react';
import { getSportFallback } from './sportFallbacks';

export default function SportDetailsSection({ sport }) {
  const fallback = getSportFallback(sport?.slug || sport?.name || '');
  const description = sport?.description || fallback.description;
  const features = sport?.features?.length ? sport.features : fallback.features;
  const rentalText = sport?.rentalEquipment || fallback.rentalEquipment || '';
  const accentColor = fallback.color || '#C8102E';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="space-y-2">
        <p
          className="uppercase text-xs tracking-[4px] font-semibold"
          style={{ color: accentColor }}
        >
          Red Ball Academy
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <h2
            className="text-white text-3xl font-black leading-tight"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}
          >
            {sport?.name} Facility
          </h2>
          <a
            href="#booking"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white text-xs font-bold tracking-wide transition-all hover:opacity-90 hover:scale-105 shrink-0"
            style={{ background: accentColor }}
          >
            Book Now ↓
          </a>
        </div>
      </div>

      {/* Rating placeholder */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={16} fill={s <= 4 ? '#F5A623' : 'none'} color={s <= 4 ? '#F5A623' : 'rgba(255,255,255,0.2)'} />
        ))}
        <span className="text-sm text-white/50 ml-1">4.8 · World-class facility</span>
      </div>

      {/* Description */}
      <p className="text-white/65 leading-relaxed text-base" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {description}
      </p>

      {/* Rental equipment callout */}
      {rentalText && (
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}35` }}
        >
          <span className="text-2xl shrink-0">🎒</span>
          <div>
            <p className="font-bold text-sm" style={{ color: accentColor }}>Equipment Rental</p>
            <p className="text-white/65 text-xs mt-0.5 leading-relaxed">{rentalText}</p>
          </div>
        </div>
      )}

      {/* Feature list */}
      <div>
        <h3 className="text-white/40 text-xs uppercase tracking-[3px] font-bold mb-4">What's Included</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}40` }}
              >
                <CheckCircle2 size={13} style={{ color: accentColor }} />
              </div>
              <span className="text-white/75 text-sm font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Membership benefit teaser */}
      <div
        className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)' }}
      >
        <span className="text-2xl mt-0.5">🏅</span>
        <div>
          <p className="text-[#F5A623] font-bold text-sm">Members Get More</p>
          <p className="text-white/55 text-xs mt-0.5 leading-relaxed">
            Unlimited access, priority entry, and attendance tracking — all included with any membership plan.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
