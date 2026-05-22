import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings, 
  Calendar, 
  QrCode, 
  ShieldAlert, 
  UserPlus, 
  CreditCard, 
  Clock, 
  Utensils, 
  ClipboardCheck,
  Grid
} from 'lucide-react';

export default function QuickActions() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/reception';

  const actions = [
    { id: 'services', label: 'Manage Services', icon: <Settings size={24} />, path: `${basePath}/manage-services`, color: 'border-amber-500', bg: 'bg-amber-50' },
    { id: 'bookings', label: 'Manage Bookings', icon: <Calendar size={24} />, path: `${basePath}/manage-bookings`, color: 'border-green-500', bg: 'bg-green-50' },
    { id: 'checkin', label: 'QR Check-In', icon: <QrCode size={24} />, path: `${basePath}/qr-checkin`, color: 'border-blue-500', bg: 'bg-blue-50' },
    { id: 'block', label: 'Block Schedule', icon: <ShieldAlert size={24} />, path: `${basePath}/schedule-blocking`, color: 'border-red-500', bg: 'bg-red-50' },
    { id: 'admission', label: 'Create Admission', icon: <UserPlus size={24} />, path: `${basePath}/admissions`, color: 'border-purple-500', bg: 'bg-purple-50' },
    { id: 'membership', label: 'Assign Membership', icon: <CreditCard size={24} />, path: `${basePath}/memberships`, color: 'border-indigo-500', bg: 'bg-indigo-50' },
    { id: 'onetime', label: 'One-Time Booking', icon: <Clock size={24} />, path: `${basePath}/one-time-play`, color: 'border-orange-500', bg: 'bg-orange-50' },
    { id: 'restaurant', label: 'Restaurant Orders', icon: <Utensils size={24} />, path: `${basePath}/restaurant`, color: 'border-pink-500', bg: 'bg-pink-50' },
    { id: 'attendance', label: 'Attendance Desk', icon: <ClipboardCheck size={24} />, path: `${basePath}/attendance-desk`, color: 'border-cyan-500', bg: 'bg-cyan-50' },
    { id: 'tables', label: 'Generate QR Table', icon: <Grid size={24} />, path: `${basePath}/tables`, color: 'border-teal-500', bg: 'bg-teal-50' },
    { id: 'sports-qrs', label: 'Sports QR Codes', icon: <QrCode size={24} />, path: `${basePath}/sports-qrs`, color: 'border-violet-500', bg: 'bg-violet-50' },
  ].filter(a => {
    // Hide some actions if in reception if they don't exist
    if (basePath === '/reception') {
      return !['services', 'restaurant', 'tables'].includes(a.id);
    }
    return true;
  });

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-gray-900 mb-6 px-1">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {actions.map((action, idx) => (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.02, translateY: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(action.path)}
            className={`flex flex-col items-start p-5 rounded-3xl bg-white border-l-4 ${action.color} shadow-sm hover:shadow-xl transition-all text-left group`}
          >
            <div className={`p-3 rounded-2xl ${action.bg} text-gray-700 mb-4 group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>
            <span className="text-sm font-bold text-gray-800 leading-tight">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
