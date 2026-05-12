import { motion } from 'framer-motion';
import CountUpPkg from 'react-countup';

const CountUp = CountUpPkg.default || CountUpPkg;

export default function StatCard({ title, value, icon, subtitle, accent = false, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`card cursor-pointer transition-all border-none shadow-[0_2px_15px_rgba(0,0,0,0.03)]`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-semibold tracking-[0.15em] text-[#888888] uppercase">{title}</span>
        <span className="text-lg text-[#111111]">{icon}</span>
      </div>
      <div className="text-4xl serif-heading text-[#111111] mb-2">
        <CountUp end={typeof value === 'number' ? value : 0} duration={1.2} separator="," />
      </div>
      {subtitle && <p className="text-xs text-[#666666] leading-relaxed">{subtitle}</p>}
    </motion.div>
  );
}
