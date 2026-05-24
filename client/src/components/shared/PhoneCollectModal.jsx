import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../../store/authStore';

export default function PhoneCollectModal({ open, onClose, onSuccess, theme = 'dark' }) {
  const { updatePhone } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      toast.error('Please enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    try {
      await updatePhone(cleaned);
      toast.success('Phone number saved!');
      onSuccess?.(cleaned);
    } catch {
      toast.error('Failed to save phone number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl relative ${
              isDark
                ? 'bg-[#111515] border border-white/10 text-white'
                : 'bg-white border border-gray-200 text-[#111]'
            }`}
          >
            {onClose && (
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <X size={15} />
              </button>
            )}

            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
              isDark ? 'bg-[#C8102E]/15 border border-[#C8102E]/30' : 'bg-red-50 border border-red-200'
            }`}>
              <Phone size={20} className="text-[#C8102E]" />
            </div>

            <h2 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-[#111]'}`}>
              Add your phone number
            </h2>
            <p className={`text-sm mb-5 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              Required to complete your purchase and receive booking updates.
            </p>

            <form onSubmit={handleSubmit}>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 mb-4 ${
                isDark
                  ? 'bg-white/5 border-white/12 focus-within:border-[#C8102E]/60'
                  : 'bg-gray-50 border-gray-200 focus-within:border-[#C8102E]'
              } transition-colors`}>
                <span className={`text-sm font-medium shrink-0 ${isDark ? 'text-white/50' : 'text-gray-400'}`}>+91</span>
                <div className={`w-px h-4 ${isDark ? 'bg-white/15' : 'bg-gray-300'}`} />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  autoFocus
                  className={`flex-1 bg-transparent text-sm outline-none placeholder:text-opacity-40 ${
                    isDark ? 'text-white placeholder:text-white/35' : 'text-[#111] placeholder:text-gray-400'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={loading || phone.replace(/\D/g, '').length < 10}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#a80e27] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold transition-all"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                {loading ? 'Saving…' : 'Save & Continue'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
