import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency } from '../../lib/utils';
import { CheckCircle2, XCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = { name: '', description: '', category: '', sizes: [{ label: '', price: 0 }], isVeg: true, isAvailable: true };

export default function Menu() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data } = useQuery({ queryKey: ['menu'], queryFn: () => api.get('/menu').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (d) => editId ? api.put(`/menu/${editId}`, d) : api.post('/menu', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu'] });
      setDrawerOpen(false);
      setForm({ ...emptyForm });
      setEditId(null);
      toast.success(editId ? 'Item updated!' : 'Item added!');
    },
    onError: () => toast.error('Failed to save item'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }) => api.put(`/menu/${id}`, { isAvailable }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Availability updated');
    },
  });

  const openEdit = (item) => {
    setEditId(item._id);
    setForm({
      name: item.name, description: item.description || '', category: item.category || '',
      sizes: item.sizes || [{ label: '', price: 0 }], isVeg: item.isVeg, isAvailable: item.isAvailable,
    });
    setDrawerOpen(true);
  };

  const addSize = () => setForm({ ...form, sizes: [...form.sizes, { label: '', price: 0 }] });
  const removeSize = (i) => setForm({ ...form, sizes: form.sizes.filter((_, idx) => idx !== i) });
  const updateSize = (i, key, value) => {
    const sizes = [...form.sizes];
    sizes[i] = { ...sizes[i], [key]: key === 'price' ? parseFloat(value) || 0 : value };
    setForm({ ...form, sizes });
  };

  const items = data?.items || [];
  const categories = [...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered = categoryFilter ? items.filter(i => i.category === categoryFilter) : items;

  return (
    <div>
      <PageHeader title="Menu Management" subtitle={`${items.length} items`}
        action={<button className="btn-primary" onClick={() => { setEditId(null); setForm({ ...emptyForm }); setDrawerOpen(true); }}>+ Add Item</button>}
      />

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button onClick={() => setCategoryFilter('')} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${!categoryFilter ? 'bg-black text-white' : 'btn-ghost'}`}>All</button>
          {categories.map(c => (
            <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 rounded-lg text-sm transition-all capitalize ${categoryFilter === c ? 'bg-black text-white' : 'btn-ghost'}`}>{c}</button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, i) => (
          <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                  <span className={`block w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                </span>
                <h3 className="text-[#111111] font-medium">{item.name}</h3>
              </div>
              <button
                onClick={() => toggleMutation.mutate({ id: item._id, isAvailable: !item.isAvailable })}
                title={item.isAvailable ? 'Mark Out of Stock' : 'Mark Available'}
              >
                {item.isAvailable
                  ? <CheckCircle2 size={18} className="text-green-600" />
                  : <XCircle size={18} className="text-red-500" />
                }
              </button>
            </div>
            {item.category && <span className="text-[10px] text-[#888] bg-[#F7F7F7] px-2 py-0.5 rounded-full mb-2 inline-block">{item.category}</span>}
            <p className="text-xs text-[#888888] mb-3 line-clamp-2">{item.description || 'No description'}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.sizes?.map(s => <span key={s.label} className="badge badge-info text-[10px]">{s.label}: {formatCurrency(s.price)}</span>)}
            </div>
            <button onClick={() => openEdit(item)} className="btn-ghost w-full text-xs">Edit</button>
          </motion.div>
        ))}
        {filtered.length === 0 && <div className="col-span-3 card text-center py-12 text-[#888888]">No menu items yet. Add your first item!</div>}
      </div>

      {/* Add/Edit Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setDrawerOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 h-screen w-[480px] max-w-full bg-white border-l border-[#EAEAEA] z-50 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#111111]">{editId ? 'Edit Item' : 'Add Menu Item'}</h2>
                <button onClick={() => setDrawerOpen(false)} className="text-[#888] hover:text-[#111] text-xl">✕</button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
                <div><label className="block text-sm text-[#666] mb-1">Item Name *</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div><label className="block text-sm text-[#666] mb-1">Description</label><textarea className="input-field h-16 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-[#666] mb-1">Category</label>
                    <input className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Beverages" />
                  </div>
                  <div className="flex items-end gap-4 pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="veg" checked={form.isVeg} onChange={() => setForm({...form, isVeg: true})} className="accent-green-600" />
                      <span className="text-sm text-green-700">Veg</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="veg" checked={!form.isVeg} onChange={() => setForm({...form, isVeg: false})} className="accent-red-600" />
                      <span className="text-sm text-red-600">Non-Veg</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-[#666]">Sizes & Pricing *</label>
                    <button type="button" onClick={addSize} className="text-xs text-black font-medium flex items-center gap-1"><Plus size={14} /> Add Size</button>
                  </div>
                  <div className="space-y-2">
                    {form.sizes.map((s, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input className="input-field flex-1" placeholder="e.g. Regular, M, L" value={s.label} onChange={e => updateSize(i, 'label', e.target.value)} required />
                        <input type="number" className="input-field w-28" placeholder="Price" min="0" value={s.price} onChange={e => updateSize(i, 'price', e.target.value)} required />
                        {form.sizes.length > 1 && (
                          <button type="button" onClick={() => removeSize(i)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full py-3" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : editId ? 'Update Item' : 'Add Item'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
