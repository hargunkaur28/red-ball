import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function MotivationalBanner() {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1920&auto=format&fit=crop')`,
        }}
      />
      {/* Heavy dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 max-w-[900px] mx-auto px-4 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2
            className="text-white mb-6"
            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(3rem, 7vw, 4.5rem)', lineHeight: 1.05 }}
          >
            Unleash Your Potential. Play with Passion!
          </h2>

          <p
            className="text-white/75 text-lg leading-relaxed mb-10 max-w-[700px] mx-auto"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Join Red Ball Cricket Academy — where champions are crafted. Whether you're
            a beginner or aiming for competitive greatness, every session brings
            you one step closer to your best.
          </p>

          <Link
            to="/login?mode=register"
            className="inline-flex px-10 py-4 rounded-full bg-[#C8102E] text-white text-lg font-semibold transition-all duration-200 hover:bg-[#8B0B1E] hover:scale-[1.04] hover:shadow-[0_0_24px_rgba(200,16,46,0.5)]"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Join the Academy →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
