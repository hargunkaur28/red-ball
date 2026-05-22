import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SportCard from './SportCard';

const SCROLL_AMOUNT = 320;

export default function SportsCarousel({ sports = [], linkPrefix = '/sports', showArrows = true }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * SCROLL_AMOUNT, behavior: 'smooth' });
  };

  if (!sports.length) return null;

  return (
    <div className="relative group/carousel">
      {/* Left arrow */}
      {showArrows && (
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="hidden lg:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/10 items-center justify-center text-white/70 hover:text-white hover:border-white/30 transition-all opacity-0 group-hover/carousel:opacity-100 shadow-xl"
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
        <style>{`
          .sports-scroll::-webkit-scrollbar { display: none; }
        `}</style>
        {sports.map((sport, i) => (
          <motion.div
            key={sport._id}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 w-[85vw] max-w-[280px] sm:w-auto"
            style={{ scrollSnapAlign: 'start' }}
          >
            <SportCard sport={sport} linkPrefix={linkPrefix} />
          </motion.div>
        ))}

        {/* End spacer */}
        <div className="flex-shrink-0 w-4" />
      </div>

      {/* Right arrow */}
      {showArrows && (
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="hidden lg:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#1A1A1A] border border-white/10 items-center justify-center text-white/70 hover:text-white hover:border-white/30 transition-all opacity-0 group-hover/carousel:opacity-100 shadow-xl"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Fade edge — right */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-[#0D0D0D] to-transparent" />
    </div>
  );
}
