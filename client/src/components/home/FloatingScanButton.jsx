import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function FloatingScanButton() {
  const [visible, setVisible] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const href = isAuthenticated ? '/user/scan' : '/login?redirectTo=/user/scan';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 300 }}
          className="fixed z-50 group sm:hidden"
          style={{ bottom: '28px', right: '24px' }}
        >
          <Link
            to={href}
            aria-label="Scan QR to Check-In"
            className="flex items-center gap-1.5 pl-2.5 pr-3.5 h-10 rounded-full bg-[#C8102E] text-white shadow-[0_4px_20px_rgba(200,16,46,0.45)] hover:bg-[#A60D25] transition-all duration-200 hover:scale-105"
          >
            <ScanLine size={22} className="shrink-0" />
            <span className="text-sm font-bold tracking-wide whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              Check-In
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
