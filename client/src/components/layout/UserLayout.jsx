import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, CreditCard, Calendar, Utensils, ClipboardList, User, Menu, X, LogOut, Star, ScanLine, History, Globe } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { getInitials } from '../../lib/utils';
import ErrorBoundary from '../shared/ErrorBoundary';
import { useQueryClient } from '@tanstack/react-query';
import socket from '../../lib/socket';

const menuItems = [
  { path: '/user', label: 'Dashboard', icon: <Home size={18} />, end: true },
  { path: '/user/scan', label: 'Scan QR Entry', icon: <ScanLine size={18} /> },
  { path: '/user/membership', label: 'Membership', icon: <CreditCard size={18} /> },
  { path: '/user/book-slots', label: 'Book Slots', icon: <Calendar size={18} /> },
  { path: '/user/table-portal', label: 'Order Food', icon: <Utensils size={18} /> },
  { path: '/user/orders', label: 'Order History', icon: <ClipboardList size={18} /> },
  { path: '/user/reviews', label: 'Reviews', icon: <Star size={18} /> },
  { path: '/user/profile', label: 'Profile', icon: <User size={18} /> },
  { path: '/', label: 'Back to Website', icon: <Globe size={18} /> },
];

const mobileNavItems = [
  { path: '/user', label: 'Home', Icon: Home, match: (path) => path === '/user' || path === '/user/dashboard' },
  { path: '/user/book-slots', label: 'Bookings', Icon: Calendar, match: (path) => path === '/user/book-slots' || path === '/user/one-time-booking' },
  { path: '/user/table-portal', label: 'Order Food', Icon: Utensils, match: (path) => path === '/user/table-portal' },
  { isAction: true, action: 'openMenu', label: 'Menu', Icon: Menu, match: () => false },
];

export default function UserLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const qc = useQueryClient();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const onRefresh = () => {
      console.log('Real-time refresh triggered!');
      qc.invalidateQueries();
    };
    
    // Listen for global and user-specific socket events
    socket.on('dashboard:refresh', onRefresh);
    socket.on('payment:success', onRefresh);
    socket.on('order:updated', onRefresh);
    socket.on('attendance:check-in', onRefresh);
    socket.on('attendance:check-out', onRefresh);
    
    return () => {
      socket.off('dashboard:refresh', onRefresh);
      socket.off('payment:success', onRefresh);
      socket.off('order:updated', onRefresh);
      socket.off('attendance:check-in', onRefresh);
      socket.off('attendance:check-out', onRefresh);
    };
  }, [qc, user?.id]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#df1526] to-[#C8102E] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-red-950/30">RB</div>
          <span className="text-sm font-semibold text-white">Red Ball Academy</span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-white/60"><X size={18} /></button>
      </div>
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-semibold transition-all
              ${isActive ? 'bg-[#C8102E] text-white shadow-lg shadow-red-950/20' : 'text-white/58 hover:text-white hover:bg-white/7'}`
            }
          >
            <span className="shrink-0 text-current">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          {user?.photo ? (
            <img src={user.photo} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">{getInitials(user?.name)}</div>
          )}
          <div className="overflow-hidden"><p className="text-sm font-medium text-white truncate">{user?.name}</p><p className="text-xs text-white/40">{user?.role}</p></div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all"><LogOut size={14} /> Logout</button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0A0D0D] flex overflow-x-hidden">
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[#0E1212] border-r border-white/10 z-40 flex-col">{sidebarContent}</aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-[280px] bg-[#0E1212] border-r border-white/10 z-50 flex flex-col lg:hidden shadow-2xl">{sidebarContent}</motion.aside>
          </>
        )}
      </AnimatePresence>
      <div className="flex-1 min-w-0 lg:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#0A0D0D]/88 px-4 backdrop-blur-xl lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/76">
            <Menu size={20} />
          </button>
          <Link to="/" className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#df1526]">Red Ball</p>
            <p className="text-sm font-black text-white">Academy</p>
          </Link>
          <Link to="/user/scan" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#C8102E] text-white shadow-lg shadow-red-950/30">
            <ScanLine size={20} />
          </Link>
        </header>
        <main className="w-full max-w-[1600px] p-4 pb-28 sm:p-5 sm:pb-28 lg:p-6 lg:pb-6">
          <ErrorBoundary>
            <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <Outlet />
            </motion.div>
          </ErrorBoundary>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1a1a1a] bg-[#0A0D0D] px-3 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-12px_35px_rgba(0,0,0,0.18)] lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {mobileNavItems.map(({ path, label, Icon, match, isAction, action }) => {
            const active = match ? match(location.pathname) : false;
            
            if (isAction && action === 'openMenu') {
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl transition active:scale-95 ${
                    mobileOpen ? 'text-[#C8102E]' : 'text-[#8A8A8A]'
                  }`}
                >
                  <Icon size={mobileOpen ? 22 : 20} strokeWidth={mobileOpen ? 2.8 : 2.4} fill="none" />
                  <span className="text-[11px] font-semibold leading-none">{label}</span>
                </button>
              );
            }

            return (
              <Link
                key={path}
                to={path}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl transition active:scale-95 ${
                  active ? 'text-[#C8102E]' : 'text-[#8A8A8A]'
                }`}
              >
                <Icon size={active ? 22 : 20} strokeWidth={active ? 2.8 : 2.4} fill={active && label === 'Home' ? 'currentColor' : 'none'} />
                <span className="text-[11px] font-semibold leading-none">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
