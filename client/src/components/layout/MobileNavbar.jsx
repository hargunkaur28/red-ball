import { NavLink } from 'react-router-dom';
import { ClipboardList, Grid, History, LayoutGrid, Utensils } from 'lucide-react';

export default function MobileNavbar() {
  const tabs = [
    { path: '/restaurant', label: 'Dashboard', icon: <LayoutGrid size={24} />, end: true },
    { path: '/restaurant/orders', label: 'Orders', icon: <ClipboardList size={24} /> },
    { path: '/restaurant/history', label: 'History', icon: <History size={24} /> },
    { path: '/restaurant/menu', label: 'Menu', icon: <Utensils size={24} /> },
    { path: '/restaurant/tables', label: 'Tables', icon: <Grid size={24} /> },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 px-6 py-3 z-50 flex items-center justify-between pb-safe">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.end}
          className={({ isActive }) => 
            `flex flex-col items-center gap-1 transition-all ${
              isActive ? 'text-[#C8102E] scale-110' : 'text-gray-400'
            }`
          }
        >
          {tab.icon}
          <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
        </NavLink>
      ))}
    </div>
  );
}
