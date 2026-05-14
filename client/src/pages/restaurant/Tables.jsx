import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import { toast } from 'sonner';
import { QrCode, Plus, Check, Power, Download, X } from 'lucide-react';

export default function Tables() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ tableNumber: '', label: '', section: 'Indoor', capacity: 4 });
  const [qrModal, setQrModal] = useState(null);

  const { data } = useQuery({ 
    queryKey: ['tables'], 
    queryFn: () => api.get('/tables').then(r => r.data) 
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/tables', d),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['tables'] }); 
      setModalOpen(false); 
      setForm({ tableNumber: '', label: '', section: 'Indoor', capacity: 4 });
      toast.success('Table created successfully!'); 
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create table')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }) => api.put(`/tables/${id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table status updated!');
    }
  });

  const qrMutation = useMutation({
    mutationFn: (id) => api.get(`/tables/${id}/qr`),
    onSuccess: (res) => {
      setQrModal(res.data);
      qc.invalidateQueries({ queryKey: ['tables'] });
    },
    onError: () => toast.error('Failed to generate QR code')
  });

  useEffect(() => {
    import('../../lib/socket').then(({ default: socket, connectSocket }) => {
      connectSocket();
      const refresh = () => qc.invalidateQueries({ queryKey: ['tables'] });
      socket.on('tables:updated', refresh);
      socket.on('dashboard:refresh', refresh);
      return () => {
        socket.off('tables:updated', refresh);
        socket.off('dashboard:refresh', refresh);
      };
    });
  }, [qc]);

  const tables = data?.tables || [];

  return (
    <div className="pb-24">
      <PageHeader 
        title="Restaurant Tables & QR Management" 
        subtitle={`Total Tables: ${tables.length} • Active: ${tables.filter(t => t.isActive).length}`} 
        action={
          <button 
            className="px-6 py-3 bg-[#C8102E] hover:bg-[#A00D24] text-white font-extrabold rounded-2xl flex items-center gap-2 shadow-lg transition-all hover:scale-105" 
            onClick={() => setModalOpen(true)}
          >
            <Plus size={20} />
            <span>Add New Table</span>
          </button>
        } 
      />

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
        {tables.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            No tables configured. Click "Add New Table" above to create one.
          </div>
        )}

        {tables.map((table, i) => (
          <motion.div 
            key={table._id} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.04 }}
            className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md ${
              !table.isActive ? 'border-gray-200 bg-gray-50/50 grayscale' : 'border-gray-100'
            }`}
          >
            <div>
              {/* Header Bar */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-black text-[#111111]">{table.label}</h3>
                  <span className="text-xs text-[#666] font-mono">Table #{table.tableNumber}</span>
                </div>
                <button
                  onClick={() => updateMutation.mutate({ id: table._id, d: { isActive: !table.isActive } })}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm transition-all ${
                    table.isActive 
                      ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' 
                      : 'bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-700'
                  }`}
                  title={table.isActive ? 'Click to Deactivate' : 'Click to Activate'}
                >
                  <Power size={12} />
                  <span>{table.isActive ? 'Active' : 'Inactive'}</span>
                </button>
              </div>

              {/* Specs */}
              <div className="space-y-1.5 text-xs text-[#4B5563] mb-6 bg-[#F9FAFB] p-3 rounded-2xl border border-gray-100">
                <div className="flex justify-between">
                  <span>Section Area</span>
                  <span className="font-extrabold text-[#111]">{table.section}</span>
                </div>
                <div className="flex justify-between">
                  <span>Seating Capacity</span>
                  <span className="font-extrabold text-[#111]">{table.capacity} Persons</span>
                </div>
              </div>

              {/* QR Preview / Placeholder */}
              <div className="mb-6 flex flex-col items-center">
                {table.qrCode ? (
                  <div className="p-2 bg-white rounded-2xl border border-gray-200 shadow-sm mb-2">
                    <img src={table.qrCode} alt="Table QR" className="w-32 h-32 object-contain" />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-gray-100 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 mb-2">
                    <QrCode size={36} className="mb-1 opacity-50" />
                    <span className="text-[10px] uppercase font-bold">No QR Generated</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button 
                onClick={() => qrMutation.mutate(table._id)} 
                disabled={qrMutation.isPending}
                className="w-full py-3 bg-[#0D0D0D] hover:bg-[#161616] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                <QrCode size={16} className="text-[#F5A623]" />
                <span>{table.qrCode ? 'Regenerate QR Code' : 'Generate QR Code'}</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Table Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
              onClick={() => setModalOpen(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                  <h2 className="text-xl font-extrabold text-[#111111]">Register New Table</h2>
                  <button onClick={() => setModalOpen(false)} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Table Number / Code
                    </label>
                    <input 
                      placeholder="e.g. TBL-01" 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#C8102E]" 
                      value={form.tableNumber} 
                      onChange={e => setForm({...form, tableNumber: e.target.value})} 
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Friendly Display Label
                    </label>
                    <input 
                      placeholder="e.g. Premium Table 1" 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#C8102E]" 
                      value={form.label} 
                      onChange={e => setForm({...form, label: e.target.value})} 
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Seating Section
                    </label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#C8102E]" 
                      value={form.section} 
                      onChange={e => setForm({...form, section: e.target.value})}
                    >
                      <option value="Indoor">Indoor Lounge</option>
                      <option value="Outdoor">Outdoor Patio</option>
                      <option value="VIP">VIP Suite</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Seating Capacity (Persons)
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#C8102E]" 
                      value={form.capacity} 
                      onChange={e => setForm({...form, capacity: e.target.value})} 
                      required 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    className="w-full py-4 rounded-xl bg-[#C8102E] text-white hover:bg-[#A00D24] font-extrabold text-base shadow-lg transition-all"
                  >
                    {createMutation.isPending ? 'Creating Table...' : 'Create Table'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* QR Code Download Modal */}
      <AnimatePresence>
        {qrModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
              onClick={() => setQrModal(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={24} />
                </div>
                <h2 className="text-xl font-black text-[#111111] mb-2">QR Code Ready!</h2>
                <p className="text-xs text-gray-500 mb-6">Print or stick this QR code on the designated table.</p>
                
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 inline-block mb-6 shadow-inner">
                  <img src={qrModal.qrCode} alt="Generated QR" className="w-56 h-56 object-contain mx-auto" />
                </div>

                <div className="flex gap-3">
                  <a 
                    href={qrModal.qrCode} 
                    download={`table-qr-${qrModal.tableId}.png`} 
                    className="flex-1 py-3.5 bg-[#C8102E] text-white hover:bg-[#A00D24] font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Download size={16} />
                    <span>Download PNG</span>
                  </a>
                  <button 
                    onClick={() => setQrModal(null)} 
                    className="px-5 py-3.5 bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold text-xs rounded-xl transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
