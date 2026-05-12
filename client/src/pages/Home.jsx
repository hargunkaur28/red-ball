import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CinematicIntro from '../components/CinematicIntro';
import { 
  ArrowRight, 
  Sparkles, 
  Activity, 
  Utensils, 
  TrendingUp, 
  Star, 
  ChevronRight, 
  QrCode, 
  ShoppingBag,
  ShieldCheck,
  Check,
  Flame,
  Trophy,
  Zap
} from 'lucide-react';

// Premium Sports data with customized rich vibrant color tokens
const sportsShowcase = [
  {
    title: 'Cricket Arena',
    subtitle: 'ICC-Standard Turf & Floodlights',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1200&auto=format&fit=crop',
    stats: 'Pitch Speed Tracking • Video Analysis',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    accentColor: 'text-[#DC2626]',
    lightBloom: 'from-red-500/10'
  },
  {
    title: 'Football Turf',
    subtitle: 'FIFA-Certified Artificial Grass',
    image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=1200&auto=format&fit=crop',
    stats: '5v5 & 7v7 Configurations • Premium Dugouts',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    accentColor: 'text-emerald-600',
    lightBloom: 'from-emerald-500/10'
  },
  {
    title: 'Badminton Courts',
    subtitle: 'BWF-Approved Wooden Flooring with Synthetic Mats',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
    stats: 'Anti-Glare LED Lighting • Air-Conditioned',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    accentColor: 'text-indigo-600',
    lightBloom: 'from-indigo-500/10'
  },
  {
    title: 'Aquatic Center',
    subtitle: 'Olympic-Length Temperature Controlled Pool',
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=1200&auto=format&fit=crop',
    stats: 'Dedicated Lanes • Professional Lifeguards',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    accentColor: 'text-cyan-600',
    lightBloom: 'from-cyan-500/10'
  },
];

// Luxury Memberships with dynamic premium tiers
const memberships = [
  {
    name: 'Monthly Pass',
    price: '4,500',
    period: 'month',
    desc: 'Perfect for short-term access and standard practice flex.',
    features: ['Access to 2 selected sports', 'Standard booking slots', 'Restaurant table access', 'GST Included'],
    popular: false,
    badgeBg: 'bg-slate-100 text-slate-700'
  },
  {
    name: 'Quarterly Pro',
    price: '11,500',
    period: 'quarter',
    desc: 'Dedicated athletes seeking regular high-intensity live sessions.',
    features: ['Access to all core sports', 'Priority slot selection', '10% off restaurant orders', 'Free net bowling sessions', 'GST Included'],
    popular: true,
    badgeBg: 'bg-amber-100 text-amber-800'
  },
  {
    name: 'Half-Yearly Elite',
    price: '21,000',
    period: '6 months',
    desc: 'Complete multi-tier academy life integration for advanced players.',
    features: ['Unlimited multi-sport access', 'Advanced performance tracking', '15% off restaurant & merchandise', 'Complimentary guest passes', 'GST Included'],
    popular: false,
    badgeBg: 'bg-purple-100 text-purple-800'
  },
  {
    name: 'Annual Legend',
    price: '38,000',
    period: 'year',
    desc: 'The ultimate fully featured luxury multi-sport club key tier.',
    features: ['VIP absolute multi-sport access', 'Personal locker & kit management', '25% premium dining discount', 'Direct line to master coaches', 'Exclusive corporate events access', 'GST Included'],
    popular: false,
    badgeBg: 'bg-rose-100 text-rose-800'
  },
];

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('Quarterly Pro');
  const [scrolled, setScrolled] = useState(false);

  const handleIntroComplete = () => {
    sessionStorage.setItem('rb_intro_played', 'true');
    setShowIntro(false);
  };

  // Track scroll for cinematic floating navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track mouse position for subtle dynamic multi-colored lighting gradients
  const handleMouseMove = (e) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top } = currentTarget.getBoundingClientRect();
    setMousePosition({
      x: clientX - left,
      y: clientY - top,
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#111111] font-sans selection:bg-[#DC2626] selection:text-white overflow-hidden relative">
      
      {/* ── CINEMATIC LAUNCH INTRO OVERLAY ────────────────────────────── */}
      {showIntro && (
        <CinematicIntro onComplete={handleIntroComplete} />
      )}

      {/* ── NAVBAR (Placed outside transformed containers to ensure absolute browser viewport sticky context) ── */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-6 left-0 right-0 z-50 px-4 md:px-8 pointer-events-auto"
      >
        <div className={`max-w-6xl mx-auto rounded-full transition-all duration-500 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 ${
          scrolled 
            ? 'bg-white/85 backdrop-blur-xl border border-[#EAEAEA] shadow-[0_10px_30px_rgba(220,38,38,0.06)]' 
            : 'bg-transparent border border-transparent'
        }`}>
          {/* Brand Logo with multi-colored halo highlight */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#DC2626] to-amber-500 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)] group-hover:scale-105 transition-all duration-300">
              RB
            </div>
            <span className="text-sm font-semibold tracking-widest text-[#111111] uppercase font-mono group-hover:text-[#DC2626] transition-colors">
              Red Ball
            </span>
          </Link>

          {/* Elegant Pill Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-[#EAEAEA] shadow-2xs">
            {['Home', 'Showcase', 'Memberships', 'Restaurant', 'Ecosystem'].map((item) => (
              <a 
                key={item} 
                href={item === 'Home' ? '#' : `#${item.toLowerCase()}`}
                className="px-4 py-1.5 text-xs font-medium text-[#666666] hover:text-[#DC2626] transition-colors relative group"
              >
                {item}
                <span className="absolute bottom-1 left-4 right-4 h-[1.5px] bg-gradient-to-r from-[#DC2626] to-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 rounded-full" />
              </a>
            ))}
          </nav>

          {/* CTA Actions */}
          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className="px-4 py-2 text-xs font-medium text-[#666666] hover:text-[#DC2626] transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link 
              to="/login" 
              className="relative px-5 py-2.5 rounded-full bg-gradient-to-r from-[#111111] to-[#222222] hover:from-[#DC2626] hover:to-[#EA580C] text-white text-xs font-bold tracking-wider uppercase overflow-hidden group shadow-md transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2.5 border border-white/10"
            >
              <span className="relative z-10">Book Portal</span>
              <ArrowRight size={13} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Main Content Organic Reveal Wrapper */}
      <motion.div
        initial={showIntro ? { opacity: 0, filter: 'blur(20px)', scale: 1.04 } : { opacity: 1, filter: 'blur(0px)', scale: 1 }}
        animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: showIntro ? 0.15 : 0 }}
        className="relative z-10"
      >
      
      {/* Dynamic Background Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#E0E0E0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
      
      {/* Vibrant Multi-Color Ambient Illumination Blooms */}
      <div className="absolute top-[-5%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-[#DC2626]/8 via-amber-500/8 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tl from-indigo-500/8 via-rose-500/8 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[10%] w-[35vw] h-[35vw] rounded-full bg-gradient-to-tr from-emerald-500/6 via-cyan-500/6 to-transparent blur-[130px] pointer-events-none" />

      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      <section 
        onMouseMove={handleMouseMove}
        className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-6 md:px-12 max-w-7xl mx-auto"
      >
        {/* Dynamic Multi-color cursor-following illumination mesh */}
        <div 
          className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-r from-[#DC2626]/8 via-amber-500/8 to-purple-500/6 blur-[100px] pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: `${mousePosition.x - 200}px`,
            top: `${mousePosition.y - 200}px`,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start w-full relative z-10">
          
          {/* Left Column: Rich Gradient Typography & Custom Accents */}
          <div className="lg:col-span-7 space-y-8 text-left">

            {/* Massive Split Text Reveal with beautiful color gradients */}
            <div className="space-y-1 sm:space-y-2">
              <div className="overflow-hidden">
                <motion.h1 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                  className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl serif-heading text-[#111111] tracking-tight uppercase leading-[0.95] sm:leading-[0.9]"
                >
                  PLAY <span className="bg-gradient-to-r from-amber-600 to-[#DC2626] bg-clip-text text-transparent">BOLDER.</span>
                </motion.h1>
              </div>
              <div className="overflow-hidden">
                <motion.h1 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                  className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl serif-heading tracking-tight uppercase leading-[0.95] sm:leading-[0.9] text-[#111111]"
                >
                  TRAIN <span className="bg-gradient-to-r from-[#DC2626] via-rose-600 to-amber-500 bg-clip-text text-transparent">HARDER.</span>
                </motion.h1>
              </div>
            </div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-base md:text-lg text-[#555555] max-w-xl font-normal leading-relaxed font-sans"
            >
              Book highly tailored high-contrast sports arenas, track competitive vector metrics, enroll in recurring tiered club keys, and trigger our proprietary active QR-POS culinary framework.
            </motion.p>

            {/* Vibrant Multi-Color Hero CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65 }}
              className="flex flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-2"
            >
              <Link 
                to="/login"
                className="w-full sm:w-auto justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#DC2626] via-[#EA580C] to-[#DC2626] bg-[length:200%_auto] hover:bg-[position:right_center] text-white text-xs font-bold tracking-widest uppercase transition-all duration-500 shadow-[0_6px_25px_rgba(220,38,38,0.35)] hover:shadow-[0_8px_30px_rgba(234,88,12,0.45)] hover:scale-105 active:scale-95 flex items-center gap-3 group border border-white/10"
              >
                <span>Reserve Arena</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#memberships"
                className="w-full sm:w-auto justify-center px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white hover:bg-amber-50/50 border border-amber-200/60 text-[#111111] text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-sm flex items-center gap-2 group hover:text-amber-700"
              >
                <Trophy size={13} className="text-amber-500 group-hover:scale-110 transition-transform" />
                <span>Club Memberships</span>
              </a>
            </motion.div>

            {/* Micro details colorful metrics */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="grid grid-cols-3 gap-2.5 sm:gap-6 pt-8 sm:pt-10 border-t border-[#EAEAEA] max-w-lg"
            >
              <div className="p-2 sm:p-3 rounded-2xl bg-white border border-red-100 shadow-2xs">
                <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                  <Flame size={12} className="text-[#DC2626] shrink-0" />
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-tighter sm:tracking-widest text-[#DC2626] font-mono font-bold truncate">Arenas</p>
                </div>
                <p className="text-lg sm:text-2xl font-serif text-[#111111] font-bold">05 Core</p>
              </div>

              <div className="p-2 sm:p-3 rounded-2xl bg-white border border-amber-100 shadow-2xs">
                <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                  <Trophy size={12} className="text-amber-500 shrink-0" />
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-tighter sm:tracking-widest text-amber-600 font-mono font-bold truncate">Fidelity</p>
                </div>
                <p className="text-lg sm:text-2xl font-serif text-[#111111] font-bold">ICC Spec</p>
              </div>

              <div className="p-2 sm:p-3 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
                <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                  <Zap size={12} className="text-emerald-500 shrink-0" />
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-tighter sm:tracking-widest text-emerald-600 font-mono font-bold truncate">Ledger</p>
                </div>
                <p className="text-lg sm:text-2xl font-serif text-[#111111] font-bold">Live POS</p>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Immersive Layered Vibrant Animated Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="lg:col-span-5 relative"
          >
            {/* Action Floating Frame Wrapper */}
            <motion.div 
              animate={{ y: [-8, 8] }}
              transition={{ duration: 6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
              className="relative aspect-[4/5] rounded-3xl overflow-hidden border-2 border-white bg-white group shadow-2xl"
            >
              
              {/* Premium vibrant sport image loaded directly */}
              <img 
                src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop" 
                alt="Cinematic stadium lifestyle"
                className="w-full h-full object-cover object-center filter group-hover:scale-105 transition-all duration-1000 ease-out" 
              />
              
              {/* Soft overlay styling */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
              
              {/* Floating colorful micro tags */}
              <motion.div 
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute top-6 right-6 px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-emerald-200 shadow-md flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono tracking-wider text-emerald-800 uppercase font-bold">Live Slots Active</span>
              </motion.div>

              <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-white/95 backdrop-blur-md border border-[#EAEAEA] shadow-xl transition-all duration-500 group-hover:border-red-200 group-hover:translate-y-[-4px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-[#DC2626] border border-red-100 text-[9px] font-mono uppercase tracking-widest font-bold">
                    Featured Arena
                  </span>
                  <span className="text-[9px] font-mono bg-gradient-to-r from-amber-500 to-[#DC2626] text-white px-2 py-0.5 rounded font-bold shadow-2xs">
                    4K Analytics
                  </span>
                </div>
                <h4 className="text-xl serif-heading text-[#111111] mt-2">Central Match Ground</h4>
                <p className="text-xs text-[#666666] mt-0.5 font-light">ICC spec standard turf equipped with floodlight array</p>
              </div>
            </motion.div>

            {/* Back layered color glow offset cards */}
            <motion.div 
              animate={{ rotate: [0, 2, 0] }}
              transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
              className="absolute inset-0 rounded-3xl border-2 border-[#DC2626]/30 bg-gradient-to-br from-red-50 to-amber-50 -z-10 translate-x-4 translate-y-4 shadow-md" 
            />
            <div className="absolute inset-0 rounded-3xl border border-indigo-200 bg-indigo-50/40 -z-20 -translate-x-3 -translate-y-2 shadow-xs" />
          </motion.div>

        </div>
      </section>

      {/* ── Colorful Infinite Scrolling Strip ─────────────────────────────── */}
      <div className="border-y border-red-100 bg-gradient-to-r from-white via-red-50/30 to-white py-4 overflow-hidden relative shadow-xs">
        <motion.div 
          animate={{ x: [0, -1032] }}
          transition={{ ease: "linear", duration: 25, repeat: Infinity }}
          className="flex whitespace-nowrap gap-12 text-xs font-mono uppercase tracking-[0.25em] text-[#888888] items-center font-semibold"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-12 shrink-0">
              <span className="text-[#111111] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#DC2626]" /> RED BALL ACADEMY
              </span>
              <span className="text-amber-500">•</span>
              <span className="text-indigo-900">STATE OF THE ART ARENAS</span>
              <span className="text-amber-500">•</span>
              <span className="bg-gradient-to-r from-[#DC2626] to-amber-600 bg-clip-text text-transparent font-extrabold">INSTANT POS BOOKING</span>
              <span className="text-amber-500">•</span>
              <span className="text-emerald-700">PREMIUM RESTAURANT CLUB</span>
              <span className="text-amber-500">•</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── SPORTS SHOWCASE CATEGORY COLOR SYSTEM ───────────────────────── */}
      <section id="showcase" className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="space-y-3 mb-16">
          <p className="text-xs font-mono font-bold tracking-[0.3em] bg-gradient-to-r from-[#DC2626] to-amber-500 bg-clip-text text-transparent uppercase">
            [ELITE MULTI-SPORT ARENAS]
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="text-4xl md:text-6xl serif-heading text-[#111111] uppercase tracking-tight max-w-xl leading-none">
              ENGINEERED FOR <span className="bg-gradient-to-r from-[#DC2626] to-amber-600 bg-clip-text text-transparent">CHAMPIONS.</span>
            </h2>
            <p className="text-sm text-[#666666] font-mono tracking-widest uppercase max-w-xs font-medium">
              Explore dynamic multi-tier facility ecosystems
            </p>
          </div>
        </div>

        {/* Horizontal Split Colored Layout Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sportsShowcase.map((sport, index) => (
            <motion.div
              key={sport.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative h-[450px] rounded-2xl overflow-hidden border border-[#EAEAEA] bg-white flex flex-col transition-all duration-500 hover:border-[#DC2626]/50 hover:shadow-2xl"
            >
              {/* Top vibrant visual container */}
              <div className="relative w-full h-[250px] overflow-hidden shrink-0 bg-slate-100 border-b border-slate-100">
                <img 
                  src={sport.image} 
                  alt={sport.title} 
                  className="w-full h-full object-cover object-center filter group-hover:scale-110 transition-all duration-700 ease-out"
                />
                
                {/* Custom glowing internal top layer tags */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-2xs font-bold ${sport.badgeColor}`}>
                    Arena 0{index + 1}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-[#111111] group-hover:text-white group-hover:bg-[#DC2626] transition-all duration-300 shadow-sm">
                    <ArrowRight size={14} className="-rotate-45 group-hover:rotate-0 transition-transform" />
                  </span>
                </div>

                {/* Subtly colored ambient lighting base stripe inside frame */}
                <div className={`absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t ${sport.lightBloom} to-transparent`} />
              </div>

              {/* Bottom solid highly contrasted text container */}
              <div className="p-6 flex flex-col justify-between grow bg-white relative">
                <div className="space-y-1.5 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                  <p className={`text-xs font-mono uppercase tracking-wider font-extrabold ${sport.accentColor}`}>
                    {sport.subtitle}
                  </p>
                  <h3 className="text-2xl serif-heading text-[#111111] tracking-wide group-hover:text-[#DC2626] transition-colors">
                    {sport.title}
                  </h3>
                </div>
                <p className="text-sm text-[#555555] pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                  {sport.stats}
                </p>

                {/* Left accent strip indicator block */}
                <div className="absolute left-0 bottom-6 top-6 w-1 bg-[#DC2626] scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom duration-300 rounded-r-full" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PREMIUM COLOR MEMBERSHIP SECTION ────────────────────────────── */}
      <section id="memberships" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-[#EAEAEA]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Editorial side */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
            <p className="text-xs font-mono font-bold tracking-[0.3em] text-[#DC2626] uppercase">[ACCESS TIERS]</p>
            <h2 className="text-4xl sm:text-5xl serif-heading text-[#111111] uppercase tracking-tight leading-none">
              MEMBERSHIP<br />EXPERIENCE.
            </h2>
            <p className="text-base text-[#555555] font-normal leading-relaxed">
              Unlock cross-arena automated scheduling, live dining perks, kit maintenance privileges, and masterclass reservations. Configured flawlessly with upfront inclusive tax computation.
            </p>
            
            {/* Feature colorful checkpoints */}
            <div className="space-y-3 pt-4">
              {[
                { text: 'Instant dynamic QR access pass distribution', color: 'text-emerald-600' },
                { text: 'Pause or freeze plans at complete discretion', color: 'text-amber-500' },
                { text: 'Automated turnstile & locker access control', color: 'text-[#DC2626]' },
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-[#444444] font-medium">
                  <Check size={16} className={point.color} />
                  <span>{point.text}</span>
                </div>
              ))}
            </div>

            <div className="pt-6">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-[#111111] uppercase tracking-widest hover:text-[#DC2626] transition-colors group">
                <span>View Complete Disclaimers</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Vibrant Pricing Grid side */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {memberships.map((plan, index) => {
              const isSelected = activeTab === plan.name;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => setActiveTab(plan.name)}
                  className={`cursor-pointer rounded-2xl p-6 relative border transition-all duration-500 flex flex-col justify-between h-full ${
                    isSelected
                      ? 'bg-white border-[#DC2626] shadow-[0_15px_40px_rgba(220,38,38,0.12)] scale-[1.02] ring-1 ring-[#DC2626]'
                      : 'bg-white border-[#EAEAEA] hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Outer premium accent strip when selected */}
                  {isSelected && (
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#DC2626] via-amber-500 to-[#DC2626] rounded-t-2xl" />
                  )}

                  {plan.popular && (
                    <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-[#DC2626] to-amber-600 text-white text-[10px] font-mono font-bold uppercase tracking-widest shadow-sm flex items-center gap-1">
                      <Flame size={11} fill="currentColor" /> FEATURED TIER
                    </div>
                  )}

                  {/* Top Title & Cost */}
                  <div>
                    <div className="flex items-center justify-between mb-4 pt-1">
                      <h3 className="text-xl font-serif text-[#111111] font-bold">{plan.name}</h3>
                      <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded font-extrabold border shadow-2xs ${plan.badgeBg}`}>
                        {plan.period}
                      </span>
                    </div>

                    <div className="mb-4 flex items-baseline">
                      <span className="text-xs text-[#888888] font-mono font-bold">INR</span>
                      <span className={`text-4xl font-serif ml-1.5 font-bold tracking-tight ${isSelected ? 'text-[#DC2626]' : 'text-[#111111]'}`}>
                        {plan.price}
                      </span>
                    </div>

                    <p className="text-sm text-[#666666] mb-6 leading-relaxed font-normal">
                      {plan.desc}
                    </p>
                  </div>

                  {/* Bottom feature itemized checklist */}
                  <div className="space-y-2.5 border-t border-slate-100 pt-4 mt-auto">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2.5 text-sm text-[#555555]">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? 'bg-[#DC2626]' : 'bg-slate-300'}`} />
                        <span>{feat}</span>
                      </div>
                    ))}

                    <div className="pt-5">
                      <button className={`w-full py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all duration-300 shadow-2xs ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#111111] to-[#222222] text-white hover:from-[#DC2626] hover:to-[#EA580C]'
                          : 'bg-slate-50 text-[#666666] border border-slate-200 hover:bg-slate-100 hover:text-[#111111]'
                      }`}>
                        {isSelected ? 'Tier Activated' : 'Select Plan Key'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── QR RESTAURANT VIBRANT SYSTEM SECTION ────────────────────────── */}
      <section id="restaurant" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-[#EAEAEA]">
        <div className="rounded-3xl bg-white border border-red-100 shadow-xl p-8 md:p-12 overflow-hidden relative">
          
          {/* Backdrop lighting bloom gradient mesh */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/8 via-red-500/6 to-transparent rounded-full blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Left info side */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 shadow-2xs">
                <Utensils size={14} className="text-[#DC2626]" />
                <span className="text-xs font-mono tracking-widest text-[#DC2626] uppercase font-bold">Integrated Dine-In POS Engine</span>
              </div>

              <h2 className="text-4xl sm:text-5xl md:text-6xl serif-heading text-[#111111] uppercase tracking-tight leading-none">
                SCAN.<br />ORDER.<br /><span className="bg-gradient-to-r from-[#DC2626] to-amber-600 bg-clip-text text-transparent">RELAX.</span>
              </h2>

              <p className="text-base text-[#555555] leading-relaxed max-w-lg font-normal">
                Every customized sports boundary and seating table is mapped to our live QR code network. Athletes queue dietary items, order electrolyte formulas mid-innings, and finalize synchronous ledger checkouts seamlessly synced to dynamic chef counter monitors.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2 max-w-md">
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 shadow-2xs">
                  <p className="text-xs font-mono uppercase tracking-wider text-[#DC2626] font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" /> Live Kitchen
                  </p>
                  <p className="text-xs text-[#666666] mt-1 font-medium">Real-time status column matrix updates</p>
                </div>
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 shadow-2xs">
                  <p className="text-xs font-mono uppercase tracking-wider text-amber-600 font-bold flex items-center gap-1.5">
                    <Zap size={11} fill="currentColor" /> Prep-Sync
                  </p>
                  <p className="text-xs text-[#666666] mt-1 font-medium">Direct table delivery dispatch line</p>
                </div>
              </div>

              <div className="pt-4">
                <Link to="/login" className="text-sm tracking-widest uppercase inline-flex items-center gap-2 text-[#111111] hover:text-[#DC2626] font-extrabold group">
                  <span>Explore Menu & Nutrition Schema</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Immersive Beautiful Preview Layer Side */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              
              {/* Vibrant backlight glowing halo */}
              <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-[#DC2626]/12 to-amber-500/12 blur-3xl" />

              {/* Colorful floating mobile screen frame preview */}
              <motion.div 
                animate={{ y: [-8, 8] }}
                transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                className="w-72 rounded-[32px] bg-white p-3 border-4 border-slate-100 shadow-2xl relative z-10 ring-1 ring-slate-200/60"
              >
                {/* Simulated colorful inner app container */}
                <div className="rounded-[24px] bg-[#F7F7F7] overflow-hidden text-left border border-[#EAEAEA]">
                  {/* Top Bar */}
                  <div className="px-4 pt-3 pb-2 border-b border-slate-200 flex justify-between items-center text-[11px] text-[#555555] font-mono bg-white font-bold">
                    <span className="text-[#111111]">Dugout Table #04</span>
                    <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced
                    </span>
                  </div>

                  {/* App content array preview */}
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-3 bg-gradient-to-r from-red-50 to-white p-2.5 rounded-xl border border-red-100 shadow-2xs">
                      <div className="p-1.5 rounded-lg bg-[#DC2626] text-white shadow-2xs">
                        <QrCode size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#111111]">Active POS Menu Hub</p>
                        <p className="text-[10px] text-[#DC2626] font-mono font-bold">Red Ball Culinary Wing</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-mono text-[#888888] uppercase tracking-wider font-extrabold">Top Performance Formulas</p>
                      {[
                        { name: 'Elite Whey Shake', price: '₹280', tag: 'High Protein', tagBg: 'bg-amber-50 text-amber-800 border-amber-200' },
                        { name: 'Chicken Clubhouse', price: '₹340', tag: 'Fresh Grill', tagBg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                        { name: 'Citrus Electro-Load', price: '₹120', tag: 'Hydration', tagBg: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
                      ].map((food, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg bg-white border border-slate-100 shadow-2xs">
                          <div>
                            <p className="text-xs text-[#111111] font-bold">{food.name}</p>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded mt-0.5 inline-block font-bold border ${food.tagBg}`}>
                              {food.tag}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-[#DC2626] font-extrabold">{food.price}</span>
                        </div>
                      ))}
                    </div>

                    {/* Button simulation block */}
                    <div className="pt-2">
                      <div className="w-full py-2.5 bg-gradient-to-r from-[#DC2626] to-amber-600 text-white rounded-xl text-center text-[11px] font-bold uppercase tracking-wider shadow-sm">
                        Place Immediate Order
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating offset macro card badge */}
              <motion.div 
                animate={{ y: [6, -6] }}
                transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: 1 }}
                className="absolute right-2 sm:right-0 bottom-2 sm:bottom-8 p-3 sm:p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl z-20 max-w-[170px] sm:max-w-[190px] ring-1 ring-amber-100"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-amber-700 font-extrabold truncate">Order Synced</span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#444444] leading-tight font-medium">Chef approved request • Preparing live in 12 mins</p>
              </motion.div>

            </div>

          </div>
        </div>
      </section>

      {/* ── CENTRAL ECOSYSTEM CONTROLS (VIBRANT GRADIENT METERS) ────────── */}
      <section id="ecosystem" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-[#EAEAEA]">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <p className="text-xs font-mono font-bold tracking-[0.3em] bg-gradient-to-r from-[#DC2626] to-indigo-600 bg-clip-text text-transparent uppercase">
            [AESTHETIC INTELLIGENCE]
          </p>
          <h2 className="text-4xl md:text-5xl serif-heading text-[#111111] uppercase tracking-tight leading-none">
            CENTRAL ACADEMY CONTROL.
          </h2>
          <p className="text-base text-[#555555] leading-relaxed font-normal">
            Behind the high-contrast luxury frontend lies a dynamic administration grid engineered for instant telemetry processing utilizing state-colored dashboard vector components.
          </p>
        </div>

        {/* Minimal Glass floating dashboard previews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-red-200">
            {/* Top tiny colored highlight tag line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#DC2626] to-rose-500" />
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-mono uppercase tracking-wider text-[#111111] font-bold">Admissions Vector</span>
                <span className="p-1 rounded bg-rose-50 text-rose-600">
                  <Activity size={15} />
                </span>
              </div>
              <p className="text-4xl font-serif text-[#111111] tracking-tight font-bold">4,829</p>
              <p className="text-xs text-rose-700 font-medium mt-1">Lifetime Enrolled Candidates</p>
            </div>
            
            {/* Chart mock view with dynamic live gradients */}
            <div className="space-y-2.5 pt-4 border-t border-slate-100">
              {[
                { w: 85, color: 'from-[#DC2626] to-rose-500' },
                { w: 60, color: 'from-amber-500 to-orange-500' },
                { w: 92, color: 'from-emerald-500 to-teal-500' },
              ].map((bar, idx) => (
                <div key={idx} className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${bar.w}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: idx * 0.15 }}
                    className={`bg-gradient-to-r ${bar.color} h-full rounded-full`} 
                  />
                </div>
              ))}
              <p className="text-[10px] font-mono text-slate-500 text-right pt-1 uppercase font-bold">Rolling Metrics Intake</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-amber-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-mono uppercase tracking-wider text-[#111111] font-bold">Transaction Ledger</span>
                <span className="p-1 rounded bg-amber-50 text-amber-600">
                  <TrendingUp size={15} />
                </span>
              </div>
              <p className="text-4xl font-serif text-[#DC2626] tracking-tight font-bold">INR 1.2M</p>
              <p className="text-xs text-amber-700 font-medium mt-1">Rolling Period Gross Flow</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-xs text-[#555555]">
                <span className="font-medium">Arena Slot #A12</span>
                <span className="font-mono text-[#111111] font-extrabold text-sm">₹3,500</span>
              </div>
              <div className="flex justify-between items-center text-xs text-[#555555]">
                <span className="font-medium">Legend Tier Issuance</span>
                <span className="font-mono text-[#DC2626] font-extrabold text-sm">₹38,000</span>
              </div>
              <div className="flex justify-between items-center text-xs text-[#555555]">
                <span className="font-medium">Dine-In Hub #K8</span>
                <span className="font-mono text-emerald-600 font-extrabold text-sm">₹620</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-6 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-emerald-200">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-mono uppercase tracking-wider text-[#111111] font-bold">Inventory Sync</span>
                <span className="p-1 rounded bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={15} />
                </span>
              </div>
              <p className="text-4xl font-serif text-[#111111] tracking-tight font-bold">98.4%</p>
              <p className="text-xs text-emerald-700 font-medium mt-1">Stock Readiness Index</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-sm border-b border-slate-50 pb-1.5">
                <span className="text-[#555555]">Leather Match Balls</span>
                <span className="text-rose-600 font-mono font-bold">140 Ready</span>
              </div>
              <div className="flex justify-between text-sm border-b border-slate-50 pb-1.5">
                <span className="text-[#555555]">Kitchen Protein Kits</span>
                <span className="text-amber-600 font-mono font-bold">24 Kilos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#555555]">Synthetic Shuttles</span>
                <span className="text-indigo-600 font-mono font-bold">85 Tubes</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── TESTIMONIALS MAGAZINE LAYOUT ────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-[#EAEAEA]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          
          <div className="md:col-span-4 flex flex-col justify-between py-2">
            <div>
              <span className="text-6xl font-serif bg-gradient-to-r from-[#DC2626] to-amber-500 bg-clip-text text-transparent leading-none block mb-2 font-black">“</span>
              <p className="text-2xl sm:text-3xl serif-heading text-[#111111] tracking-wide italic leading-snug">
                The booking smoothness and professional colored data infrastructure feels absolutely state of the art.
              </p>
            </div>
            <div className="pt-4">
              <p className="text-sm font-bold text-[#DC2626] uppercase tracking-wider font-mono">Rajesh S.</p>
              <p className="text-xs text-[#666666] font-medium mt-0.5">Ranji Trophy Veteran • Lifetime Legend Key</p>
            </div>
          </div>

          <div className="md:col-span-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-slate-300 relative">
            <div className="absolute top-0 right-6 w-8 h-1 bg-amber-500 rounded-b" />
            <div>
              <div className="flex gap-1 text-amber-500 mb-3">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
              </div>
              <p className="text-sm text-[#444444] leading-relaxed font-normal">
                "Enrolling my son into the Annual Legend pass tier was visually clear and immediate. We pick nets practice on phone, clear POS pre-payments instantly, and dine-in seamlessly."
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-6 flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-[#111111]">Ananya Verma</p>
                <p className="text-[10px] text-[#888888] uppercase tracking-wider font-bold mt-0.5">Parent Sponsor</p>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded font-extrabold border border-emerald-100">Verified</span>
            </div>
          </div>

          <div className="md:col-span-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-slate-300 relative">
            <div className="absolute top-0 right-6 w-8 h-1 bg-indigo-500 rounded-b" />
            <div>
              <div className="flex gap-1 text-amber-500 mb-3">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}
              </div>
              <p className="text-sm text-[#444444] leading-relaxed font-normal">
                "We queue our overall corporate multi-sport corporate bookings via Red Ball. The ambient interface, clear ledger outputs, and premium UI responses are totally peerless."
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 mt-6 flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-[#111111]">Vikram Mehta</p>
                <p className="text-[10px] text-[#888888] uppercase tracking-wider font-bold mt-0.5">Corporate Captain</p>
              </div>
              <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded font-extrabold border border-indigo-100">Enterprise</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── LUXURY VIBRANT FOOTER LAYOUT ────────────────────────────────── */}
      <footer className="relative mt-20 border-t border-slate-200 bg-white pt-20 pb-12 overflow-hidden text-left shadow-sm">
        
        {/* Giant faded multi-colored branding backdrop text shadow */}
        <div className="absolute inset-x-0 bottom-[-4%] text-center text-[28vw] font-serif font-black text-[#DC2626]/[0.02] tracking-tighter uppercase pointer-events-none leading-none select-none">
          RB
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#DC2626] to-amber-500 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm">
                RB
              </div>
              <span className="text-sm font-bold tracking-widest text-[#111111] uppercase font-mono">
                Red Ball Academy
              </span>
            </div>
            <p className="text-sm text-[#555555] max-w-sm leading-relaxed font-normal">
              An elite highly interactive sports reservation gateway configured with vibrant color hierarchy and cinematic web motion architectures.
            </p>
            <p className="text-xs bg-gradient-to-r from-[#DC2626] to-amber-600 bg-clip-text text-transparent font-mono font-bold">
              Engineered for absolute fidelity.
            </p>
          </div>

          {/* Quick Hub Links */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-[#111111] font-extrabold border-b border-red-100 pb-1 inline-block">Arenas</p>
            <ul className="space-y-2.5 text-sm text-[#555555]">
              <li><a href="#showcase" className="hover:text-[#DC2626] transition-colors font-medium">Cricket Grounds</a></li>
              <li><a href="#showcase" className="hover:text-emerald-600 transition-colors font-medium">Football Turfs</a></li>
              <li><a href="#showcase" className="hover:text-indigo-600 transition-colors font-medium">Badminton Hubs</a></li>
              <li><a href="#showcase" className="hover:text-cyan-600 transition-colors font-medium">Aquatic Centers</a></li>
            </ul>
          </div>

          {/* Ecosystem Tiers */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-[#111111] font-extrabold border-b border-amber-100 pb-1 inline-block">Management</p>
            <ul className="space-y-2.5 text-sm text-[#555555]">
              <li><Link to="/login" className="hover:text-[#DC2626] transition-colors font-medium">Staff Control Hub</Link></li>
              <li><Link to="/login" className="hover:text-amber-600 transition-colors font-medium">Restaurant POS Wing</Link></li>
              <li><Link to="/login" className="hover:text-emerald-600 transition-colors font-medium">Live Accounts Gate</Link></li>
              <li><Link to="/login" className="hover:text-indigo-600 transition-colors font-medium">Admissions Core</Link></li>
            </ul>
          </div>

          {/* Newsletter Input block */}
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-[#111111] font-extrabold border-b border-emerald-100 pb-1 inline-block">Priority Connect</p>
            <p className="text-xs text-[#555555]">Receive targeted calendar availability and customized tier package drops.</p>
            <div className="pt-1">
              <input 
                type="email" 
                placeholder="Enter dispatch email" 
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-[#DC2626] transition-colors mb-2 font-medium"
              />
              <button className="w-full py-2.5 bg-gradient-to-r from-[#111111] to-[#222222] hover:from-[#DC2626] hover:to-amber-600 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all duration-300 shadow-xs">
                Subscribe Dispatches
              </button>
            </div>
          </div>

        </div>

        {/* Bottom fineprint copyright strip */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 text-xs text-[#888888] font-mono">
          <p>© 2026 Red Ball Cricket Academy MVP. Ground slot matrices fully updated.</p>
          <div className="flex gap-4 sm:gap-6 font-semibold flex-wrap items-center justify-center sm:justify-end">
            <span className="hover:text-[#111111] cursor-pointer transition-colors">Privacy Code</span>
            <span className="hover:text-[#111111] cursor-pointer transition-colors">Tax Integration</span>
            <span className="hover:text-[#111111] cursor-pointer transition-colors">API Architecture</span>
            <button 
              onClick={() => {
                sessionStorage.removeItem('rb_intro_played');
                setShowIntro(true);
              }}
              className="text-[#DC2626] hover:text-[#111111] font-extrabold cursor-pointer transition-colors underline decoration-dotted ml-2"
            >
              [🎬 Replay Cinematic Launch]
            </button>
          </div>
        </div>
      </footer>

      </motion.div>

    </div>
  );
}
