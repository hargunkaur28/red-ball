import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Award, Target, Trophy, Feather, Waves, Dumbbell, Flower2, Star } from 'lucide-react';

const sports = [
  { 
    icon: <Target size={20} />, 
    name: 'Cricket Coaching', 
    desc: 'Master batting, bowling & fielding with elite professional coaches in state-of-the-art practice nets.',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1200&auto=format&fit=crop',
    tag: 'Flagship Program',
    stats: 'BCCI Certified Coaches'
  },
  { 
    icon: <Trophy size={20} />, 
    name: 'Football Training', 
    desc: 'Sharpen elite ball control, tactical positioning, and high-speed match play under premium floodlights.',
    // image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    image: 'https://plus.unsplash.com/premium_photo-1661868926397-0083f0503c07?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    tag: 'Cinematic Turf',
    stats: 'FIFA Standard Pitch'
  },
  { 
    icon: <Feather size={20} />, 
    name: 'Badminton Coaching', 
    desc: 'Build explosive court agility, smash precision, and master high-intensity indoor strategy.',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
    tag: 'Pro Courts',
    stats: 'BWF Approved Mats'
  },
  { 
    icon: <Waves size={20} />, 
    name: 'Swimming Sessions', 
    desc: 'Learn competitive strokes, core endurance, and flawless diving technique in our all-weather pool.',
    image: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?q=80&w=1200&auto=format&fit=crop',
    tag: 'Temperature Controlled',
    stats: 'Olympic Dimensions'
  },
  { 
    icon: <Dumbbell size={20} />, 
    name: 'Gym & Fitness', 
    desc: 'Achieve absolute peak athletic conditioning with bespoke high-performance strength and explosive power regimens.',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
    tag: 'Strength & Conditioning',
    stats: 'Premium Rogue Gear'
  },
  { 
    icon: <Flower2 size={20} />, 
    name: 'Yoga & Recovery', 
    desc: 'Accelerate post-match deep tissue repair, dynamic mobility, and laser-sharp mental visualization.',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
    tag: 'Athlete Wellness',
    stats: 'Cryo & Biohacking'
  },
  { 
    icon: <Star size={20} />, 
    name: "Kids' Cricket Clinic", 
    desc: 'High-energy foundational multi-skill coaching designed to ignite lifelong passion and flawless fundamental habits.',
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=1200&auto=format&fit=crop',
    tag: 'Junior Academy',
    stats: 'Ages 5 to 12'
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function TrainingPrograms() {
  const [activeTabSport, setActiveTabSport] = useState(0);

  return (
    <section id="sports" className="bg-[#111111] text-white py-20 md:py-32 relative overflow-hidden">
      {/* Background radial ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C8102E]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1320px] mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#F5A623] text-xs font-semibold uppercase tracking-[0.2em] mb-4 backdrop-blur-md">
            <Sparkles size={13} /> Cinematic Athlete Experience
          </div>
          <h2 className="section-heading text-white tracking-tight mb-4">
            Elite Sports Coaching & Training
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-base md:text-lg font-body">
            Inspired by international high-performance hubs like Star Sports Academy. Immersive, energetic disciplines guided by world-class athletic pedagogy.
          </p>
        </motion.div>

        {/* Cinematic Showcase Feature Banner (Above Sections) */}
        <div className="mb-16 md:mb-24">
          {/* Horizontal scrollable tabs container for mobile */}
          <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-4 mb-6 overflow-x-auto pb-2 scrollbar-none px-2 sm:px-0 w-full">
            {sports.slice(0, 4).map((sport, idx) => (
              <button
                key={sport.name}
                onClick={() => setActiveTabSport(idx)}
                className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-body text-xs sm:text-sm font-medium transition-all duration-300 flex items-center gap-1.5 sm:gap-2 border shrink-0 whitespace-nowrap ${
                  activeTabSport === idx
                    ? 'bg-[#C8102E] text-white border-[#C8102E] shadow-[0_0_20px_rgba(200,16,46,0.4)] scale-[1.02]'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-base sm:text-lg">{sport.icon}</span>
                {sport.name}
              </button>
            ))}
          </div>

          {/* Immersive Photo/Video Backdrop Viewport */}
          <div className="relative w-full h-[380px] md:h-[520px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl group bg-gradient-to-br from-[#2A080C] via-[#111111] to-[#1A1A1A]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTabSport}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full flex items-center justify-center"
              >
                {/* Premium Fallback Mesh Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#C8102E_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

                {/* Immersive Premium Background Image */}
                <img 
                  src={sports[activeTabSport].image} 
                  alt={sports[activeTabSport].name} 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
                
                {/* Dark Gradient Overlays for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

                {/* Internal Cinematic Floating Content */}
                <div className="absolute inset-0 p-6 md:p-12 flex flex-col justify-end max-w-3xl z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#C8102E] text-white font-body font-bold text-xs uppercase tracking-widest w-fit mb-3 shadow-md">
                    <Award size={13} /> {sports[activeTabSport].tag}
                  </span>
                  
                  <h3 className="text-3xl md:text-5xl lg:text-6xl text-white font-heading tracking-wide mb-3 drop-shadow-md font-extrabold">
                    {sports[activeTabSport].name}
                  </h3>
                  
                  <p className="text-white/90 text-sm md:text-lg font-body leading-relaxed mb-6 drop-shadow-sm max-w-2xl font-medium">
                    {sports[activeTabSport].desc}
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-[#F5A623] text-sm font-semibold font-body shadow-sm">
                      ⚡ {sports[activeTabSport].stats}
                    </div>
                    <button className="px-6 py-2.5 rounded-xl bg-white text-black font-body font-bold text-sm hover:bg-[#F5A623] hover:text-white transition-all duration-200 hover:scale-105 flex items-center gap-2 shadow-lg">
                      Book Trial Session <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Ambient vignette */}
            <div className="absolute inset-0 border border-white/10 rounded-3xl pointer-events-none" />
          </div>
        </div>

        {/* Additional Specialized Disciplines Grid (Desktop & Tablet) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {sports.slice(4).map((sport) => (
            <motion.div
              key={sport.name}
              variants={cardVariants}
              className="relative h-[420px] rounded-2xl overflow-hidden group cursor-pointer border border-white/10 shadow-xl bg-gradient-to-br from-[#1A1A1A] via-[#222222] to-[#2D1215]"
            >
              {/* Fallback pattern */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

              {/* Premium Photographic Background */}
              <img 
                src={sport.image} 
                alt={sport.name} 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              />

              {/* Dark Gradient Overlays for Maximum Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/70 to-black/40 group-hover:via-[#0D0D0D]/80 transition-colors duration-500" />
              
              {/* Subtle top subtle gradient for tag layout */}
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />

              {/* Top Details */}
              <div className="absolute top-5 inset-x-5 flex items-center justify-between z-10">
                <span className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl shadow-md group-hover:bg-[#C8102E] transition-colors duration-300">
                  {sport.icon}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/80 font-body text-xs font-semibold tracking-wider uppercase">
                  {sport.tag}
                </span>
              </div>

              {/* Bottom Content Area */}
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col justify-end z-10">
                <div className="text-[#F5A623] font-body font-bold text-xs uppercase tracking-widest mb-1 opacity-90">
                  {sport.stats}
                </div>
                
                <h3 className="text-2xl md:text-3xl font-heading text-white tracking-wide mb-2 group-hover:text-[#F5A623] transition-colors duration-300">
                  {sport.name}
                </h3>
                
                <p className="text-white/70 font-body text-sm line-clamp-2 leading-relaxed mb-5 group-hover:text-white/90 transition-colors duration-300">
                  {sport.desc}
                </p>

                {/* CTA interactive element */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-white font-body text-xs font-bold uppercase tracking-wider group/link">
                  <span className="group-hover:text-[#C8102E] transition-colors duration-200">Explore Program</span>
                  <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#C8102E] group-hover:translate-x-1 transition-all duration-300">
                    <ArrowRight size={14} className="text-white" />
                  </span>
                </div>
              </div>

              {/* Subtle interactive glowing border effect */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#C8102E]/50 rounded-2xl transition-colors duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>

        {/* Continuous Infinite Marquee Ticker (Mobile Only) */}
        <div className="md:hidden overflow-hidden w-full relative py-2">
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#111111] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#111111] to-transparent z-10 pointer-events-none" />
          
          <motion.div 
            animate={{ x: [0, -1032] }}
            transition={{ ease: "linear", duration: 25, repeat: Infinity }}
            className="flex gap-6 w-max"
          >
            {[...sports.slice(4), ...sports.slice(4), ...sports.slice(4)].map((sport, index) => (
              <div
                key={`${sport.name}-${index}`}
                className="relative h-[380px] w-[320px] rounded-2xl overflow-hidden group border border-white/10 shadow-xl bg-gradient-to-br from-[#1A1A1A] via-[#222222] to-[#2D1215] shrink-0"
              >
                {/* Fallback pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
                <img src={sport.image} alt={sport.name} onError={(e) => { e.currentTarget.style.display = 'none'; }} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/70 to-black/40" />
                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />
                <div className="absolute top-5 inset-x-5 flex items-center justify-between z-10">
                  <span className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-lg shadow-md">{sport.icon}</span>
                  <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/80 font-body text-[10px] font-semibold tracking-wider uppercase">{sport.tag}</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end z-10">
                  <div className="text-[#F5A623] font-body font-bold text-[11px] uppercase tracking-widest mb-1 opacity-90">{sport.stats}</div>
                  <h3 className="text-xl font-heading text-white tracking-wide mb-2">{sport.name}</h3>
                  <p className="text-white/70 font-body text-xs line-clamp-2 leading-relaxed mb-4">{sport.desc}</p>
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-white font-body text-[11px] font-bold uppercase tracking-wider">
                    <span className="text-[#C8102E]">Explore Program</span>
                    <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"><ArrowRight size={12} className="text-white" /></span>
                  </div>
                </div>
                <div className="absolute inset-0 border border-transparent rounded-2xl pointer-events-none" />
              </div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  );
}
