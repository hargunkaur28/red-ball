import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SportCard from './SportCard';

const SCROLL_AMOUNT = 320;
const CARD_GAP = 20; // px — matches gap-5 (5 * 4 = 20px)

export default function SportsCarousel({ sports = [], linkPrefix = '/sports', showArrows = true, isMarquee = false }) {
  const scrollRef = useRef(null);
  const scrollPosRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * SCROLL_AMOUNT, behavior: 'smooth' });
    setTimeout(() => {
      if (scrollRef.current) scrollPosRef.current = scrollRef.current.scrollLeft;
    }, 500);
  };

  if (!sports.length) return null;

  // ── Marquee mode: pure CSS transform animation (GPU-composited, GIF-safe) ──
  if (isMarquee) {
    // Two identical copies. Each card has margin-right instead of gap so the
    // seam between copy1-end and copy2-start has identical spacing.
    // translateX(-50%) = exactly one copy's width → seamless loop.
    return (
      <div
        className="relative overflow-hidden pb-4 pt-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <style>{`
          @keyframes rb-marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        <div
          className="flex"
          style={{
            animation: 'rb-marquee 14s linear infinite',
            animationPlayState: isPaused ? 'paused' : 'running',
            willChange: 'transform',
          }}
        >
          {[...sports, ...sports].map((sport, i) => (
            <div
              key={`${sport._id}-${i}`}
              className="shrink-0 w-[75vw] max-w-70 sm:w-70"
              style={{ marginRight: CARD_GAP }}
            >
              <SportCard sport={sport} linkPrefix={linkPrefix} />
            </div>
          ))}
        </div>
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-4 w-12 bg-linear-to-r from-dark to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-16 bg-linear-to-l from-dark to-transparent" />
      </div>
    );
  }

  // ── Regular scrollable carousel ──
  return (
    <div className="relative group/carousel">
      {/* Left arrow */}
      {showArrows && (
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-dark-card border border-white/10 items-center justify-center text-white/70 hover:text-white hover:border-white/30 transition-all opacity-0 group-hover/carousel:opacity-100 shadow-xl"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Scrollable track */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 pt-2 px-1"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <style>{`.sports-scroll::-webkit-scrollbar { display: none; }`}</style>
        {sports.map((sport, i) => (
          <motion.div
            key={sport._id}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 w-[85vw] max-w-70 sm:w-auto"
            style={{ scrollSnapAlign: 'start' }}
          >
            <SportCard sport={sport} linkPrefix={linkPrefix} />
          </motion.div>
        ))}
        <div className="shrink-0 w-4" />
      </div>

      {/* Right arrow */}
      {showArrows && (
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="flex absolute right-1 lg:-right-5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-black/60 lg:bg-dark-card border border-white/20 items-center justify-center text-white/80 hover:text-white hover:border-white/40 transition-all lg:opacity-0 lg:group-hover/carousel:opacity-100 shadow-xl backdrop-blur-sm"
        >
          <ChevronRight size={16} className="lg:w-5 lg:h-5" />
        </button>
      )}

      <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-[#0D0D0D] to-transparent" />
    </div>
  );
}
