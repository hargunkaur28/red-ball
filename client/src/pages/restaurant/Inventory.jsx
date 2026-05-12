import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import { toast } from 'sonner';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Inventory() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', unit: 'kg', currentStock: 0, minimumStock: 0 });

  const { data } = useQuery({ queryKey: ['inventory'], queryFn: () => api.get('/inventory').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/inventory', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setModalOpen(false);
      setForm({ name: '', unit: 'kg', currentStock: 0, minimumStock: 0 });
      toast.success('Item added to inventory!');
    },
    onError: (err) => toast.error('Failed to add item')
  });

  const getStockStatus = (item) => {
    if (item.currentStock === 0) return { label: 'Out of Stock', class: 'badge-danger' };
    if (item.currentStock <= item.minimumStock) return { label: 'Critical', class: 'badge-danger' };
    if (item.currentStock <= item.minimumStock * 2) return { label: 'Low Stock', class: 'badge-warning' };
    return { label: 'In Stock', class: 'badge-success' };
  };

  const columns = [
    { key: 'name', label: 'Item', sortable: true, render: r => <span className="text-[#111111] font-medium">{r.name}</span> },
    { key: 'unit', label: 'Unit', render: r => <span className="text-[#666666]">{r.unit}</span> },
    { key: 'currentStock', label: 'Stock', sortable: true, render: r => <span className="text-[#111111]">{r.currentStock}</span> },
    { key: 'minimumStock', label: 'Min', render: r => <span className="text-[#888888]">{r.minimumStock}</span> },
    { key: 'status', label: 'Status', render: r => { const s = getStockStatus(r); return <span className={`badge ${s.class}`}>{s.label}</span>; } },
    { key: 'actions', label: '', render: r => <button className="btn-ghost text-xs">Restock</button> },
  ];

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Track stock levels" action={<button onClick={() => setModalOpen(true)} className="btn-primary">+ Add Item</button>} />
      <DataTable columns={columns} data={data?.items || []} />

      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#111111]">Add Inventory Item</h2>
                  <button onClick={() => setModalOpen(false)} className="text-[#888888] hover:text-[#111111]">✕</button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#666666] mb-1">Item Name</label>
                    <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Tomato, Coffee Beans" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#666666] mb-1">Unit</label>
                    <select className="input-field bg-white" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                      <option value="kg">kg</option>
                      <option value="liter">liter</option>
                      <option value="piece">piece</option>
                      <option value="box">box</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Current Stock</label>
                      <input type="number" min="0" step="0.1" className="input-field" value={form.currentStock} onChange={e => setForm({...form, currentStock: parseFloat(e.target.value) || 0})} required />
                    </div>
                    <div>
                      <label className="block text-sm text-[#666666] mb-1">Minimum Stock</label>
                      <input type="number" min="0" step="0.1" className="input-field" value={form.minimumStock} onChange={e => setForm({...form, minimumStock: parseFloat(e.target.value) || 0})} required />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={createMutation.isPending}>Save Item</button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
