import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function PortalCTA() {
  return (
    <section className="bg-white py-20 md:py-28 relative overflow-hidden">
      {/* Subtle cricket field line pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="field-lines" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M0 30h60M30 0v60" stroke="#0D0D0D" strokeWidth="0.5" fill="none" />
              <circle cx="30" cy="30" r="15" stroke="#0D0D0D" strokeWidth="0.5" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#field-lines)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-[700px] mx-auto px-4 md:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="section-heading text-[#0D0D0D] mb-6">
            Welcome to the Red Ball Cricket Academy Portal
          </h2>

          <p className="text-lg text-[#6B7280] leading-relaxed mb-10 max-w-[600px] mx-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Access your personalized dashboard — view memberships, booking history,
            restaurant orders, progress reports, and announcements. All in one place.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-full bg-[#C8102E] text-white font-semibold transition-all duration-200 hover:bg-[#8B0B1E] hover:scale-[1.03] hover:shadow-[0_0_16px_rgba(200,16,46,0.4)]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Sign Up →
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 rounded-full border-2 border-[#0D0D0D] text-[#0D0D0D] font-semibold transition-all duration-200 hover:bg-[#0D0D0D] hover:text-white hover:scale-[1.03]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              Log In
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
