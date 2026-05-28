import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SportCard from './SportCard';

const SCROLL_AMOUNT = 320;
const CARD_GAP = 20;
const CARD_WIDTH = 280;
const MARQUEE_SPEED = 1.5; // px per frame @ 60fps

export default function SportsCarousel({ sports = [], linkPrefix = '/sports', showArrows = true, isMarquee = false }) {
  const scrollRef = useRef(null);
  const scrollPosRef = useRef(0);

  // ── Marquee refs ──
  const trackRef = useRef(null);
  const posRef = useRef(0);
  const pausedRef = useRef(false);
  const touchXRef = useRef(0);
  const animIdRef = useRef(null);

  useEffect(() => {
    if (!isMarquee) return;

    const step = () => {
      if (!pausedRef.current && trackRef.current) {
        posRef.current += MARQUEE_SPEED;
        const halfWidth = trackRef.current.scrollWidth / 2;
        if (posRef.current >= halfWidth) posRef.current = 0;
        trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
      }
      animIdRef.current = requestAnimationFrame(step);
    };

    animIdRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animIdRef.current);
  }, [isMarquee]);

  const handleTouchStart = (e) => {
    pausedRef.current = true;
    touchXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!trackRef.current) return;
    const dx = touchXRef.current - e.touches[0].clientX;
    touchXRef.current = e.touches[0].clientX;
    posRef.current = Math.max(0, posRef.current + dx);
    const halfWidth = trackRef.current.scrollWidth / 2;
    if (posRef.current >= halfWidth) posRef.current = 0;
    trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
  };

  const handleTouchEnd = () => {
    setTimeout(() => { pausedRef.current = false; }, 1500);
  };

  const handleMarqueeNext = () => {
    if (!trackRef.current) return;
    posRef.current = Math.min(
      trackRef.current.scrollWidth / 2 - 1,
      posRef.current + CARD_WIDTH + CARD_GAP
    );
    trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
  };

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * SCROLL_AMOUNT, behavior: 'smooth' });
    setTimeout(() => {
      if (scrollRef.current) scrollPosRef.current = scrollRef.current.scrollLeft;
    }, 500);
  };

  if (!sports.length) return null;

  // ── Marquee mode: rAF + translateX (GPU-composited, touch-draggable, GIF-safe) ──
  if (isMarquee) {
    return (
      <div
        className="relative overflow-hidden pb-4 pt-2"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={trackRef}
          className="flex"
          style={{ willChange: 'transform' }}
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

        {/* Next button — mobile only */}
        <button
          onClick={handleMarqueeNext}
          aria-label="Next"
          className="lg:hidden flex absolute right-2 top-1/2 -translate-y-[calc(50%+8px)] z-20 w-9 h-9 rounded-full bg-black/70 border border-white/20 items-center justify-center text-white shadow-xl backdrop-blur-sm"
        >
          <ChevronRight size={18} />
        </button>

        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-4 w-10 bg-linear-to-r from-dark to-transparent" />
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
