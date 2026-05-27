import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import api from '../lib/axios';
import SportHeroGallery from '../components/sports/SportHeroGallery';
import SportDetailsSection from '../components/sports/SportDetailsSection';
import SportBookingOptions from '../components/sports/SportBookingOptions';
import SportsCarousel from '../components/sports/SportsCarousel';
import { getSportFallback } from '../components/sports/sportFallbacks';

export default function SportDetailPage({ embedded = false }) {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-sport', slug],
    queryFn: () => api.get(`/sports/public/${slug}`).then((r) => r.data),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const sport = data?.sport;
  const plans = data?.plans || [];

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0A0D0D' }}
      >
        <div className="flex flex-col items-center gap-4 text-white/30">
          <Loader2 size={32} className="animate-spin" />
          <p className="text-sm">Loading facility details...</p>
        </div>
      </div>
    );
  }

  if (isError || !sport) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0A0D0D' }}
      >
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <AlertTriangle size={40} className="text-[#C8102E]" />
          <h2 className="text-white font-black text-2xl">Facility Not Found</h2>
          <p className="text-white/40 text-sm">This sport or facility may not be available.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl bg-[#C8102E] text-white font-bold text-sm mt-2 hover:bg-[#a00d24] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const fallback = getSportFallback(sport.slug || sport.name);
  const rentalText = sport.rentalEquipment || fallback.rentalEquipment || '';
  const accentColor = fallback.color || '#C8102E';
  const backHref = embedded ? '/user/book-slots' : '/book-slots';

  return (
    <div className="min-h-screen relative" style={{ background: '#0A0D0D' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
      `}</style>

      {/* Back button */}
      <div className="absolute left-4 top-4 sm:top-6 z-40">
        <Link
          to={backHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white/70 hover:text-white transition-all backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <ArrowLeft size={15} />
          All Sports
        </Link>
      </div>

      {/* Hero gallery */}
      <SportHeroGallery sport={sport} />

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* Mobile-only rental callout — shown above booking buttons */}
        {rentalText && (
          <div
            className="lg:hidden mb-6 rounded-2xl p-4 flex items-center gap-3"
            style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}35` }}
          >
            <span className="text-2xl shrink-0">🎒</span>
            <div>
              <p className="font-bold text-sm" style={{ color: accentColor, fontFamily: "'DM Sans', sans-serif" }}>Equipment Rental</p>
              <p className="text-white/65 text-xs mt-0.5 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{rentalText}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* Left — details: below booking on mobile, left on desktop */}
          <div className="order-2 lg:order-1">
            <SportDetailsSection sport={sport} />
          </div>

          {/* Right — booking: first on mobile, right on desktop */}
          <div
            id="booking"
            className="order-1 lg:order-2 lg:sticky lg:top-8 rounded-3xl p-6 sm:p-8"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <p
              className="text-white/40 text-xs uppercase tracking-[3px] font-bold mb-6"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Book Your Session
            </p>
            <SportBookingOptions sport={sport} plans={plans} />
          </div>
        </div>
      </div>

      {/* Similar sports carousel */}
      <SimilarSports currentSlug={slug} />
    </div>
  );
}

function SimilarSports({ currentSlug }) {
  const { data } = useQuery({
    queryKey: ['public-sports'],
    queryFn: () => api.get('/sports/public').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const others = (data?.sports || []).filter(
    (s) => s.slug !== currentSlug && s.name?.toLowerCase() !== 'coaching'
  );
  if (!others.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="mb-6">
        <p className="text-white/30 text-xs uppercase tracking-[4px] font-bold mb-1">Explore More</p>
        <h3
          className="text-white font-black text-2xl"
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '1px' }}
        >
          Other Facilities
        </h3>
      </div>
      <SportsCarousel sports={others} showArrows />
    </section>
  );
}
