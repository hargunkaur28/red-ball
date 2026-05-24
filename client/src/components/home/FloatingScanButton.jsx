import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Camera, LogIn, X } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function FloatingScanButton() {
  const [visible, setVisible] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const cameraInputRef = useRef(null);

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
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={() => setShowMenu(false)}
      />
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

      {/* Options popup for non-logged-in users */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-61 bg-[#111] border border-white/10 rounded-2xl p-4 shadow-2xl w-67.5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-white text-sm font-bold">How do you want to check in?</p>
                <button onClick={() => setShowMenu(false)} className="text-white/40 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
              <button
                onClick={() => { cameraInputRef.current?.click(); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/8 transition-all text-left mb-2 border border-white/5 hover:border-white/15"
              >
                <div className="w-9 h-9 rounded-xl bg-[#0EA5E9]/15 flex items-center justify-center shrink-0">
                  <Camera size={18} className="text-[#0EA5E9]" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">Open Camera</p>
                  <p className="text-white/40 text-xs mt-0.5">Scan the QR code at the gate</p>
                </div>
              </button>
              <Link
                to="/login"
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/8 transition-all border border-white/5 hover:border-white/15"
              >
                <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
                  <LogIn size={18} className="text-gold" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">Login / Sign Up</p>
                  <p className="text-white/40 text-xs mt-0.5">Access your account & passes</p>
                </div>
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
