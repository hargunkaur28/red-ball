import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, ArrowRight, ScanLine, Dumbbell, Trophy, Feather, Target, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import useAuthStore from '../../store/authStore';
import SportIllustration from '../sports/SportIllustrations';

const cyclingWords = ['Passionately', 'Relentlessly', 'Confidently', 'Fearlessly', 'Proudly', 'Purposefully'];

const heroImages = [
  'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=1920&auto=format&fit=crop',
];

const landingItems = [
  {
    name: 'Order Food',
    href: '/table-portal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-9 h-9 text-[#F5A623]">
        <path d="M3 17h18c0-4.97-4.03-9-9-9s-9 4.03-9 9z" fill="currentColor" fillOpacity="0.1" />
        <path d="M12 8V5a1 1 0 0 1 1-1h1M3 17h18M5 20h14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: '#df1526',
    tagline: 'Fresh & Hot',
    fullWidth: true,
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: 'Box Cricket',
    href: '/sports/box-cricket',
    icon: <SportIllustration slug="cricket" color="#C8102E" className="w-[80%] h-[80%] drop-shadow-md" />,
    color: '#C8102E',
    tagline: 'Play & Train',
  },
  {
    name: 'Badminton',
    href: '/sports/badminton',
    icon: <SportIllustration slug="badminton" color="#E84393" className="w-[80%] h-[80%] drop-shadow-md" />,
    color: '#E84393',
    tagline: 'AC Courts',
  },
  {
    name: 'Pickleball',
    href: '/sports/pickleball',
    icon: <SportIllustration slug="pickleball" color="#A855F7" className="w-[80%] h-[80%] drop-shadow-md" />,
    color: '#A855F7',
    tagline: 'Cushioned',
  },
  {
    name: 'Swimming',
    href: '/sports/swimming',
    icon: <SportIllustration slug="swimming" color="#0EA5E9" className="w-[80%] h-[80%] drop-shadow-md" />,
    color: '#0EA5E9',
    tagline: 'Heated Pool',
  },
  {
    name: 'All Services',
    href: '/sports/all-services',
    icon: <SportIllustration slug="all" color="#F5A623" className="w-[80%] h-[80%] drop-shadow-md" />,
    color: '#F5A623',
    tagline: 'VIP Access',
  },
  {
    name: 'Gym & Fitness',
    href: '/sports/gym',
    icon: <SportIllustration slug="gym" color="#F5A623" className="w-[80%] h-[80%] drop-shadow-md" />,
    color: '#F5A623',
    tagline: 'AC Facility',
  },
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
            alt="Red Ball Academy"
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
      <div className="relative z-20 flex-1 flex items-center pt-16 sm:pt-20 md:pt-24 lg:pt-28 pb-6 md:pb-12 w-full">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 w-full flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 md:gap-12 w-full pt-0">
          <div className="max-w-[700px] flex-shrink-0 mt-0">

            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="uppercase tracking-[6px] text-[13px] text-[#F5A623] mb-6"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Welcome to Red Ball Academy
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
              className="flex flex-col items-start gap-3 sm:gap-4"
            >
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 w-full pr-4 sm:pr-0">
                <Link
                  to={isAuthenticated ? "/user/book-slots" : "/book-slots"}
                  className="w-full sm:w-auto px-6 py-3.5 sm:px-8 rounded-full bg-[#C8102E] text-white text-sm sm:text-base font-semibold transition-all duration-200 hover:bg-[#8B0B1E] hover:scale-[1.04] hover:shadow-[0_0_20px_rgba(200,16,46,0.45)] flex items-center justify-center gap-2"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  🏏 Book a Sport
                </Link>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  {isAuthenticated ? (
                    <Link
                      to={user?.role === 'superadmin' ? '/super-admin' : user?.role === 'manager' ? '/restaurant' : '/user'}
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
                className="hidden sm:flex text-sm font-bold text-[#F5A623] bg-black/40 backdrop-blur-md hover:text-black hover:bg-[#F5A623] items-center gap-2 transition-all ml-0 px-5 py-2.5 rounded-full border border-[#F5A623]/50 hover:border-[#F5A623] shadow-[0_0_15px_rgba(245,166,35,0.15)] hover:shadow-[0_0_20px_rgba(245,166,35,0.4)]"
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
            className="w-full md:max-w-[450px] mt-4 md:mt-0 md:max-h-none md:overflow-visible overflow-y-auto max-h-[65vh] pr-2 scrollbar-none"
          >
            <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full">
              {landingItems.map((item, idx) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + idx * 0.08 }}
                  className={item.fullWidth ? 'col-span-2' : ''}
                >
                  <Link
                    to={item.href}
                    className={`relative overflow-hidden p-3 sm:p-4 flex items-center hover:scale-[1.04] transition-all duration-300 shadow-2xl group cursor-pointer ${
                      item.fullWidth
                        ? 'rounded-[20px] flex-row justify-between h-[76px] sm:h-[95px] bg-cover bg-center bg-no-repeat'
                        : 'rounded-2xl flex-row gap-2.5 sm:gap-3.5 h-[68px] sm:h-[84px] bg-black/30 backdrop-blur-md hover:bg-black/50 border border-white/10 hover:border-white/20 hover:shadow-[0_10px_25px_rgba(200,16,46,0.25)]'
                    }`}
                    style={item.image ? { backgroundImage: `url(${item.image})` } : {}}
                  >
                    {item.fullWidth ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-transparent z-0" />
                        <div className="relative z-10 flex items-center justify-between w-full">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center bg-black/30 shrink-0">
                              {item.icon}
                            </div>
                            <div>
                              <h3 className="text-white font-extrabold text-[15px] sm:text-base leading-tight group-hover:text-[#F5A623] transition-colors">{item.name}</h3>
                              <p className="text-[#F5A623] text-[10px] sm:text-[11px] uppercase tracking-widest font-extrabold mt-0.5">{item.tagline}</p>
                            </div>
                          </div>
                          <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#df1526] hover:bg-[#8B0B1E] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-full transition-colors flex items-center gap-1 shrink-0 shadow-lg">
                            Order Now
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[14px] sm:rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center shrink-0">
                          {item.icon}
                        </div>
                        <div className="text-left">
                          <h3 className="text-white font-extrabold text-[13px] sm:text-[15px] leading-tight group-hover:text-[#F5A623] transition-colors">{item.name}</h3>
                          <p className="text-white/45 text-[8.5px] sm:text-[9px] uppercase tracking-wider font-semibold mt-0.5">{item.tagline}</p>
                        </div>
                      </>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
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
