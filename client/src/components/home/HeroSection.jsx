import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ArrowRight, ScanLine, Dumbbell, Trophy, Feather, Target, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';

const cyclingWords = ['Passionately', 'Relentlessly', 'Confidently', 'Fearlessly', 'Proudly', 'Purposefully'];

const heroImages = [
  'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=1920&auto=format&fit=crop',
];

export default function HeroSection() {
  const getSportIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('gym') || n.includes('fitness')) return <Dumbbell size={22} className="text-[#F5A623]" />;
    if (n.includes('badminton')) return <Feather size={22} className="text-[#0EA5E9]" />;
    if (n.includes('cricket')) return <Target size={22} className="text-[#C8102E]" />;
    if (n.includes('pickleball')) return <Trophy size={22} className="text-[#10B981]" />;
    if (n.includes('all')) return <Layers size={22} className="text-[#8B5CF6]" />;
    return <Trophy size={22} className="text-[#F5A623]" />;
  };

  const { isAuthenticated, user } = useAuthStore();
  const [wordIndex, setWordIndex] = useState(0);
  const [animClass, setAnimClass] = useState('word-enter');
  const [bgIndex, setBgIndex] = useState(0);

  // Fetch public sports
  const { data: sportsData } = useQuery({
    queryKey: ['public-sports'],
    queryFn: () => api.get('/sports/public').then((r) => r.data),
  });
  const sports = sportsData?.sports || [];

  // Cycling word animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimClass('word-exit');
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % cyclingWords.length);
        setAnimClass('word-enter');
      }, 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Background image carousel fallback
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % heroImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Split headline words for stagger animation
  const line1Words = useMemo(() => 'Achieve Your Best.'.split(' '), []);
  const line2Words = useMemo(() => 'Play. Train. Dominate.'.split(' '), []);

  return (
    <section id="hero" className="relative w-full min-h-[100dvh] md:h-screen overflow-hidden flex flex-col">
      {/* Background Images with fade */}
      {heroImages.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: bgIndex === i ? 1 : 0 }}
        >
          <img
            src={img}
            alt="Red Ball Cricket Academy"
            className="w-full h-full object-cover"
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 60%, rgba(200,16,46,0.15) 100%)',
        }}
      />

      {/* Hero Content */}
      <div className="relative z-20 flex-1 flex items-center pt-24 md:pt-0 pb-8 md:pb-0 w-full">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 w-full flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 w-full pt-4 md:pt-0">
          <div className="max-w-[700px] flex-shrink-0 mt-4 md:mt-0">

            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="uppercase tracking-[6px] text-[13px] text-[#F5A623] mb-6"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Welcome to Red Ball Cricket Academy
            </motion.p>

            {/* Main Headline — Line 1 */}
            <div className="overflow-hidden mb-2">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {line1Words.map((word, i) => (
                  <motion.span
                    key={word + i}
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="hero-heading text-white"
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Main Headline — Line 2 (red) */}
            <div className="overflow-hidden mb-6">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {line2Words.map((word, i) => (
                  <motion.span
                    key={word + i}
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: (line1Words.length + i) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className="hero-heading text-[#C8102E]"
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Cycling Word */}
            <div className="mb-8 h-12">
              <span
                className={`inline-block text-white tracking-[4px] ${animClass}`}
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px' }}
              >
                {cyclingWords[wordIndex]}.
              </span>
            </div>

            {/* Sub-text */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-[18px] md:text-[18px] text-white/85 max-w-[540px] leading-relaxed mb-8"
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(15px, 2vw, 18px)' }}
            >
              Book a ground by the hour. Join a membership. Dine at our restaurant
              — everything your game needs, all in one place.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col items-start gap-5"
            >
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 w-full pr-4 sm:pr-0">
                <Link
                  to={isAuthenticated ? "/user/book-slots" : "/book-slots"}
                  className="w-full sm:w-auto px-6 py-3.5 sm:px-8 rounded-full bg-[#C8102E] text-white text-sm sm:text-base font-semibold transition-all duration-200 hover:bg-[#8B0B1E] hover:scale-[1.04] hover:shadow-[0_0_20px_rgba(200,16,46,0.45)] flex items-center justify-center gap-2"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  🏏 Book a Ground
                </Link>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  {isAuthenticated ? (
                    <Link
                      to={user?.role === 'superadmin' ? '/super-admin' : user?.role === 'admin' ? '/admin' : user?.role === 'manager' ? '/restaurant' : user?.role === 'receptionist' ? '/reception' : '/user'}
                      className="flex-1 sm:flex-none justify-center flex items-center px-4 sm:px-8 py-3.5 rounded-full border-2 border-[#F5A623] text-[#F5A623] text-sm sm:text-base font-semibold transition-all duration-200 hover:bg-[#F5A623] hover:text-black hover:scale-[1.04]"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      to="/login?mode=register"
                      className="flex-1 sm:flex-none justify-center flex items-center px-4 sm:px-8 py-3.5 rounded-full border-2 border-[#F5A623] text-[#F5A623] text-sm sm:text-base font-semibold transition-all duration-200 hover:bg-[#F5A623] hover:text-black hover:scale-[1.04]"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Join Now
                    </Link>
                  )}
                  
                  {/* Mobile-only QR Button */}
                  <Link
                    to={isAuthenticated ? "/user/scan" : "/login?redirectTo=/user/scan"}
                    className="flex-1 justify-center flex sm:hidden items-center px-3 py-3.5 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white text-sm font-semibold transition-all hover:bg-white/20 gap-2"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <ScanLine size={18} className="shrink-0" /> Check-In
                  </Link>
                </div>
              </div>
              
              {/* Desktop-only simple link */}
              <Link
                to={isAuthenticated ? "/user/scan" : "/login?redirectTo=/user/scan"}
                className="hidden sm:flex text-sm font-bold text-[#F5A623] hover:text-white items-center gap-2 transition-colors ml-2 mt-1"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <ScanLine size={18} /> Check-In via QR Code
              </Link>
            </motion.div>
          </div>

          {/* Right side: Sports List */}
          <motion.div 
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="w-full md:max-w-[400px] mt-8 md:mt-0 max-h-[50vh] md:max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          >
            {sports.length > 0 ? (
              <>
                {/* Mobile View: 3x3 Grid */}
                <div className="grid grid-cols-3 gap-2 md:hidden">
                  {sports.filter(s => s.slug !== 'coaching' && s.name.toLowerCase() !== 'coaching').slice(0, 9).map((sport, idx) => (
                    <Link 
                      to={`/sports/${sport.slug}`}
                      key={`mob-${sport._id}`} 
                    >
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.7 + idx * 0.1 }}
                        className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-2 sm:p-4 flex flex-col items-center justify-center text-center hover:bg-black/60 hover:border-[#C8102E] hover:shadow-[0_0_20px_rgba(200,16,46,0.2)] transition-all duration-300 group aspect-square"
                      >
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1.5 sm:mb-3 group-hover:scale-110 group-hover:bg-[#C8102E]/20 group-hover:text-[#C8102E] group-hover:border-[#C8102E]/50 transition-all duration-300 [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-6 sm:[&>svg]:h-6">
                          {getSportIcon(sport.name)}
                        </div>
                        <h3 className="text-white font-bold text-[10px] sm:text-[13px] leading-tight group-hover:text-[#F5A623] transition-colors line-clamp-1">{sport.name}</h3>
                        <p className="text-white/40 text-[7px] sm:text-[9px] uppercase tracking-widest font-bold mt-1 group-hover:text-white/70">Play</p>
                      </motion.div>
                    </Link>
                  ))}
                </div>

                {/* Desktop View: Vertical List */}
                <div className="hidden md:flex flex-col gap-3">
                  {sports.filter(s => s.slug !== 'coaching' && s.name.toLowerCase() !== 'coaching').map((sport, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.7 + idx * 0.1 }}
                      key={`desk-${sport._id}`} 
                      className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-black/50 hover:border-white/20 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner shadow-white/5">
                          {getSportIcon(sport.name)}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg leading-tight group-hover:text-[#F5A623] transition-colors">{sport.name}</h3>
                          <p className="text-white/50 text-[10px] uppercase tracking-wider font-bold">Play & Train</p>
                        </div>
                      </div>
                      <Link to={`/sports/${sport.slug}`} className="px-4 py-2 bg-white/10 hover:bg-[#C8102E] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-white/10 hover:border-[#C8102E] flex items-center gap-1 shrink-0">
                        Book <ArrowRight size={14} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center w-full">
                <p className="text-white/60 text-sm font-bold uppercase tracking-widest">Loading Sports...</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <ChevronDown size={32} className="text-white animate-bounce-chevron" />
      </div>
    </section>
  );
}
