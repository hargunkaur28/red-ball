import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const facilities = [
  {
    name: 'Cricket Ground',
    icon: '🏏',
    rate: '₹1,500/hr',
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Swimming Pool',
    icon: '🏊',
    rate: '₹800/hr',
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Badminton Court',
    icon: '🏸',
    rate: '₹600/hr',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop',
  },
  {
    name: 'Football Ground',
    icon: '⚽',
    rate: '₹2,000/hr',
    image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=600&auto=format&fit=crop',
  },
];

const facilityList = [
  { icon: '🏏', name: 'Cricket Ground' },
  { icon: '🏊', name: 'Swimming Pool' },
  { icon: '🏸', name: 'Badminton Court' },
  { icon: '⚽', name: 'Football Ground' },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FacilityRentals() {
  return (
    <section id="facilities" className="bg-[#0D0D0D] py-20 md:py-28">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

            {/* Left Text Column */}
            <div className="space-y-6">
              <p
                className="uppercase tracking-[5px] text-[13px] text-[#F5A623]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                ONE-TIME PLAY
              </p>

              <h2
                className="text-[72px] leading-[1] text-white"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(3rem, 6vw, 4.5rem)' }}
              >
                Facility Rentals
              </h2>

              <p
                className="text-lg text-[#9CA3AF] leading-relaxed max-w-lg"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Need space to play? Book our world-class facilities by the hour — no membership needed.
              </p>

              {/* Facility List */}
              <div className="space-y-3">
                {facilityList.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C8102E]" />
                    <span className="text-white font-semibold text-base" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {item.icon} {item.name}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#C8102E] text-white font-semibold transition-all duration-200 hover:bg-[#8B0B1E] hover:scale-[1.03] hover:shadow-[0_0_16px_rgba(200,16,46,0.4)] mt-4"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Book Now →
              </Link>
            </div>

            {/* Right Cards 2×2 Grid */}
            <motion.div
              className="grid grid-cols-2 gap-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
            >
              {facilities.map((facility) => (
                <motion.div
                  key={facility.name}
                  variants={cardVariants}
                  className="facility-card group relative h-[220px] rounded-xl overflow-hidden border border-white/[0.08] cursor-pointer bg-gradient-to-br from-[#1A1A1A] via-[#222222] to-[#2D1215]"
                  style={{ transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(200,16,46,0.35)';
                    e.currentTarget.style.borderColor = '#C8102E';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }}
                >
                  {/* Fallback pattern */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

                  {/* BG Image */}
                  <img
                    src={facility.image}
                    alt={facility.name}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-black/60 sm:bg-black/40" />

                  {/* Icon top-left */}
                  <span className="absolute top-3 left-3 text-2xl z-10">{facility.icon}</span>

                  {/* Bottom content */}
                  <div className="absolute bottom-3 left-3 right-3 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-1.5 z-10">
                    <span className="text-white text-lg sm:text-[22px] font-heading font-bold leading-tight">
                      {facility.name}
                    </span>
                    <span
                      className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-[#F5A623] text-[#0D0D0D] text-[11px] sm:text-xs font-bold whitespace-nowrap shadow-sm self-start sm:self-auto"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {facility.rate}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
