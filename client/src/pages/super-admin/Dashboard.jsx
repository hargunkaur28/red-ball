import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CreditCard, Ticket, ArrowRight, Calendar, AlertTriangle, Activity, LogIn, LogOut } from 'lucide-react';
import api from '../../lib/axios';
import io from 'socket.io-client';

const today = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const formattedDate = () =>
  new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

// ─── Skeleton Card ────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="h-1.5 bg-gray-200 animate-pulse" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-end justify-between pt-2">
          <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── Navigation Card ──────────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.1, duration: 0.45, ease: 'easeOut' },
  }),
};

function StatCard({ icon: Icon, title, description, stat, statLabel, gradient, to, index }) {
  const navigate = useNavigate();

  return (
    <motion.button
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(to)}
      className="card overflow-hidden text-left w-full cursor-pointer group transition-shadow duration-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/40"
    >
      {/* Gradient accent bar */}
      <div className={`h-1.5 ${gradient}`} />

      <div className="p-6">
        {/* Top row — icon + title */}
        <div className="flex items-center gap-3 mb-5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${gradient} text-white shadow-sm`}>
            <Icon size={22} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[#0D0D0D] text-base leading-tight font-['Inter']">
              {title}
            </h3>
            <p className="text-xs text-[#9CA3AF] mt-0.5 leading-snug">{description}</p>
          </div>
        </div>

        {/* Stat + CTA */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-[#0D0D0D] font-['Inter'] tracking-tight">
              {stat ?? '—'}
            </p>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 uppercase tracking-wide font-medium">
              {statLabel}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-[#C8102E] opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            Open <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [checkInLog, setCheckInLog] = useState([]);

  // Fetch today's check-in/out feed on mount
  useEffect(() => {
    const fetchRecentFeed = async () => {
      try {
        const { data } = await api.get('/attendance/today');
        const recentLogs = [];
        data.attendance.forEach(a => {
          const userName = a.userId?.name || 'Unknown User';
          if (a.checkOutTime) {
            recentLogs.push({
              type: 'check-out',
              id: `out-${a._id}`,
              sport: a.sport,
              userName,
              timestamp: a.checkOutTime,
            });
          }
          if (a.checkInTime) {
            recentLogs.push({
              type: 'check-in',
              id: `in-${a._id}`,
              sport: a.sport,
              userName,
              timestamp: a.checkInTime,
            });
          }
        });
        
        recentLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setCheckInLog(recentLogs.slice(0, 20));
      } catch (error) {
        console.error('Error fetching recent attendance:', error);
      }
    };
    fetchRecentFeed();
  }, []);

  // Socket.IO for real-time check-in/out events
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const socket = io(serverUrl, { transports: ['websocket', 'polling'] });

    socket.on('attendance:check-in', (data) => {
      setCheckInLog(prev => [{ type: 'check-in', ...data, id: Date.now() }, ...prev].slice(0, 20));
      qc.invalidateQueries({ queryKey: ['dashboard-sports'] });
    });
    socket.on('attendance:check-out', (data) => {
      setCheckInLog(prev => [{ type: 'check-out', ...data, id: Date.now() }, ...prev].slice(0, 20));
      qc.invalidateQueries({ queryKey: ['dashboard-sports'] });
    });
    socket.on('attendance:auto-checkout', (data) => {
      setCheckInLog(prev => [{ type: 'auto-checkout', ...data, id: Date.now() }, ...prev].slice(0, 20));
      qc.invalidateQueries({ queryKey: ['dashboard-sports'] });
    });
    socket.on('dashboard:refresh', () => {
      qc.invalidateQueries({ queryKey: ['dashboard-sports'] });
    });

    return () => socket.disconnect();
  }, [qc]);
  // Fetch active sports count
  const { data: sportsData, isLoading: sportsLoading } = useQuery({
    queryKey: ['dashboard-sports'],
    queryFn: async () => {
      const { data } = await api.get('/sports');
      return data;
    },
    staleTime: 60_000,
  });

  // Fetch active memberships total
  const { data: membershipsData, isLoading: membershipsLoading } = useQuery({
    queryKey: ['dashboard-memberships'],
    queryFn: async () => {
      const { data } = await api.get('/super-admin/memberships', {
        params: { status: 'active', limit: 1 },
      });
      return data;
    },
    staleTime: 60_000,
  });

  // Fetch today's one-time entries
  const { data: oneTimeData, isLoading: oneTimeLoading } = useQuery({
    queryKey: ['dashboard-onetime', today()],
    queryFn: async () => {
      const d = today();
      const { data } = await api.get('/super-admin/one-time', {
        params: { limit: 1, startDate: d, endDate: d },
      });
      return data;
    },
    staleTime: 30_000,
  });

  // Fetch pending fees & expiring memberships alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: async () => {
      const { data } = await api.get('/admissions/pending-fees');
      return data;
    },
    staleTime: 30_000,
  });

  const isCardsLoading = sportsLoading || membershipsLoading || oneTimeLoading;

  const activeSportsCount = sportsData?.sports
    ? sportsData.sports.filter((s) => 
        s.active !== false && 
        !s.deletedAt && 
        !['all services', 'coaching'].includes((s.name || '').toLowerCase())
      ).length
    : undefined;

  const cards = [
    {
      icon: Trophy,
      title: 'Sports Management',
      description: 'Manage sports, pricing & categories',
      stat: activeSportsCount,
      statLabel: 'Active Sports',
      gradient: 'bg-gradient-to-r from-[#C8102E] to-[#E8334A]',
      to: '/super-admin/sports',
    },
    {
      icon: CreditCard,
      title: 'Memberships',
      description: 'Membership plans & subscriptions',
      stat: membershipsData?.total,
      statLabel: 'Active Plans',
      gradient: 'bg-gradient-to-r from-[#F5A623] to-[#F7BC5B]',
      to: '/super-admin/memberships',
    },
    {
      icon: Ticket,
      title: 'One-Time Entries',
      description: "Today's walk-in & day-pass entries",
      stat: oneTimeData?.total,
      statLabel: "Today's Entries",
      gradient: 'bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6]',
      to: '/super-admin/one-time',
    },
  ];

  return (
    <div className="w-full pt-1 pb-6">
      {/* ── Welcome Header ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mb-6"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0D0D0D] font-['Inter'] tracking-tight">
          {greeting()}, Admin 👋
        </h1>
        <div className="flex items-center gap-2 mt-2 text-[#9CA3AF]">
          <Calendar size={15} />
          <span className="text-sm">{formattedDate()}</span>
        </div>
      </motion.div>

      {/* ── Active Alerts ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-sm font-bold tracking-wider text-[#9CA3AF] uppercase font-['Inter']">
            System Alerts
          </h2>
        </div>

        {alertsLoading ? (
          <div className="card animate-pulse py-5">
            <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-72 bg-gray-100 rounded" />
          </div>
        ) : alertsData?.expiringMemberships?.length > 0 ? (
          <div className="border border-amber-100 bg-amber-50/30 rounded-2xl p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-amber-100/50">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <AlertTriangle size={16} className="text-amber-600 animate-pulse" />
                <span>{alertsData.expiringMemberships.length} Membership(s) Expiring Soon</span>
              </div>
              <button
                onClick={() => navigate('/super-admin/memberships')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 hover:underline transition-all flex items-center gap-0.5"
              >
                View Roster <ArrowRight size={12} />
              </button>
            </div>
            
            <div className="max-h-[180px] overflow-y-auto pr-1 space-y-2.5">
              {alertsData.expiringMemberships.map((m) => {
                const daysLeft = Math.ceil(
                  (new Date(m.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={m._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/70 hover:bg-white border border-amber-100/50 rounded-xl px-4 py-3 transition-colors gap-2"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#0D0D0D] font-['Inter'] leading-tight">
                        {m.studentId?.name || 'Unknown Student'}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">
                        {m.planId?.name || 'Standard Plan'} ({m.studentId?.phone || 'No phone'})
                      </p>
                    </div>
                    <span className="badge badge-warning self-start sm:self-center font-medium font-mono text-[10px]">
                      {daysLeft <= 0 ? 'Expires Today' : `Expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card py-5 flex items-center justify-between hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-[#0D0D0D] font-['Inter'] leading-tight">
                  No Active Expiry Alerts
                </p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">
                  All active student memberships and pricing plans are in healthy standing.
                </p>
              </div>
            </div>
            <span className="badge badge-success hidden sm:inline-flex text-[9px] tracking-wider font-semibold">
              All Healthy
            </span>
          </div>
        )}
      </motion.div>

      {/* ── Navigation Cards ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isCardsLoading
          ? Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
          : cards.map((card, i) => (
              <StatCard key={card.title} index={i} {...card} />
            ))}
      </div>

      {/* ── Live Academy Occupancy ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.45 }}
        className="mt-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-[#C8102E]" />
          <h2 className="text-sm font-bold tracking-wider text-[#9CA3AF] uppercase font-['Inter']">
            Live Academy Occupancy
          </h2>
        </div>
        {sportsLoading ? (
          <div className="card animate-pulse py-5">
            <div className="h-4 w-48 bg-gray-200 rounded" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {(sportsData?.sports || [])
              .filter(s => s.active && !s.deletedAt && !['all services', 'coaching'].includes((s.name || '').toLowerCase()))
              .map(sport => (
              <div key={sport._id} className="card py-4 px-4 text-center hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">{sport.name}</p>
                <p className="text-2xl font-black text-[#0D0D0D] font-['Inter']">{sport.activeOccupancy || 0}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">players</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Real-time Check-In Log ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.45 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <LogIn size={16} className="text-blue-500" />
          <h2 className="text-sm font-bold tracking-wider text-[#9CA3AF] uppercase font-['Inter']">
            Live Check-In Feed
          </h2>
        </div>
        {checkInLog.length === 0 ? (
          <div className="card py-4 text-center text-sm text-[#9CA3AF]">
            No check-in/check-out events yet. Events appear here in real-time as members scan QR codes.
          </div>
        ) : (
          <div className="card !p-0 overflow-hidden">
            <div className="max-h-[280px] overflow-y-auto divide-y divide-gray-50 py-1">
              <AnimatePresence initial={false}>
                {checkInLog.map(entry => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      entry.type === 'check-in' ? 'bg-green-50 text-green-600' :
                      entry.type === 'check-out' ? 'bg-blue-50 text-blue-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {entry.type === 'check-in' ? <LogIn size={14} /> :
                       entry.type === 'check-out' ? <LogOut size={14} /> :
                       <Activity size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0D0D0D] truncate">
                        {entry.type === 'auto-checkout'
                          ? `Auto-checkout: ${entry.count} session(s)`
                          : `${entry.userName || 'Member'} ${entry.type === 'check-in' ? 'Checked-In for' : 'Checked-Out from'} ${entry.sport || 'Unknown'}`}
                      </p>
                    </div>
                    <span className="text-[10px] text-[#9CA3AF] font-mono shrink-0">
                      {new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Footer note ──────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="text-center text-xs text-[#9CA3AF] mt-6"
      >
        Red Ball Cricket Academy — Super Admin Panel
      </motion.p>
    </div>
  );
}
