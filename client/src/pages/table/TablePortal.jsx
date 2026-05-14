import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/axios';
import { QrCode, Camera, ArrowRight, Sparkles, AlertCircle, Utensils } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function TablePortal() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);

  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ 
    queryKey: ['tables-public-list'], 
    queryFn: () => api.get('/tables/public-list').then(r => r.data) 
  });

  const tables = data?.tables || [];

  useEffect(() => {
    import('../../lib/socket').then(({ default: socket, connectSocket }) => {
      connectSocket();
      const refresh = () => qc.invalidateQueries({ queryKey: ['tables-public-list'] });
      socket.on('tables:updated', refresh);
      return () => {
        socket.off('tables:updated', refresh);
      };
    });
  }, [qc]);

  const handleSimulatedScan = (tableId) => {
    setScanning(true);
    setTimeout(() => {
      navigate(`/table/${tableId}`);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col justify-between p-6 md:p-12 relative overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Background Lighting decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C8102E]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#F5A623]/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between z-10 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#C8102E] text-white rounded-2xl flex items-center justify-center font-black text-xl tracking-tighter shadow-lg">
            RB
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-wide leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              RED BALL ACADEMY
            </h1>
            <p className="text-xs text-[#F5A623] font-bold tracking-widest uppercase mt-0.5">
              Digital Café Portal
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/')} className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold transition-all">
          ← Back Home
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-12 items-center z-10 grow my-auto py-8">
        
        {/* Left Col: Scanner UI */}
        <div className="md:col-span-6 bg-[#161616] rounded-3xl p-8 border border-white/10 shadow-2xl relative text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-[#C8102E]/20 text-[#C8102E] rounded-full flex items-center justify-center mb-6">
            <Camera size={28} />
          </div>

          <h2 className="text-2xl font-black mb-2 tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            SCAN TABLE QR CODE
          </h2>
          <p className="text-[#9CA3AF] text-xs max-w-xs mb-8 leading-relaxed">
            Allow camera access to automatically scan the physical QR code sticker placed on your table.
          </p>

          {/* Real Camera Scanner Box */}
          <div className="relative w-64 h-64 bg-black rounded-3xl border-2 border-[#F5A623]/50 flex items-center justify-center overflow-hidden shadow-inner mb-6">
            {!scanning ? (
              <Scanner 
                onScan={(result) => {
                  const val = Array.isArray(result) ? result[0]?.rawValue : result;
                  if (val) {
                    const match = val.match(/\/table\/([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                      handleSimulatedScan(match[1]);
                    } else if (val.length === 24) {
                      handleSimulatedScan(val);
                    }
                  }
                }}
                onError={(err) => console.log('Scanner error:', err)}
                components={{ audio: false, finder: false }}
                styles={{ container: { width: '100%', height: '100%' } }}
              />
            ) : (
              <div className="absolute inset-0 bg-[#C8102E]/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-black uppercase tracking-widest">Connecting Table...</span>
              </div>
            )}
            
            <div className="absolute inset-0 pointer-events-none border-[16px] border-[#161616]/40 z-10" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <QrCode size={120} className="text-white/10" />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#F5A623]/10 border border-[#F5A623]/30 px-4 py-2 rounded-xl text-[#F5A623] text-[11px] font-bold">
            <Sparkles size={14} />
            <span>Instant Access • No App Required</span>
          </div>
        </div>

        {/* Right Col: Quick Access 1-Click Table List */}
        <div className="md:col-span-6 space-y-6">
          <div>
            <h3 className="text-3xl font-black tracking-wide text-white mb-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              DEMO / DIRECT TABLE SELECTION
            </h3>
            <p className="text-[#9CA3AF] text-sm">
              Don't have a physical QR code right now? Select any active table below to test the ordering portal instantly:
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-3 text-gray-400 py-8">
              <div className="w-5 h-5 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading active tables...</span>
            </div>
          ) : tables.length === 0 ? (
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-gray-400 text-xs">
              <AlertCircle className="mb-2 text-[#F5A623]" size={24} />
              No active tables found. Please ask restaurant management to register tables in the admin panel.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {tables.map((table) => (
                <button
                  key={table._id}
                  onClick={() => handleSimulatedScan(table._id)}
                  disabled={scanning}
                  className="bg-[#1A1A1A] hover:bg-[#C8102E] border border-white/10 hover:border-transparent rounded-2xl p-4 text-left transition-all duration-200 group hover:scale-105 shadow-md flex flex-col justify-between h-full min-h-[7rem]"
                >
                  <div>
                    <span className="text-[10px] text-[#F5A623] font-extrabold uppercase tracking-widest group-hover:text-white/80 block mb-1 font-mono">
                      {table.section || 'Indoor'}
                    </span>
                    <h4 className="font-extrabold text-base text-white leading-tight">
                      {table.label}
                    </h4>
                    <p className="text-[11px] text-gray-400 group-hover:text-white/70 mt-1">
                      Cap: {table.capacity}p
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 group-hover:border-white/20">
                    <Utensils size={14} className="text-gray-500 group-hover:text-white" />
                    <ArrowRight size={14} className="text-[#F5A623] group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Footer info */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-gray-600 border-t border-white/5 pt-6 z-10">
        Red Ball Cricket Academy © {new Date().getFullYear()} • Secure Digital Table Ordering System
      </footer>
    </div>
  );
}
