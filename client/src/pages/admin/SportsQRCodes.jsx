import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/axios';
import { toast } from 'sonner';

export default function SportsQRCodes() {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      const res = await api.get('/sports');
      setSports(res.data.sports?.filter(s => s.active && !s.deletedAt) || []);
    } catch {
      toast.error('Failed to load sports');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = (sport) => {
    if (!sport.qrCodeDataUrl) {
      toast.error('QR code not available for this sport');
      return;
    }
    const link = document.createElement('a');
    link.href = sport.qrCodeDataUrl;
    link.download = `${sport.name.replace(/\s+/g, '_')}_QR.png`;
    link.click();
    toast.success(`Downloaded ${sport.name} QR code`);
  };

  const printAll = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #eee', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111', marginBottom: '4px' }}>Sports QR Codes</h1>
          <p style={{ fontSize: '13px', color: '#888' }}>Print or download QR codes for each sport. Members scan these at the entrance.</p>
        </div>
        <button
          onClick={printAll}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '10px',
            background: '#111', color: '#fff', border: 'none',
            fontSize: '13px', fontWeight: '700', cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.target.style.background = '#333'}
          onMouseLeave={e => e.target.style.background = '#111'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
          </svg>
          Print All
        </button>
      </div>

      {sports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: '14px' }}>
          No active sports found. Add sports from the Super Admin panel.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {sports.map((sport, idx) => (
            <motion.div
              key={sport._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              style={{
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #eee',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'}
            >
              {/* QR Code Display */}
              <div style={{ padding: '24px', textAlign: 'center', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                {sport.qrCodeDataUrl ? (
                  <img
                    src={sport.qrCodeDataUrl}
                    alt={`${sport.name} QR Code`}
                    style={{ width: '200px', height: '200px', margin: '0 auto', borderRadius: '8px' }}
                  />
                ) : (
                  <div style={{ width: '200px', height: '200px', margin: '0 auto', background: '#eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '12px' }}>
                    QR Unavailable
                  </div>
                )}
              </div>

              {/* Sport Info */}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#111', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  {sport.name}
                </div>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '12px' }}>
                  {sport.hourlyPrice ? `₹${sport.hourlyPrice}/hr` : '—'}
                  {sport.dayPrice ? ` · ₹${sport.dayPrice}/day` : ''}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => downloadQR(sport)}
                    style={{
                      flex: 1, padding: '10px',
                      borderRadius: '10px', border: '1px solid #eee',
                      background: '#fff', fontSize: '12px',
                      fontWeight: '700', color: '#111',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.target.style.borderColor = '#C8102E'; e.target.style.color = '#C8102E'; }}
                    onMouseLeave={e => { e.target.style.borderColor = '#eee'; e.target.style.color = '#111'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
