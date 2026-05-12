import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import { toast } from 'sonner';

export default function Tables() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ tableNumber: '', label: '', section: 'Indoor', capacity: 4 });
  const [qrModal, setQrModal] = useState(null);
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ['tables'], queryFn: () => api.get('/tables').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/tables', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tables'] }); setModalOpen(false); toast.success('Table created!'); },
  });

  const qrMutation = useMutation({
    mutationFn: (id) => api.get(`/tables/${id}/qr`),
    onSuccess: (res) => setQrModal(res.data),
  });

  return (
    <div>
      <PageHeader title="Tables & QR" subtitle="Manage restaurant tables and QR codes" action={<button className="btn-primary" onClick={() => setModalOpen(true)}>+ Add Table</button>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(data?.tables || []).map((table, i) => (
          <motion.div key={table._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#111111] font-semibold">{table.label}</h3>
              <span className={`badge ${table.isActive ? 'badge-success' : 'badge-danger'}`}>{table.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="space-y-1 text-sm text-[#666666] mb-4">
              <p>Section: {table.section}</p>
              <p>Capacity: {table.capacity}</p>
              <p>Table #{table.tableNumber}</p>
            </div>
            {table.qrCode && <img src={table.qrCode} alt="QR" className="w-24 h-24 rounded-lg mx-auto mb-3 bg-white p-1" />}
            <button onClick={() => qrMutation.mutate(table._id)} className="btn-primary w-full text-xs">Generate QR</button>
          </motion.div>
        ))}
      </div>

      {/* Add Table Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md card">
                <h2 className="text-lg font-semibold text-[#111111] mb-4">Add Table</h2>
                <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-3">
                  <div><label className="block text-sm text-[#666666] mb-1">Table Number</label><input className="input-field" value={form.tableNumber} onChange={e => setForm({...form, tableNumber: e.target.value})} required /></div>
                  <div><label className="block text-sm text-[#666666] mb-1">Label</label><input className="input-field" value={form.label} onChange={e => setForm({...form, label: e.target.value})} required /></div>
                  <div><label className="block text-sm text-[#666666] mb-1">Section</label>
                    <select className="input-field" value={form.section} onChange={e => setForm({...form, section: e.target.value})}>
                      <option value="Indoor">Indoor</option><option value="Outdoor">Outdoor</option><option value="VIP">VIP</option>
                    </select>
                  </div>
                  <div><label className="block text-sm text-[#666666] mb-1">Capacity</label><input type="number" className="input-field" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} /></div>
                  <button type="submit" className="btn-primary w-full">Create Table</button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* QR Modal */}
      <AnimatePresence>
        {qrModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setQrModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="card text-center max-w-sm">
                <h2 className="text-lg font-semibold text-[#111111] mb-4">QR Code Generated!</h2>
                <img src={qrModal.qrCode} alt="QR Code" className="w-48 h-48 mx-auto bg-white p-2 rounded-xl mb-4" />
                <p className="text-sm text-[#666666] mb-4">Scan to order from this table</p>
                <a href={qrModal.qrCode} download="table-qr.png" className="btn-primary">Download QR</a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
