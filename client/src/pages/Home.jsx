import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  Dribbble, 
  Activity, 
  Utensils, 
  Calendar, 
  TrendingUp, 
  Star, 
  ChevronRight, 
  Smartphone, 
  QrCode, 
  ShoppingBag,
  ShieldCheck,
  Check
} from 'lucide-react';

// Premium Sports data for showcase
const sportsShowcase = [
  {
    title: 'Cricket Arena',
    subtitle: 'ICC-Standard Turf & Floodlights',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1200&auto=format&fit=crop',
    stats: 'Pitch Speed Tracking • Video Analysis',
  },
  {
    title: 'Football Turf',
    subtitle: 'FIFA-Certified Artificial Grass',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    stats: '5v5 & 7v7 Configurations • Premium Dugouts',
  },
  {
    title: 'Badminton Courts',
    subtitle: 'BWF-Approved Wooden Flooring with Synthetic Mats',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
    stats: 'Anti-Glare LED Lighting • Air-Conditioned',
  },
  {
    title: 'Aquatic Center',
    subtitle: 'Olympic-Length Temperature Controlled Pool',
    image: 'https://images.unsplash.com/photo-1519315901367-f34f916712d9?q=80&w=1200&auto=format&fit=crop',
    stats: 'Dedicated Lanes • Professional Lifeguards',
  },
];

// Luxury Memberships
const memberships = [
  {
    name: 'Monthly Pass',
    price: '4,500',
    period: 'month',
    desc: 'Perfect for short-term access and flexibility.',
    features: ['Access to 2 selected sports', 'Standard booking slots', 'Restaurant table access', 'GST Included'],
    popular: false,
  },
  {
    name: 'Quarterly Pro',
    price: '11,500',
    period: 'quarter',
    desc: 'Dedicated athletes looking for regular competitive sessions.',
    features: ['Access to all core sports', 'Priority slot selection', '10% off restaurant orders', 'Free net bowling sessions', 'GST Included'],
    popular: true,
  },
  {
    name: 'Half-Yearly Elite',
    price: '21,000',
    period: '6 months',
    desc: 'Complete academy lifestyle integration for seasoned players.',
    features: ['Unlimited multi-sport access', 'Advanced performance tracking', '15% off restaurant & merchandise', 'Complimentary guest passes', 'GST Included'],
    popular: false,
  },
  {
    name: 'Annual Legend',
    price: '38,000',
    period: 'year',
    desc: 'The ultimate luxury sports club & academy tier.',
    features: ['VIP absolute multi-sport access', 'Personal locker & kit management', '25% premium dining discount', 'Direct line to master coaches', 'Exclusive corporate events access', 'GST Included'],
    popular: false,
  },
];

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('Quarterly Pro');
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for cinematic floating navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track mouse position for subtle dynamic lighting gradients
  const handleMouseMove = (e) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top } = currentTarget.getBoundingClientRect();
    setMousePosition({
      x: clientX - left,
      y: clientY - top,
    });
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#EAEAEA] font-sans selection:bg-[#DC2626] selection:text-white overflow-hidden">
      
      {/* Dynamic Background Noise / Grid Layer */}
      <div className="absolute inset-0 bg-[radial-gradient(#222222_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      
      {/* Floating Ambient Stadium Lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[#DC2626]/10 via-blue-600/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tl from-[#DC2626]/10 via-amber-500/5 to-transparent blur-[140px] pointer-events-none" />

      {/* ── NAVBAR ──────────────────────────────────────────────────────── */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-6 left-0 right-0 z-50 px-4 md:px-8"
      >
        <div className={`max-w-6xl mx-auto rounded-full transition-all duration-500 flex items-center justify-between px-6 py-3.5 ${
          scrolled 
            ? 'bg-[#161616]/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
            : 'bg-transparent border border-transparent'
        }`}>
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-[#DC2626] flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)] group-hover:scale-105 transition-transform">
              RB
            </div>
            <span className="text-sm font-semibold tracking-widest text-white uppercase font-mono">
              Red Ball
            </span>
          </Link>

          {/* Elegant Pill Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] px-3 py-1 rounded-full border border-white/[0.05]">
            {['Home', 'Showcase', 'Memberships', 'Restaurant', 'Ecosystem'].map((item, idx) => (
              <a 
                key={item} 
                href={item === 'Home' ? '#' : `#${item.toLowerCase()}`}
                className="px-4 py-1.5 text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors relative group"
              >
                {item}
                <span className="absolute bottom-1 left-4 right-4 h-[1px] bg-[#DC2626] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
              </a>
            ))}
          </nav>

          {/* CTA Actions */}
          <div className="flex items-center gap-3">
            <Link 
              to="/login" 
              className="px-4 py-2 text-xs font-medium text-white hover:text-[#DC2626] transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link 
              to="/login" 
              className="relative px-5 py-2.5 rounded-full bg-white text-[#111111] text-xs font-bold tracking-wider uppercase overflow-hidden group shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2.5"
            >
              <span className="relative z-10">Book Portal</span>
              <ArrowRight size={13} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-[#DC2626] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      <section 
        onMouseMove={handleMouseMove}
        className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-6 md:px-12 max-w-7xl mx-auto"
      >
        {/* Subtle Dynamic cursor-following light blob */}
        <div 
          className="absolute w-[400px] h-[400px] rounded-full bg-gradient-to-r from-[#DC2626]/10 to-transparent blur-[100px] pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: `${mousePosition.x - 200}px`,
            top: `${mousePosition.y - 200}px`,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full relative z-10">
          
          {/* Left Column: Editorial Typography */}
          <div className="lg:col-span-7 space-y-8 text-left">
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md"
            >
              <Sparkles size={12} className="text-[#DC2626]" />
              <span className="text-[11px] font-mono tracking-widest text-white uppercase">
                Premium Sports Ecosystem
              </span>
            </motion.div>

            {/* Massive Split Text Reveal */}
            <div className="space-y-1">
              <div className="overflow-hidden">
                <motion.h1 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl serif-heading text-white tracking-tight uppercase leading-[0.9]"
                >
                  PLAY BOLDER.
                </motion.h1>
              </div>
              <div className="overflow-hidden">
                <motion.h1 
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl serif-heading text-white tracking-tight uppercase leading-[0.9] text-transparent bg-clip-text bg-gradient-to-r from-white via-[#EAEAEA] to-[#888888]"
                >
                  TRAIN <span className="text-[#DC2626]">HARDER.</span>
                </motion.h1>
              </div>
            </div>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-base md:text-lg text-[#A1A1AA] max-w-xl font-light leading-relaxed font-sans"
            >
              Book premium high-fidelity sports arenas, track performance metrics, manage multi-tier memberships, and access our proprietary QR-managed culinary club.
            </motion.p>

            {/* Hero CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.65 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link 
                to="/login"
                className="px-8 py-4 rounded-full bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_4px_20px_rgba(220,38,38,0.3)] hover:shadow-[0_6px_25px_rgba(220,38,38,0.5)] hover:scale-105 active:scale-95 flex items-center gap-3 group"
              >
                <span>Reserve Arena</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#memberships"
                className="px-8 py-4 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-xs font-bold tracking-widest uppercase transition-all duration-300 backdrop-blur-sm"
              >
                Explore Memberships
              </a>
            </motion.div>

            {/* Micro details metrics */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
              className="grid grid-cols-3 gap-6 pt-10 border-t border-white/10 max-w-lg"
            >
              <div>
                <p className="text-2xl font-serif text-white">05</p>
                <p className="text-[10px] uppercase tracking-widest text-[#888888] font-mono mt-0.5">Core Arenas</p>
              </div>
              <div>
                <p className="text-2xl font-serif text-white">ICC</p>
                <p className="text-[10px] uppercase tracking-widest text-[#888888] font-mono mt-0.5">Standard Ground</p>
              </div>
              <div>
                <p className="text-2xl font-serif text-white">24/7</p>
                <p className="text-[10px] uppercase tracking-widest text-[#888888] font-mono mt-0.5">Digital POS</p>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Immersive Layered Cinematic Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="lg:col-span-5 relative"
          >
            {/* Action Frame Wrapper */}
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 group shadow-2xl">
              
              {/* Premium image loaded directly */}
              <img 
                src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop" 
                alt="Cinematic stadium lifestyle"
                className="w-full h-full object-cover object-center filter grayscale brightness-90 group-hover:scale-110 group-hover:filter-none transition-all duration-1000 ease-out" 
              />
              
              {/* Overlay styling */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-black/30" />
              <div className="absolute inset-0 bg-[#DC2626]/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Floating micro glass tags */}
              <div className="absolute top-6 right-6 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-mono tracking-wider text-white uppercase">Live Booking Active</span>
              </div>

              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10">
                <p className="text-xs font-mono uppercase tracking-widest text-[#DC2626] mb-1 font-semibold">Featured Turf</p>
                <h4 className="text-lg serif-heading text-white">Central Match Arena</h4>
                <p className="text-xs text-[#A1A1AA] mt-0.5">Equipped with 4K multi-camera streaming analytics</p>
              </div>
            </div>

            {/* Back layered decor offset card */}
            <div className="absolute inset-0 rounded-3xl border border-[#DC2626]/20 bg-gradient-to-br from-white/[0.02] to-transparent -z-10 translate-x-4 translate-y-4" />
          </motion.div>

        </div>
      </section>

      {/* ── Infinite Horizontal Scrolling Strip ───────────────────────────── */}
      <div className="border-y border-white/[0.08] bg-[#161616] py-4 overflow-hidden relative">
        <motion.div 
          animate={{ x: [0, -1032] }}
          transition={{ ease: "linear", duration: 25, repeat: Infinity }}
          className="flex whitespace-nowrap gap-12 text-xs font-mono uppercase tracking-[0.25em] text-[#888888] items-center"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-12 shrink-0">
              <span className="text-white font-semibold">🏏 RED BALL ACADEMY</span>
              <span>•</span>
              <span>STATE OF THE ART ARENAS</span>
              <span>•</span>
              <span className="text-[#DC2626]">INSTANT POS BOOKING</span>
              <span>•</span>
              <span>PREMIUM RESTAURANT CLUB</span>
              <span>•</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── SPORTS SHOWCASE SECTION ─────────────────────────────────────── */}
      <section id="showcase" className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="space-y-3 mb-16">
          <p className="text-[10px] font-mono font-semibold tracking-[0.3em] text-[#DC2626] uppercase">[ELITE MULTI-SPORT ARENAS]</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="text-4xl md:text-6xl serif-heading text-white uppercase tracking-tight max-w-xl leading-none">
              ENGINEERED FOR CHAMPIONS.
            </h2>
            <p className="text-xs text-[#888888] font-mono tracking-widest uppercase max-w-xs">
              Scroll across our highly maintained facility ecosystem
            </p>
          </div>
        </div>

        {/* Horizontal Layout Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sportsShowcase.map((sport, index) => (
            <motion.div
              key={sport.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative h-[450px] rounded-2xl overflow-hidden border border-white/[0.08] bg-[#161616] flex flex-col justify-between p-6 transition-all duration-500 hover:border-white/20 hover:shadow-2xl"
            >
              {/* Deep immersive visual background */}
              <div className="absolute inset-0 -z-10">
                <img 
                  src={sport.image} 
                  alt={sport.title} 
                  className="w-full h-full object-cover object-center filter grayscale brightness-50 group-hover:scale-110 group-hover:filter-none group-hover:brightness-75 transition-all duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/40 to-transparent" />
              </div>

              {/* Top Meta info */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                  Arena 0{index + 1}
                </span>
                <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-[#DC2626] transition-all duration-300">
                  <ArrowRight size={14} className="-rotate-45 group-hover:rotate-0 transition-transform" />
                </span>
              </div>

              {/* Bottom detail typography */}
              <div className="space-y-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#DC2626] font-semibold">
                  {sport.subtitle}
                </p>
                <h3 className="text-2xl serif-heading text-white tracking-wide">
                  {sport.title}
                </h3>
                <p className="text-xs text-[#A1A1AA] pt-2 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {sport.stats}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PREMIUM MEMBERSHIP SECTION ──────────────────────────────────── */}
      <section id="memberships" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/[0.05]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Editorial info side */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
            <p className="text-[10px] font-mono font-semibold tracking-[0.3em] text-[#DC2626] uppercase">[ACCESS TIERS]</p>
            <h2 className="text-4xl sm:text-5xl serif-heading text-white uppercase tracking-tight leading-none">
              MEMBERSHIP<br />EXPERIENCE.
            </h2>
            <p className="text-sm text-[#A1A1AA] font-light leading-relaxed">
              Unlock cross-arena scheduling, high-tier dining exemptions, tailored locker service, and recurring masterclass access. Every plan is pre-calculated with full GST compliance.
            </p>
            
            {/* Feature Checkpoints */}
            <div className="space-y-2 pt-4">
              {[
                'Instant active QR code distribution',
                'Pause or freeze plans at discretion',
                'Automated access-control hardware synced',
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-[#888888]">
                  <Check size={14} className="text-[#DC2626]" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="pt-6">
              <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest hover:text-[#DC2626] transition-colors group">
                <span>View Complete Terms</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Pricing Grid side */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {memberships.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => setActiveTab(plan.name)}
                className={`cursor-pointer rounded-2xl p-6 relative border transition-all duration-300 flex flex-col justify-between h-full ${
                  activeTab === plan.name
                    ? 'bg-[#1C1C1C] border-[#DC2626] shadow-[0_0_30px_rgba(220,38,38,0.15)] scale-[1.02]'
                    : 'bg-[#161616] border-white/[0.08] hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-[#DC2626] text-white text-[9px] font-mono font-bold uppercase tracking-widest shadow-md">
                    Recommended TIER
                  </div>
                )}

                {/* Top Title & Cost */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-serif text-white">{plan.name}</h3>
                    <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider bg-white/[0.03] px-2 py-0.5 rounded">
                      {plan.period}
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="text-xs text-[#888888] font-mono">INR</span>
                    <span className="text-4xl font-serif text-white ml-1.5 font-bold tracking-tight">{plan.price}</span>
                  </div>

                  <p className="text-xs text-[#A1A1AA] mb-6 leading-relaxed font-light">
                    {plan.desc}
                  </p>
                </div>

                {/* Bottom feature itemized checklist */}
                <div className="space-y-2 border-t border-white/10 pt-4 mt-auto">
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-[#D4D4D8]">
                      <span className="w-1 h-1 rounded-full bg-[#DC2626] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}

                  <div className="pt-4">
                    <button className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                      activeTab === plan.name
                        ? 'bg-white text-[#111111]'
                        : 'bg-white/[0.05] text-[#888888] hover:bg-white/[0.1] hover:text-white'
                    }`}>
                      {activeTab === plan.name ? 'Tier Selected' : 'Choose Plan'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── QR RESTAURANT ECOSYSTEM SECTION ─────────────────────────────── */}
      <section id="restaurant" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/[0.05]">
        <div className="rounded-3xl bg-gradient-to-br from-[#161616] to-[#121212] border border-white/[0.08] p-8 md:p-12 overflow-hidden relative">
          
          {/* Backdrop lighting bloom */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Right-like info content left layout */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DC2626]/10 border border-[#DC2626]/20">
                <Utensils size={12} className="text-[#DC2626]" />
                <span className="text-[10px] font-mono tracking-widest text-[#DC2626] uppercase">Integrated Dine-In System</span>
              </div>

              <h2 className="text-4xl sm:text-5xl md:text-6xl serif-heading text-white uppercase tracking-tight leading-none">
                SCAN.<br />ORDER.<br /><span className="text-[#DC2626]">RELAX.</span>
              </h2>

              <p className="text-sm text-[#A1A1AA] leading-relaxed max-w-lg font-light">
                Every customized sports arena and spectator dugout table is embedded with our proprietary active QR code network. Athletes instantly browse macro-conscious menus, queue protein meals, and execute table-side prepayments connected synchronously to our live kitchen screens.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 max-w-md">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <p className="text-xs font-mono uppercase tracking-wider text-white">Live Status</p>
                  <p className="text-[11px] text-[#888888] mt-1">4-Column Real-time Kitchen Tracking</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <p className="text-xs font-mono uppercase tracking-wider text-white">Zero Wait</p>
                  <p className="text-[11px] text-[#888888] mt-1">Pre-order drinks directly mid-match</p>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/login" className="btn-ghost text-xs tracking-widest uppercase inline-flex items-center gap-2 hover:text-[#DC2626]">
                  <span>Explore Sample Menu</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Immersive Mockup Preview layer side */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              
              {/* Outer Glow ring */}
              <div className="absolute w-72 h-72 rounded-full bg-[#DC2626]/20 blur-3xl" />

              {/* Minimal floating phone device frame preview */}
              <motion.div 
                animate={{ y: [-8, 8] }}
                transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                className="w-72 rounded-[32px] bg-[#111111] p-3 border-4 border-[#2A2A2A] shadow-2xl relative z-10"
              >
                {/* Internal screen preview simulated UI */}
                <div className="rounded-[24px] bg-[#161616] overflow-hidden text-left border border-white/5">
                  {/* Top Bar */}
                  <div className="px-4 pt-3 pb-2 border-b border-white/5 flex justify-between items-center text-[10px] text-[#888888] font-mono">
                    <span>Table #04</span>
                    <span className="text-green-500 font-semibold">● Connected</span>
                  </div>

                  {/* App content preview */}
                  <div className="p-4 space-y-4">
                    <div className="flex items-center gap-3 bg-white/[0.03] p-2 rounded-xl">
                      <QrCode size={24} className="text-[#DC2626]" />
                      <div>
                        <p className="text-[11px] font-semibold text-white">Menu Synced Successfully</p>
                        <p className="text-[9px] text-[#888888]">Red Ball Culinary Kitchen</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">Top Selections</p>
                      {[
                        { name: 'Elite Whey Recovery Shake', price: '₹280', tag: 'High Protein' },
                        { name: 'Grilled Chicken Clubhouse', price: '₹340', tag: 'Fresh Grill' },
                        { name: 'Electrolyte Pre-Load Citrus', price: '₹120', tag: 'Instant Drink' },
                      ].map((food, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <div>
                            <p className="text-[11px] text-white font-medium">{food.name}</p>
                            <span className="text-[8px] font-mono bg-white/[0.05] text-[#A1A1AA] px-1.5 py-0.2 rounded mt-0.5 inline-block">{food.tag}</span>
                          </div>
                          <span className="text-xs font-mono text-[#DC2626] font-bold">{food.price}</span>
                        </div>
                      ))}
                    </div>

                    {/* Button simulation */}
                    <div className="pt-2">
                      <div className="w-full py-2 bg-white text-black rounded-lg text-center text-[10px] font-bold uppercase tracking-wider">
                        Place Table Order
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating detached side stats snippet item */}
              <motion.div 
                animate={{ y: [6, -6] }}
                transition={{ duration: 5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: 1 }}
                className="absolute right-0 bottom-8 p-3 rounded-xl bg-[#1D1D1D]/90 backdrop-blur-md border border-white/10 shadow-2xl z-20 max-w-[180px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag size={14} className="text-amber-500" />
                  <span className="text-[9px] font-mono uppercase tracking-wider text-white">Order Received</span>
                </div>
                <p className="text-[11px] text-[#A1A1AA] leading-tight">Chef approved order • Preparing in 12 mins</p>
              </motion.div>

            </div>

          </div>
        </div>
      </section>

      {/* ── CINEMATIC ECOSYSTEM MANAGEMENT PREVIEW ──────────────────────── */}
      <section id="ecosystem" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/[0.05]">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <p className="text-[10px] font-mono font-semibold tracking-[0.3em] text-[#888888] uppercase">[AESTHETIC INTELLIGENCE]</p>
          <h2 className="text-4xl md:text-5xl serif-heading text-white uppercase tracking-tight leading-none">
            CENTRAL ACADEMY CONTROL.
          </h2>
          <p className="text-xs text-[#A1A1AA] leading-relaxed font-light">
            Behind the luxury lifestyle front-end lies a highly responsive administration portal engineered for absolute management speed without the chaotic aesthetic overload.
          </p>
        </div>

        {/* Minimal Glass floating dashboard previews */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="rounded-2xl bg-[#161616] border border-white/[0.08] p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-white">Admissions Flow</span>
                <Activity size={14} className="text-green-500" />
              </div>
              <p className="text-3xl font-serif text-white tracking-tight">4,829</p>
              <p className="text-[11px] text-[#888888] mt-1">Validated Lifetime Admissions</p>
            </div>
            
            {/* Chart mock view */}
            <div className="space-y-1.5 pt-4 border-t border-white/5">
              {[80, 65, 95, 45, 88].map((w, idx) => (
                <div key={idx} className="w-full bg-white/[0.03] h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${w}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className="bg-gradient-to-r from-[#DC2626] to-amber-500 h-full rounded-full" 
                  />
                </div>
              ))}
              <p className="text-[9px] font-mono text-[#888888] text-right pt-1 uppercase">Live Intake Vector</p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#161616] border border-white/[0.08] p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-white">POS Transaction Ledger</span>
                <TrendingUp size={14} className="text-blue-500" />
              </div>
              <p className="text-3xl font-serif text-white tracking-tight">INR 1.2M</p>
              <p className="text-[11px] text-[#888888] mt-1">Rolling Period Gross Bookings</p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2">
              <div className="flex justify-between items-center text-[10px] text-[#A1A1AA]">
                <span>Ground Booking #A12</span>
                <span className="font-mono text-white">₹3,500</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-[#A1A1AA]">
                <span>Annual Pass Initial</span>
                <span className="font-mono text-white">₹38,000</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-[#A1A1AA]">
                <span>Dine-In Invoice #K8</span>
                <span className="font-mono text-white">₹620</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#161616] border border-white/[0.08] p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-white">Inventory Monitor</span>
                <ShieldCheck size={14} className="text-amber-500" />
              </div>
              <p className="text-3xl font-serif text-white tracking-tight">98.4%</p>
              <p className="text-[11px] text-[#888888] mt-1">Stock Readiness Metrics</p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#888888]">Cricket Leather Balls</span>
                <span className="text-white font-mono">140 Units</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#888888]">Kitchen Premium Protein</span>
                <span className="text-white font-mono">24 Kg</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#888888]">Synthetic Badminton Shuttles</span>
                <span className="text-white font-mono">85 Tubes</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── TESTIMONIALS MAGAZINE LAYOUT ────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/[0.05]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          <div className="md:col-span-4 space-y-4">
            <span className="text-6xl font-serif text-[#DC2626] leading-none block">“</span>
            <p className="text-2xl serif-heading text-white tracking-wide italic leading-snug">
              The booking smoothness and professional management infrastructure feels absolutely state of the art.
            </p>
            <div className="pt-2">
              <p className="text-xs font-bold text-white uppercase tracking-wider font-mono">Rajesh S.</p>
              <p className="text-[11px] text-[#888888]">Ranji Trophy Player & Academy Veteran</p>
            </div>
          </div>

          <div className="md:col-span-4 p-6 rounded-2xl bg-[#161616] border border-white/[0.06] space-y-4 translate-y-4">
            <div className="flex gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              "Enrolling my son into the Annual Legend tier was seamless. We can schedule nets practice on phone, pay instantly, and dine directly post-workout."
            </p>
            <div className="pt-2 border-t border-white/5">
              <p className="text-[11px] font-semibold text-white">Ananya Verma</p>
              <p className="text-[9px] text-[#888888] uppercase tracking-wider">Parent Member</p>
            </div>
          </div>

          <div className="md:col-span-4 p-6 rounded-2xl bg-[#161616] border border-white/[0.06] space-y-4 -translate-y-2">
            <div className="flex gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              "We organize our entire corporate football tournament bookings via Red Ball. The automatic lighting configuration and digital checkout systems are peerless."
            </p>
            <div className="pt-2 border-t border-white/5">
              <p className="text-[11px] font-semibold text-white">Vikram Mehta</p>
              <p className="text-[9px] text-[#888888] uppercase tracking-wider">Corporate Captain</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── LUXURY EDITORIAL FOOTER ─────────────────────────────────────── */}
      <footer className="relative mt-20 border-t border-white/10 bg-black pt-20 pb-12 overflow-hidden text-left">
        
        {/* Giant faded ambient branding backdrop */}
        <div className="absolute inset-x-0 bottom-[-5%] text-center text-[28vw] font-serif font-bold text-white/[0.02] tracking-tighter uppercase pointer-events-none leading-none select-none">
          RB
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-16">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#DC2626] flex items-center justify-center text-white font-bold text-xs tracking-wider">
                RB
              </div>
              <span className="text-xs font-semibold tracking-widest text-white uppercase font-mono">
                Red Ball Academy
              </span>
            </div>
            <p className="text-xs text-[#888888] max-w-sm leading-relaxed font-light">
              An elite high-contrast sports booking platform and multi-tier club ecosystem. Crafted thoughtfully with state-of-the-art interactive motion architecture.
            </p>
            <p className="text-[10px] text-[#666666] font-mono">
              Designed for immersive digital experiences.
            </p>
          </div>

          {/* Quick Hub Links */}
          <div className="space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white font-semibold">Arenas</p>
            <ul className="space-y-2 text-xs text-[#888888]">
              <li><a href="#showcase" className="hover:text-white transition-colors">Cricket Ground</a></li>
              <li><a href="#showcase" className="hover:text-white transition-colors">Football Turf</a></li>
              <li><a href="#showcase" className="hover:text-white transition-colors">Badminton Courts</a></li>
              <li><a href="#showcase" className="hover:text-white transition-colors">Aquatic Pools</a></li>
            </ul>
          </div>

          {/* Ecosystem Tiers */}
          <div className="space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white font-semibold">Management</p>
            <ul className="space-y-2 text-xs text-[#888888]">
              <li><Link to="/login" className="hover:text-white transition-colors">Staff Access</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Restaurant Hub</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Live POS Portals</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Admissions Gateway</Link></li>
            </ul>
          </div>

          {/* Newsletter Input info */}
          <div className="space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white font-semibold">Priority Connect</p>
            <p className="text-[11px] text-[#888888]">Receive early slot dispatches & seasonal membership packages.</p>
            <div className="pt-1">
              <input 
                type="email" 
                placeholder="Enter correspondence email" 
                className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-[#666666] focus:outline-none focus:border-[#DC2626] transition-colors mb-2"
              />
              <button className="w-full py-2 bg-white text-black font-bold uppercase tracking-widest text-[9px] rounded-lg hover:bg-[#DC2626] hover:text-white transition-colors">
                Subscribe Dispatches
              </button>
            </div>
          </div>

        </div>

        {/* Bottom fineprint copyright strip */}
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 text-[10px] text-[#666666] font-mono">
          <p>© 2026 Red Ball Cricket Academy MVP. All ground slots synchronized under automated ledger protocols.</p>
          <div className="flex gap-6">
            <span className="hover:text-[#888888] cursor-pointer transition-colors">Privacy Code</span>
            <span className="hover:text-[#888888] cursor-pointer transition-colors">GST Compliance</span>
            <span className="hover:text-[#888888] cursor-pointer transition-colors">API Architecture</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
