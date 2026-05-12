import { motion } from 'framer-motion';
import PageHeader from '../../components/shared/PageHeader';
import { Link } from 'react-router-dom';
import { GraduationCap, CreditCard, Activity, Receipt } from 'lucide-react';

const actions = [
  { icon: <GraduationCap size={40} strokeWidth={1} />, title: 'New Admission', desc: 'Register a new student', href: '/reception/admissions', color: 'border-black/30' },
  { icon: <CreditCard size={40} strokeWidth={1} />, title: 'Membership Renewal', desc: 'Renew existing membership', href: '/reception/memberships', color: 'border-blue-600/30' },
  { icon: <Activity size={40} strokeWidth={1} />, title: 'One-Time Play', desc: 'Quick entry for walk-ins', href: '/reception/one-time-play', color: 'border-green-600/30' },
  { icon: <Receipt size={40} strokeWidth={1} />, title: 'Print Receipt', desc: 'Search and print receipts', href: '/reception/payments', color: 'border-yellow-600/30' },
];

export default function ReceptionDashboard() {
  return (
    <div>
      <PageHeader title="Reception Panel" subtitle="Quick actions for daily operations" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {actions.map((a, i) => (
          <motion.div key={a.title}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <Link to={a.href} className={`card flex items-center gap-6 cursor-pointer hover:bg-[#F5F5F5] border ${a.color} transition-all`}>
              <span className="text-current">{a.icon}</span>
              <div>
                <h3 className="text-xl font-bold text-[#111111]">{a.title}</h3>
                <p className="text-sm text-[#888888]">{a.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      <div className="card">
        <h3 className="text-sm font-medium text-[#666666] mb-4">Today's Activity Log</h3>
        <p className="text-[#888888] text-sm text-center py-8">Activity will appear here as the day progresses.</p>
      </div>
    </div>
  );
}
