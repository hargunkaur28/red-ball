import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const cyclingWords = ['Passionately', 'Relentlessly', 'Confidently', 'Fearlessly', 'Proudly', 'Purposefully'];

const heroImages = [
  'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=1920&auto=format&fit=crop',
];

export default function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0);
  const [animClass, setAnimClass] = useState('word-enter');
  const [bgIndex, setBgIndex] = useState(0);

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
    <section id="hero" className="relative w-full h-screen overflow-hidden">
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
      <div className="relative z-20 h-full flex items-center pt-24 md:pt-0">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 w-full">
          <div className="max-w-[700px]">

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
              className="flex flex-wrap gap-4"
            >
              <Link
                to="/login"
                className="px-8 py-3.5 rounded-full bg-[#C8102E] text-white text-base font-semibold transition-all duration-200 hover:bg-[#8B0B1E] hover:scale-[1.04] hover:shadow-[0_0_20px_rgba(200,16,46,0.45)] flex items-center gap-2"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                🏏 Book a Ground
              </Link>
              <a
                href="#membership"
                className="px-8 py-3.5 rounded-full border-2 border-[#F5A623] text-[#F5A623] text-base font-semibold transition-all duration-200 hover:bg-[#F5A623] hover:text-black hover:scale-[1.04]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Join Now
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <ChevronDown size={32} className="text-white animate-bounce-chevron" />
      </div>
    </section>
  );
}
