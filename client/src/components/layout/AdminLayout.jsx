import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, GraduationCap, CreditCard, Activity, IndianRupee, Utensils, Package, TrendingUp, Users, Settings, Menu, Search, Bell, X, LogOut, ChevronLeft } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import { getInitials } from '../../lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import socket from '../../lib/socket';
import ErrorBoundary from '../shared/ErrorBoundary';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { path: '/admin/admissions', label: 'Admissions', icon: <GraduationCap size={18} /> },
  { path: '/admin/memberships', label: 'Student Memberships', icon: <CreditCard size={18} /> },
  { path: '/admin/plans', label: 'Membership Plans', icon: <Activity size={18} /> },
  { path: '/admin/one-time-play', label: 'One-Time Play', icon: <Activity size={18} /> },
  { path: '/admin/payments', label: 'Payments & GST', icon: <IndianRupee size={18} /> },
  { path: '/admin/restaurant', label: 'Restaurant', icon: <Utensils size={18} /> },
  { path: '/admin/inventory', label: 'Inventory', icon: <Package size={18} /> },
  { path: '/admin/analytics', label: 'Analytics', icon: <TrendingUp size={18} /> },
  { path: '/admin/users', label: 'Users & Roles', icon: <Users size={18} /> },
  { path: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
];

export default function AdminLayout() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const qc = useQueryClient();
  useEffect(() => {
    const onRefresh = () => {
      console.log('🔄 Socket: Refreshing dashboard queries');
      qc.invalidateQueries({ queryKey: ['admissions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
    };
    socket.on('dashboard:refresh', onRefresh);
    socket.on('payment:success', onRefresh);
    socket.on('admission:new', onRefresh);
    
    return () => {
      socket.off('dashboard:refresh', onRefresh);
      socket.off('payment:success', onRefresh);
      socket.off('admission:new', onRefresh);
    };
  }, [qc]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#EAEAEA] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center text-white font-bold text-sm shrink-0">
            RB
          </div>
          <span className="text-sm font-semibold text-[#111111] whitespace-nowrap">
            Red Ball Academy
          </span>
        </div>
        {/* Mobile close */}
        <button onClick={() => setMobileOpen(false)} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#666666] hover:text-[#111111]">
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all text-sm
              ${isActive
                ? 'bg-black text-white shadow-md'
                : 'text-[#666666] hover:text-[#111111] hover:bg-[#F0F0F0]'
              }`
            }
          >
            <span className="shrink-0 text-current">{item.icon}</span>
            <span className="whitespace-nowrap">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-[#EAEAEA] p-3 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-xs font-bold text-white shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-[#111111] truncate">{user?.name}</p>
            <p className="text-xs text-[#888888] truncate">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full btn-ghost text-xs gap-2">
          <LogOut size={14} /> Logout
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
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search..."
                className="input-field w-48 lg:w-64 pl-9"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]"><Search size={16} /></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg bg-[#F0F0F0] border border-[#EAEAEA] flex items-center justify-center text-[#666666] hover:text-[#111111] relative">
              <Bell size={18} />
            </button>
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold"
              >
                {getInitials(user?.name)}
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 w-48 card p-2 z-50 shadow-lg">
                  <button className="w-full text-left px-3 py-2 text-sm text-[#666666] hover:text-[#111111] hover:bg-[#F0F0F0] rounded-lg">
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-[#666666] hover:text-[#111111] hover:bg-[#F0F0F0] rounded-lg"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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
