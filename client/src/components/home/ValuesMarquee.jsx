import { motion } from 'framer-motion';

const tickerItems = [
  'HEART', 'RESPECT', 'TEAMWORK', 'DISCIPLINE',
  'INTEGRITY', 'PASSION', 'SPIRIT', 'EXCELLENCE',
];

// Cricket ball SVG as separator
const BallSeparator = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" className="mx-4 shrink-0 opacity-80">
    <circle cx="9" cy="9" r="7" fill="none" stroke="white" strokeWidth="1.5" />
    <path d="M6 3.5c1.5 3.5 1.5 7.5 0 11M12 3.5c-1.5 3.5-1.5 7.5 0 11" stroke="white" strokeWidth="0.8" fill="none" />
  </svg>
);

const pillars = [
  {
    heading: 'Community',
    text: 'We unite players, families, and coaches in an inclusive environment where everyone feels valued. Together we build bonds that go beyond the sport.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=600&auto=format&fit=crop',
  },
  {
    heading: 'Fun',
    text: 'Enjoying the game creates a positive environment for players to thrive. Team activities and outings foster joyful memories.',
    image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=600&auto=format&fit=crop',
  },
  {
    heading: 'Teamwork',
    text: 'Collaboration and trust are at our core. We help every player support each other on and off the field, building lasting friendships.',
    image: 'https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?q=80&w=600&auto=format&fit=crop',
  },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};
const pillarVariants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function ValuesMarquee() {
  return (
    <section className="bg-[#0D0D0D]">
      {/* Part A — Infinite Horizontal Ticker */}
      <div className="bg-[#C8102E] py-4 overflow-hidden">
        <div className="ticker-track">
          {/* Render content twice for seamless loop */}
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center shrink-0">
              {tickerItems.map((item, i) => (
                <div key={`${copy}-${i}`} className="flex items-center">
                  <span
                    className="text-white text-[28px] tracking-[4px] whitespace-nowrap"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {item}
                  </span>
                  <BallSeparator />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Part B — Community Pillars */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-20 md:py-28">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {pillars.map((pillar) => (
            <motion.div
              key={pillar.heading}
              variants={pillarVariants}
              className="pillar group"
            >
              {/* Image */}
              <div className="pillar-image-wrapper overflow-hidden rounded-xl mb-6 h-[260px]">
                <img
                  src={pillar.image}
                  alt={pillar.heading}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[550ms] ease-out group-hover:scale-[1.07]"
                />
              </div>

              <h3
                className="text-white text-[44px] leading-[1] mb-3"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                {pillar.heading}
              </h3>

              <p
                className="text-[#9CA3AF] text-base leading-relaxed"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {pillar.text}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
