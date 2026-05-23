import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { getSportFallback } from './sportFallbacks';

export default function SportHeroGallery({ sport }) {
  const fallback = getSportFallback(sport?.slug || sport?.name || '');
  const heroImage = sport?.heroImage || fallback.heroImage;
  const images = (sport?.images?.length ? sport.images : fallback.images) || [];
  const icon = sport?.icon || fallback.icon;
  const chips = fallback.chips;
  const accentColor = fallback.color || '#C8102E';

  const allImages = [heroImage, ...images.filter((img) => img !== heroImage)];
  const [activeIndex, setActiveIndex] = useState(0);

  const prev = () => setActiveIndex((i) => (i - 1 + allImages.length) % allImages.length);
  const next = () => setActiveIndex((i) => (i + 1) % allImages.length);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 'clamp(360px, 60vh, 580px)' }}>
      {/* Main image */}
      {allImages.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={sport?.name}
          loading={i === 0 ? 'eager' : 'lazy'}
          onError={(e) => { e.currentTarget.style.opacity = '0'; }}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: i === activeIndex ? 1 : 0 }}
        />
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D0D] via-[#0A0D0D]/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D0D]/60 via-transparent to-transparent" />

      {/* Gallery nav arrows (only if multiple images) */}
      {allImages.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 sm:left-4 top-[40%] sm:top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 sm:right-4 top-[40%] sm:top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/70 transition-all"
          >
            <ChevronRight size={18} />
          </button>
          {/* Dots */}
          <div className="absolute bottom-5 sm:bottom-8 right-4 sm:right-6 flex gap-1.5 z-20">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i === activeIndex ? accentColor : 'rgba(255,255,255,0.3)',
                  transform: i === activeIndex ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Bottom content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 pb-5 sm:pb-8 pt-20 z-10"
      >
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <h1
            className="text-white font-black leading-none truncate pr-4"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(2.5rem, 8vw, 5.5rem)',
              letterSpacing: '1px',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}
          >
            {sport?.name}
          </h1>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 pr-14 sm:pr-24">
          {chips.map((chip) => (
            <span
              key={chip}
              className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold backdrop-blur-sm border"
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
