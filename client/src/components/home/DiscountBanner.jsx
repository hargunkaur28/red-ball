import { useQuery } from '@tanstack/react-query';
import { Tag, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/axios';

const BANNER_H = 40;
const COPIES = 6;
const SPEED = 80; // px/s — adjust to taste

function generateText(d) {
  const now = new Date();
  const end = new Date(d.endDate);
  const start = new Date(d.startDate);
  const hoursLeft = (end - now) / (1000 * 60 * 60);
  const daysLeft = hoursLeft / 24;
  const isWeekendEnd = [0, 6].includes(end.getDay());

  let timeLabel;
  if (hoursLeft <= 6)                     timeLabel = 'ending soon!';
  else if (hoursLeft <= 24)               timeLabel = 'today only!';
  else if (daysLeft <= 2 && isWeekendEnd) timeLabel = 'this weekend!';
  else if (daysLeft <= 2)                 timeLabel = 'next 2 days!';
  else if (daysLeft <= 7)                 timeLabel = `${Math.ceil(daysLeft)} days left!`;
  else {
    const fmt = (dt) => dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    timeLabel = `${fmt(start)} – ${fmt(end)}`;
  }
  return `${d.sportNameSnapshot} bookings — ${timeLabel}`;
}

export default function DiscountBanner() {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const posRef = useRef(0);
  const lastTsRef = useRef(null);

  const { data } = useQuery({
    queryKey: ['public-discounts-banner'],
    queryFn: () => api.get('/sports/discounts/public').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const discounts = data?.discounts || [];
  const active = discounts.filter((d) => d.isActive);
  const visible = active.length > 0 && !dismissed;

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--discount-banner-h',
      visible ? `${BANNER_H}px` : '0px'
    );
    return () => document.documentElement.style.setProperty('--discount-banner-h', '0px');
  }, [visible]);

  // RAF scroll — pixel-exact, immune to CSS percentage quirks on any screen size
  useEffect(() => {
    if (!visible) return;
    const el = trackRef.current;
    if (!el) return;

    // One rAF to let the DOM paint and measure real scrollWidth
    const init = requestAnimationFrame(() => {
      const copyWidth = el.scrollWidth / COPIES;
      if (copyWidth <= 0) return;

      posRef.current = 0;
      lastTsRef.current = null;

      const tick = (ts) => {
        if (lastTsRef.current !== null) {
          posRef.current += (SPEED * (ts - lastTsRef.current)) / 1000;
          if (posRef.current >= copyWidth) posRef.current -= copyWidth;
          el.style.transform = `translateX(-${posRef.current}px)`;
        }
        lastTsRef.current = ts;
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(init);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [visible, active.length]);

  if (!visible) return null;

  const items = active.map((d) => ({
    text: generateText(d),
    sportSlug: d.sportSlug,
    percent: d.discountPercent,
  }));

  const track = Array.from({ length: COPIES }, () => items).flat();

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center overflow-hidden"
      style={{
        height: BANNER_H,
        background: 'linear-gradient(90deg, #1a0a0c 0%, #2d0d12 50%, #1a0a0c 100%)',
        borderBottom: '1px solid rgba(200,16,46,0.25)',
      }}
    >
      {/* Left pill */}
      <div className="shrink-0 flex items-center gap-2 px-4 self-stretch" style={{ background: '#C8102E' }}>
        <Tag size={13} className="text-white" />
        <span className="text-white text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
          Live Offers
        </span>
      </div>

      {/* Marquee — driven by RAF, not CSS animation */}
      <div className="flex-1 overflow-hidden self-stretch flex items-center">
        <div
          ref={trackRef}
          style={{ display: 'flex', whiteSpace: 'nowrap', willChange: 'transform' }}
        >
          {track.map((item, i) => (
            <button
              key={i}
              onClick={() => item.sportSlug && navigate(`/sports/${item.sportSlug}`)}
              className="inline-flex items-center text-[12px] font-semibold text-white/80 hover:text-white transition-colors shrink-0 px-8"
            >
              <span className="font-black mr-2" style={{ color: '#F5A623' }}>
                {item.percent}% OFF
              </span>
              <span>{item.text}</span>
              <span className="ml-8" style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 px-3 self-stretch flex items-center text-white/30 hover:text-white/70 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
