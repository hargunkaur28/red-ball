import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { getSportFallback } from './sportFallbacks';

export default function SportCard({ sport, linkPrefix = '/sports' }) {
  const fallback = getSportFallback(sport.slug || sport.name);
  const thumbnail = sport.thumbnail || fallback.thumbnail;
  const icon = sport.icon || fallback.icon;
  const tagline = sport.tagline || fallback.tagline;
  const accentColor = fallback.color || '#C8102E';

  const isHourly = sport.hourlyPrice > 0;
  const isThreeMonth = !isHourly && sport.threeMonthPrice > 0;
  const priceValue = isHourly 
    ? `${formatCurrency(sport.hourlyPrice)}/hr` 
    : isThreeMonth 
    ? `${formatCurrency(sport.threeMonthPrice)}/3mo` 
    : 'View Plans';

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex-shrink-0 w-full sm:w-72"
    >
      <Link
        to={`${linkPrefix}/${sport.slug}`}
        className="group block relative aspect-[4/5] sm:aspect-auto sm:h-96 rounded-2xl overflow-hidden bg-cover bg-center bg-no-repeat cursor-pointer select-none"
        style={{
          backgroundImage: `url(${thumbnail})`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px ${accentColor}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
        }}
      >
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90 group-hover:to-black/80 transition-colors duration-500" />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-500"
          style={{
            background: `linear-gradient(to top, ${accentColor} 0%, transparent 60%)`,
          }}
        />

        {/* Top row: price badge */}
        <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 flex items-start justify-end z-10">
          <div
            className="px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl sm:rounded-full text-[10px] sm:text-[11px] font-bold shadow-lg backdrop-blur-sm flex flex-col sm:block text-center sm:text-left whitespace-nowrap"
            style={{ background: `${accentColor}CC`, color: '#fff' }}
          >
            {(isHourly || isThreeMonth) && (
              <span className="text-[8px] sm:text-inherit opacity-80 uppercase sm:normal-case block sm:inline leading-[1.1] sm:mr-1">From</span>
            )}
            <span className="leading-[1.1]">{priceValue}</span>
          </div>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 z-10">
          <p className="hidden sm:block text-white/50 text-[11px] uppercase tracking-[3px] mb-1 font-semibold">
            {tagline}
          </p>
          <h3
            className="text-white text-lg sm:text-2xl font-black leading-tight mb-2 sm:mb-3 truncate"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}
          >
            {sport.name}
          </h3>
          <div
            className="inline-flex items-center justify-center sm:justify-start gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full transition-all duration-300 group-hover:gap-2.5"
            style={{
              background: `${accentColor}22`,
              border: `1px solid ${accentColor}50`,
              color: accentColor,
            }}
          >
            Explore
            <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
