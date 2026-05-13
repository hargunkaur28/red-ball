import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import { toast } from 'sonner';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Package } from 'lucide-react';

export default function Inventory() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState(0);
  const [form, setForm] = useState({ name: '', unit: 'kg', quantity: 0, threshold: 10, costPerUnit: 0, category: 'General' });

  const { data } = useQuery({ queryKey: ['inventory'], queryFn: () => api.get('/inventory').then(r => r.data) });
  const { data: lowStock } = useQuery({ queryKey: ['inventory', 'low-stock'], queryFn: () => api.get('/inventory/low-stock').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/inventory', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setModalOpen(false);
      setForm({ name: '', unit: 'kg', quantity: 0, threshold: 10, costPerUnit: 0, category: 'General' });
      toast.success('Item added!');
    },
    onError: () => toast.error('Failed to add item'),
  });

  const restockMutation = useMutation({
    mutationFn: ({ id, addQuantity }) => api.put(`/inventory/${id}/restock`, { addQuantity }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setRestockModal(null);
      setRestockQty(0);
      toast.success('Restocked!');
    },
  });

  const getStockStatus = (item) => {
    if (item.quantity === 0) return { label: 'Out of Stock', class: 'bg-red-50 text-red-700' };
    if (item.quantity <= item.threshold) return { label: 'Low Stock', class: 'bg-amber-50 text-amber-700' };
    return { label: 'In Stock', class: 'bg-green-50 text-green-700' };
  };

  const columns = [
    { key: 'name', label: 'Item', sortable: true, render: r => (
      <div className="flex items-center gap-2">
        <Package size={16} className="text-[#888]" />
        <span className="text-[#111] font-medium">{r.name}</span>
      </div>
    )},
    { key: 'category', label: 'Category', render: r => <span className="text-xs text-[#888] bg-[#F7F7F7] px-2 py-0.5 rounded-full">{r.category || 'General'}</span> },
    { key: 'quantity', label: 'Stock', sortable: true, render: r => <span className="text-[#111] font-semibold">{r.quantity} {r.unit}</span> },
    { key: 'threshold', label: 'Min Level', render: r => <span className="text-[#888]">{r.threshold} {r.unit}</span> },
    { key: 'status', label: 'Status', render: r => { const s = getStockStatus(r); return <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.class}`}>{s.label}</span>; } },
    { key: 'actions', label: '', render: r => (
      <button
        onClick={() => { setRestockModal(r); setRestockQty(0); }}
        className="btn-ghost text-xs text-green-700 hover:bg-green-50"
      >
        + Restock
      </button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Inventory" subtitle={`${data?.items?.length || 0} items tracked`}
        action={<button onClick={() => setModalOpen(true)} className="btn-primary">+ Add Item</button>}
      />

      {/* Low stock alert */}
      {lowStock?.count > 0 && (
        <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600" />
          <span className="text-sm text-amber-800 font-medium">{lowStock.count} item(s) are low or out of stock</span>
        </div>
      )}

      <DataTable columns={columns} data={data?.items || []} />

      {/* Add Item Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#111]">Add Inventory Item</h2>
                  <button onClick={() => setModalOpen(false)} className="text-[#888] hover:text-[#111]">✕</button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
                  <div><label className="block text-sm text-[#666] mb-1">Item Name</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Tomato, Coffee Beans" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-[#666] mb-1">Unit</label>
                      <select className="input-field bg-white" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                        <option value="kg">kg</option><option value="litre">litre</option><option value="pieces">pieces</option>
                        <option value="packs">packs</option><option value="grams">grams</option><option value="ml">ml</option>
                      </select>
                    </div>
                    <div><label className="block text-sm text-[#666] mb-1">Category</label><input className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Dairy" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><label className="block text-sm text-[#666] mb-1">Current Stock</label><input type="number" min="0" step="0.1" className="input-field" value={form.quantity} onChange={e => setForm({...form, quantity: parseFloat(e.target.value) || 0})} required /></div>
                    <div><label className="block text-sm text-[#666] mb-1">Min Level</label><input type="number" min="0" step="0.1" className="input-field" value={form.threshold} onChange={e => setForm({...form, threshold: parseFloat(e.target.value) || 0})} required /></div>
                    <div><label className="block text-sm text-[#666] mb-1">Cost/Unit</label><input type="number" min="0" className="input-field" value={form.costPerUnit} onChange={e => setForm({...form, costPerUnit: parseFloat(e.target.value) || 0})} /></div>
                  </div>
                  <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={createMutation.isPending}>Save Item</button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Restock Modal */}
      <AnimatePresence>
        {restockModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setRestockModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm card text-center">
                <h2 className="text-lg font-semibold text-[#111] mb-2">Restock {restockModal.name}</h2>
                <p className="text-sm text-[#888] mb-4">Current: {restockModal.quantity} {restockModal.unit}</p>
                <input type="number" min="1" className="input-field text-center text-lg mb-4" value={restockQty} onChange={e => setRestockQty(parseFloat(e.target.value) || 0)} placeholder="Quantity to add" autoFocus />
                <div className="flex gap-3">
                  <button onClick={() => setRestockModal(null)} className="btn-ghost flex-1">Cancel</button>
                  <button onClick={() => restockMutation.mutate({ id: restockModal._id, addQuantity: restockQty })}
                    disabled={restockQty <= 0} className="btn-primary flex-1">
                    Restock
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
