import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY >= 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className="fixed z-50 w-14 h-14 rounded-full bg-[#C8102E] text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-[#8B0B1E] hover:scale-110"
      style={{
        bottom: '28px',
        right: '24px',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <ArrowUp size={22} />
    </button>
  );
}
