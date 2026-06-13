import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, GraduationCap, UserCheck, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { formatCurrency } from '../../lib/utils';
import useAuthStore from '../../store/authStore';
import MembershipBookingModal from './MembershipBookingModal';

export default function KidsAcademyPlanCard({ plan, sport, index = 0 }) {
  const { user, isAuthenticated } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check admission status — only if authenticated and sport is available
  const { data: admissionData } = useQuery({
    queryKey: ['academy-admission-status', sport?._id],
    queryFn: () => api.get('/academy/admission-status', { params: { sportId: sport._id } }).then((r) => r.data),
    enabled: !!isAuthenticated && !!sport?._id,
    staleTime: 5 * 60 * 1000,
  });

  const admissionPaid = admissionData?.admissionPaid === true;
  const admissionFee = plan.admissionFeeAmount || 0;
  const monthlyPrice = plan.price || 0;
  const totalToday = admissionFee + monthlyPrice;

  const handleEnrol = () => {
    setIsModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="relative rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-all duration-300 h-full"
      style={{
        background: 'linear-gradient(135deg, #0D0A1A 0%, #1A0F2E 100%)',
        border: '1px solid rgba(139,92,246,0.35)',
        boxShadow: '0 8px 32px rgba(139,92,246,0.12)',
      }}
    >
      {/* Kids Academy badge */}
      <div
        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 whitespace-nowrap"
        style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)', color: '#fff' }}
      >
        <GraduationCap size={9} />
        Kids Academy
      </div>

      {/* Top section */}
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <GraduationCap size={13} className="text-violet-400" />
            <span className="text-white/40 text-[10px] uppercase tracking-[2px] font-bold">
              {plan.duration}
            </span>
          </div>
          <p className="text-white font-black text-xl leading-tight pr-4">{plan.name}</p>
        </div>

        {/* Price display */}
        <div>
          {isAuthenticated ? (
            admissionPaid ? (
              <div>
                <p className="font-black text-[28px] leading-none text-violet-400">
                  {formatCurrency(monthlyPrice)}
                </p>
                <p className="text-white/40 text-[11px] mt-1 flex items-center gap-1">
                  <Check size={10} className="text-green-400" />
                  Admission already paid
                </p>
              </div>
            ) : (
              <div>
                <p className="font-black text-[22px] leading-none text-violet-400">
                  {formatCurrency(totalToday)} today
                </p>
                <p className="text-white/40 text-[11px] mt-1">
                  {formatCurrency(admissionFee)} admission + {formatCurrency(monthlyPrice)}/month
                </p>
              </div>
            )
          ) : (
            <div>
              <p className="font-black text-[28px] leading-none text-violet-400">
                {formatCurrency(monthlyPrice)}
                <span className="text-base font-bold text-white/40">/month</span>
              </p>
              <p className="text-white/35 text-[11px] mt-1 flex items-center gap-1">
                <Info size={10} />
                + {formatCurrency(admissionFee)} admission (once)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-1.5">
        {[
          { icon: UserCheck, text: 'Coach Included', color: 'text-violet-400' },
          { icon: GraduationCap, text: 'Structured Training Programme', color: 'text-violet-400' },
          { icon: Check, text: 'Admission fee charged only once', color: 'text-green-400' },
          ...(plan.features?.filter(f => !['Coach Included', 'Structured Training', 'Admission Fee Charged Once'].includes(f)).slice(0, 2).map(f => ({ icon: Check, text: f, color: 'text-violet-300' })) || []),
        ].map(({ icon: Icon, text, color }) => (
          <li key={text} className="flex items-center gap-2 text-xs text-white/60">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
            >
              <Icon size={9} className={color} />
            </div>
            {text}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={handleEnrol}
        className="w-full mt-auto py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-200 hover:opacity-90 active:scale-[0.98] text-white"
        style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }}
      >
        Enrol Now
      </button>

      <MembershipBookingModal
        plan={plan}
        sport={sport}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </motion.div>
  );
}
