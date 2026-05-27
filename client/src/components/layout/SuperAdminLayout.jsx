import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Trophy, CreditCard, Ticket, Menu, X, LogOut, Bell, TimerReset, Settings, MessageSquare, ClipboardList, UtensilsCrossed } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { getInitials } from '../../lib/utils';
import ErrorBoundary from '../shared/ErrorBoundary';
import { useQueryClient } from '@tanstack/react-query';
import socket from '../../lib/socket';

const menuItems = [
  { path: '/super-admin', label: 'Overview', icon: <LayoutDashboard size={18} />, end: true },
  { path: '/super-admin/sports', label: 'Sports', icon: <Trophy size={18} /> },
  { path: '/super-admin/memberships', label: 'Memberships', icon: <CreditCard size={18} /> },
  { path: '/super-admin/session-overtime', label: 'Session Overtime', icon: <TimerReset size={18} /> },
  { path: '/super-admin/one-time', label: 'One-Time Entries', icon: <Ticket size={18} /> },
  { path: '/super-admin/communication', label: 'Communication', icon: <MessageSquare size={18} /> },
  { path: '/super-admin/orders', label: 'Order Management', icon: <ClipboardList size={18} /> },
  { path: '/super-admin/menu', label: 'Menu Items', icon: <UtensilsCrossed size={18} /> },
  { path: '/super-admin/settings', label: 'Settings', icon: <Settings size={18} /> },
];

export default function SuperAdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const qc = useQueryClient();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onRefresh = () => {
      console.log('Super-Admin Real-time refresh triggered!');
      qc.invalidateQueries();
    };
    
    // Listen for global socket events
    socket.on('dashboard:refresh', onRefresh);
    socket.on('payment:success', onRefresh);
    socket.on('attendance:check-in', onRefresh);
    socket.on('attendance:check-out', onRefresh);
    socket.on('membership:updated', onRefresh);
    socket.on('sport:updated', onRefresh);
    
    return () => {
      socket.off('dashboard:refresh', onRefresh);
      socket.off('payment:success', onRefresh);
      socket.off('attendance:check-in', onRefresh);
      socket.off('attendance:check-out', onRefresh);
      socket.off('membership:updated', onRefresh);
      socket.off('sport:updated', onRefresh);
    };
  }, [qc]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <>
      {/* Logo Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-[#EAEAEA] shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Red Ball Academy" className="w-9 h-9 object-contain shrink-0" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#111111] leading-tight">Red Ball</span>
            <span className="text-[10px] font-medium text-[#C8102E] tracking-wider uppercase">Super Admin</span>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#666666] hover:text-[#111111]">
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <p className="text-[10px] font-semibold text-[#AAAAAA] uppercase tracking-wider px-3 mb-3">Management</p>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 text-sm font-medium group
              ${isActive
                ? 'bg-gradient-to-r from-[#C8102E] to-[#8B0B1E] text-white shadow-lg shadow-red-900/20'
                : 'text-[#555555] hover:text-[#111111] hover:bg-[#F5F5F5]'
              }`
            }
          >
            <span className="shrink-0 text-current transition-transform duration-200 group-hover:scale-110">{item.icon}</span>
            <span className="whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-[#EAEAEA] p-4 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          {user?.photo ? (
            <img src={user.photo} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-[#EAEAEA] shrink-0 shadow-md" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C8102E] to-[#8B0B1E] flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md">
              {getInitials(user?.name)}
            </div>
          )}
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold text-[#111111] truncate">{user?.name}</p>
            <p className="text-[11px] text-[#999999] truncate capitalize">{user?.role?.replace('superadmin', 'Super Admin')}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#666666] hover:text-[#C8102E] hover:bg-red-50 transition-all duration-200 border border-[#EAEAEA] hover:border-[#C8102E]/20"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-[#EAEAEA] z-40 flex-col overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-[#EAEAEA] z-50 flex flex-col lg:hidden shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 lg:ml-[260px]">
        {/* Top Navbar */}
        <header className="h-14 border-b border-[#EAEAEA] bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg bg-[#F0F0F0] border border-[#EAEAEA] flex items-center justify-center text-[#666666] hover:text-[#111111] transition-colors"
            >
              <Menu size={18} />
            </button>
            <h1 className="text-base font-semibold text-[#111111]" style={{ fontFamily: "'Inter', sans-serif" }}>
              {menuItems.find(m => location.pathname === m.path || (!m.end && location.pathname.startsWith(m.path)))?.label || 'Super Admin'}
            </h1>
          </div>
          <div className="flex items-center gap-2">

            {user?.photo ? (
              <img src={user.photo} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-[#EAEAEA]" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C8102E] to-[#8B0B1E] flex items-center justify-center text-white text-xs font-bold">
                {getInitials(user?.name)}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <ErrorBoundary>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
