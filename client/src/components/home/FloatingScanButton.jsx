import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, LogIn } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function FloatingScanButton() {
  const [visible, setVisible] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    if (isAuthenticated) {
      navigate('/user/scan');
    } else {
      setShowMenu(true);
    }
  };

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 300 }}
            className="fixed z-50 sm:hidden"
            style={{ bottom: '28px', right: '24px' }}
          >
            <button
              onClick={handleClick}
              aria-label="Scan QR to Check-In"
              className="flex items-center gap-1.5 pl-2.5 pr-3.5 h-10 rounded-full bg-primary text-white shadow-[0_4px_20px_rgba(200,16,46,0.45)] hover:bg-[#A60D25] transition-all duration-200 hover:scale-105"
            >
              <ScanLine size={22} className="shrink-0" />
              <span className="text-sm font-bold tracking-wide whitespace-nowrap" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Check-In
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {showMenu && createPortal(
        <>
          <div
            className="fixed inset-0 z-9998 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-9999 bg-[#111] border border-white/10 rounded-2xl p-5 shadow-2xl text-center"
            style={{ width: 280 }}
          >
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
              <ScanLine size={22} className="text-primary" />
            </div>
            <p className="text-white font-bold text-sm mb-1">Check-In requires an account</p>
            <p className="text-white/40 text-xs mb-4 leading-relaxed">
              Login or sign up to access the QR scanner and check into your sessions.
            </p>
            <Link
              to="/login?redirectTo=/user/scan"
              onClick={() => setShowMenu(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary hover:bg-[#a60d25] text-white text-sm font-bold transition-all mb-2"
            >
              <LogIn size={16} /> Login / Sign Up
            </Link>
            <button
              onClick={() => { window.open('https://lens.google.com/', '_blank', 'noopener,noreferrer'); setShowMenu(false); }}
              className="text-white/30 text-xs hover:text-white/60 transition-colors mt-1"
            >
              or scan manually with phone camera / Google Lens
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
