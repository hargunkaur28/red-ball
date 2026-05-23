import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ClipboardList, Utensils, Package, Grid, Menu, X, LogOut, Settings } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { getInitials } from '../../lib/utils';
import ErrorBoundary from '../shared/ErrorBoundary';
import MobileNavbar from './MobileNavbar';
import { useQueryClient } from '@tanstack/react-query';
import socket from '../../lib/socket';

const menuItems = [
  { path: '/restaurant', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
  { path: '/restaurant/orders', label: 'Live Orders', icon: <ClipboardList size={18} /> },
  { path: '/restaurant/history', label: 'Order History', icon: <Package size={18} /> },
  { path: '/restaurant/menu', label: 'Menu', icon: <Utensils size={18} /> },
  { path: '/restaurant/tables', label: 'Tables & QR', icon: <Grid size={18} /> },
  { path: '/restaurant/settings', label: 'Settings', icon: <Settings size={18} /> },
];

export default function RestaurantLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const qc = useQueryClient();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onRefresh = () => {
      console.log('Restaurant Real-time refresh triggered!');
      qc.invalidateQueries();
    };
    
    // Listen for global and restaurant specific socket events
    socket.emit('join-managers');
    socket.on('dashboard:refresh', onRefresh);
    socket.on('order:new', onRefresh);
    socket.on('order:updated', onRefresh);
    socket.on('order:cancelled', onRefresh);
    socket.on('menu:updated', onRefresh);
    
    return () => {
      socket.off('dashboard:refresh', onRefresh);
      socket.off('order:new', onRefresh);
      socket.off('order:updated', onRefresh);
      socket.off('order:cancelled', onRefresh);
      socket.off('menu:updated', onRefresh);
    };
  }, [qc]);
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 h-16 border-b border-[#EAEAEA] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center text-white font-bold text-sm">RB</div>
          <span className="text-sm font-semibold text-[#111111]">Restaurant Panel</span>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#666666]"><X size={18} /></button>
      </div>
      <nav className="flex-1 py-3 px-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all
              ${isActive ? 'bg-black text-white shadow-md' : 'text-[#666666] hover:text-[#111111] hover:bg-[#F0F0F0]'}`
            }
          >
            <span className="shrink-0 text-current">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-[#EAEAEA] p-3 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          {user?.photo ? (
            <img src={user.photo} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-black/10 shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-xs font-bold text-white shrink-0">{getInitials(user?.name)}</div>
          )}
          <div className="overflow-hidden"><p className="text-sm font-medium text-[#111111] truncate">{user?.name}</p><p className="text-xs text-[#888888]">Manager</p></div>
        </div>
        <button onClick={handleLogout} className="w-full btn-ghost text-xs gap-2"><LogOut size={14} /> Logout</button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex">
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-white border-r border-[#EAEAEA] z-40 flex-col">{sidebarContent}</aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-[#EAEAEA] z-50 flex flex-col lg:hidden shadow-2xl">{sidebarContent}</motion.aside>
          </>
        )}
      </AnimatePresence>
      <div className="flex-1 lg:ml-64">
        <header className="h-16 border-b border-black/5 bg-white/90 backdrop-blur-md sticky top-0 z-30 flex items-center px-4 lg:hidden shadow-sm">
          <button 
            onClick={() => setMobileOpen(true)} 
            className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
          >
            <Menu size={20} />
          </button>
          <div className="ml-4">
            <h1 className="text-sm font-black text-[#111111] tracking-tight uppercase leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Red Ball Sports Café
            </h1>
            <p className="text-[10px] font-bold text-[#C8102E] uppercase tracking-widest mt-0.5">
              Management Portal
            </p>
          </div>
        </header>
        <main className="p-4 lg:p-6">
          <ErrorBoundary>
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Outlet />
            </motion.div>
          </ErrorBoundary>
        </main>
      </div>
      <MobileNavbar />
    </div>
  );
}
