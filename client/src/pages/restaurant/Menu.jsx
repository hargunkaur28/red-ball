import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency } from '../../lib/utils';
import { CheckCircle2, XCircle, Plus, Trash2, Sparkles, Flame, Clock, Search, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm = {
  name: '',
  description: '',
  category: 'Snacks',
  image: '',
  calories: 250,
  protein: 15,
  preparationTime: 15,
  featured: false,
  chefRecommended: false,
  sizes: [{ label: 'Regular', price: 199 }],
  isVeg: true,
  isAvailable: true,
  showNutrition: false,
  imageFile: null
};



export default function Menu() {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingCategory, setRenamingCategory] = useState(null); // { from: string }
  const [renameValue, setRenameValue] = useState('');

  const { data } = useQuery({ 
    queryKey: ['menu'], 
    queryFn: () => api.get('/menu').then(r => r.data) 
  });

  const createMutation = useMutation({
    mutationFn: (d) => {
      if (d.imageFile) {
        const formData = new FormData();
        Object.keys(d).forEach(key => {
          if (key === 'sizes') formData.append(key, JSON.stringify(d[key]));
          else if (key === 'imageFile') formData.append('imageFile', d[key]);
          else formData.append(key, d[key]);
        });
        return editId ? api.put(`/menu/items/${editId}`, formData) : api.post('/menu/items', formData);
      }
      return editId ? api.put(`/menu/items/${editId}`, d) : api.post('/menu/items', d);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu'] });
      setDrawerOpen(false);
      setForm({ ...emptyForm });
      setEditId(null);
      toast.success(editId ? 'Dish updated successfully!' : 'New premium dish added!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save item'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable, featured }) => api.put(`/menu/items/${id}`, { isAvailable, featured }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Menu sync broadcasted instantly!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/menu/items/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['menu'] });
      toast.success('Item archived successfully');
    }
  });

  const renameMutation = useMutation({
    mutationFn: ({ from, to }) => api.put('/menu/categories/rename', { from, to }),
    onSuccess: (_, { from, to }) => {
      qc.invalidateQueries({ queryKey: ['menu'] });
      setRenamingCategory(null);
      if (categoryFilter === from) setCategoryFilter(to);
      toast.success(`Category renamed to "${to}"`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Rename failed'),
  });

  const openEdit = (item) => {
    setEditId(item._id);
    setForm({
      name: item.name, 
      description: item.description || '', 
      category: item.category || 'Snacks', 
      image: item.image || '',
      calories: item.calories || 250,
      protein: item.protein || 15,
      preparationTime: item.preparationTime || 15,
      featured: item.featured || false,
      chefRecommended: item.chefRecommended || false,
      sizes: item.sizes?.length ? item.sizes : [{ label: 'Regular', price: 199 }],
      isVeg: item.isVeg ?? true,
      isAvailable: item.isAvailable ?? true,
      showNutrition: item.showNutrition ?? false,
      imageFile: null,
    });
    setDrawerOpen(true);
  };

  const addSize = () => setForm({ ...form, sizes: [...form.sizes, { label: 'Large', price: 299 }] });
  const removeSize = (i) => setForm({ ...form, sizes: form.sizes.filter((_, idx) => idx !== i) });
  const updateSize = (i, key, value) => {
    const sizes = [...form.sizes];
    sizes[i] = { ...sizes[i], [key]: key === 'price' ? parseFloat(value) || 0 : value };
    setForm({ ...form, sizes });
  };

  const items = data?.items || [];
  const CATEGORIES_LIST = Array.from(new Set(items.map(item => item.category))).sort((a, b) => a.localeCompare(b));

  const filtered = items
    .filter(i => categoryFilter ? i.category === categoryFilter : true)
    .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || (i.category || '').toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const catCompare = (a.category || '').localeCompare(b.category || '');
      if (catCompare !== 0) return catCompare;
      return (a.name || '').localeCompare(b.name || '');
    });

  return (
    <div className="pb-24">
      <PageHeader 
        title="Café Menu & Nutrition Manager" 
        subtitle={`Total Live Dishes: ${items.length} • Featured Recovery Items: ${items.filter(i => i.featured).length}`}
        action={
          <button 
            className="px-6 py-3 bg-[#C8102E] hover:bg-[#A00D24] text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-lg transition-all hover:scale-105" 
            onClick={() => { setEditId(null); setForm({ ...emptyForm }); setDrawerOpen(true); }}
          >
            <Plus size={18} />
            <span>Add Premium Dish</span>
          </button>
        }
      />

      {/* Search Bar */}
      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search dishes by name or category..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#C8102E] text-sm shadow-sm"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap overflow-x-auto pb-2">
        <button 
          onClick={() => setCategoryFilter('')} 
          className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all ${
            !categoryFilter ? 'bg-[#0D0D0D] text-white shadow-md scale-105' : 'bg-white text-gray-600 border hover:bg-gray-50'
          }`}
        >
          All Dishes
        </button>
        {CATEGORIES_LIST.map(c => (
          renamingCategory?.from === c ? (
            <div key={c} className="flex items-center gap-1">
              <input
                autoFocus
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && renameValue.trim() && renameValue.trim() !== c)
                    renameMutation.mutate({ from: c, to: renameValue.trim() });
                  if (e.key === 'Escape') setRenamingCategory(null);
                }}
                className="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-primary outline-none w-36 text-black"
              />
              <button
                onClick={() => {
                  const to = renameValue.trim();
                  if (to && to !== c) renameMutation.mutate({ from: c, to });
                  else setRenamingCategory(null);
                }}
                disabled={renameMutation.isPending}
                className="p-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
              >
                <Check size={13} />
              </button>
              <button
                onClick={() => setRenamingCategory(null)}
                className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <div key={c} className="group flex items-center gap-0.5">
              <button
                onClick={() => setCategoryFilter(c)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all capitalize ${
                  categoryFilter === c ? 'bg-primary text-white shadow-md scale-105' : 'bg-white text-gray-600 border hover:bg-gray-50'
                }`}
              >
                {c}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setRenamingCategory({ from: c }); setRenameValue(c); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                title="Rename category"
              >
                <Pencil size={11} />
              </button>
            </div>
          )
        ))}
      </div>

      {/* Grid of Dishes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((item, i) => (
          <motion.div 
            key={item._id} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.03 }} 
            className={`bg-white rounded-3xl p-5 border shadow-sm flex flex-col justify-between overflow-hidden relative transition-all hover:shadow-md ${
              !item.isAvailable ? 'bg-gray-50/80 grayscale opacity-70' : 'border-gray-100'
            }`}
          >
            <div>
              {/* Image Preview & Badges */}
              <div className="relative h-44 bg-gray-100 rounded-2xl overflow-hidden mb-4">
                <img 
                  src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop'} 
                  alt={item.name} 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold text-white ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}>
                    {item.isVeg ? 'Veg' : 'Non-Veg'}
                  </span>
                  {item.featured && (
                    <span className="bg-[#F5A623] text-black px-2 py-0.5 rounded text-[10px] font-extrabold shadow">
                      ★ Featured Hero
                    </span>
                  )}
                  {item.chefRecommended && (
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-extrabold shadow">
                      👨‍🍳 Choice
                    </span>
                  )}
                </div>
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] flex items-center justify-center text-white text-xs font-black tracking-widest uppercase">
                    Out of Stock
                  </div>
                )}
              </div>

              {/* Title & Stats */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-extrabold text-[#111111] text-base leading-tight line-clamp-1">{item.name}</h3>
                <span className="text-xs bg-gray-100 text-gray-700 font-mono font-bold px-2 py-0.5 rounded-full shrink-0">
                  {item.category}
                </span>
              </div>

              <p className="text-xs text-gray-500 line-clamp-2 mb-3 min-h-[32px]">
                {item.description || 'Premium nutrition recovery blend.'}
              </p>

              {/* Nutrition stats pill */}
              <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl text-[11px] font-extrabold text-gray-700 mb-4 border border-gray-100">
                <span className="flex items-center gap-1 text-[#C8102E]">
                  <Flame size={14} /> {item.calories} kcal
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-blue-600">
                  💪 {item.protein}g Protein
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock size={12} /> {item.preparationTime}m prep
                </span>
              </div>
            </div>

            {/* Pricing & Sync Toggles */}
            <div>
              <div className="flex flex-wrap gap-1 mb-4 border-t border-gray-100 pt-3 font-mono">
                {item.sizes?.map(s => (
                  <span key={s.label} className="bg-black text-white px-2.5 py-1 rounded-lg text-xs font-extrabold">
                    {s.label}: {formatCurrency(s.price)}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button 
                  onClick={() => openEdit(item)} 
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-extrabold transition-all"
                >
                  Edit Specs
                </button>

                <button
                  onClick={() => toggleMutation.mutate({ id: item._id, isAvailable: !item.isAvailable, featured: item.featured })}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                    item.isAvailable ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-700'
                  }`}
                  title={item.isAvailable ? 'Click to mark Out of Stock' : 'Click to mark Available'}
                >
                  {item.isAvailable ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${item.name}?`)) deleteMutation.mutate(item._id);
                  }}
                  className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Archive Item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400 font-medium">
            No dishes found in this category. Click "+ Add Premium Dish" above.
          </div>
        )}
      </div>

      {/* Add / Edit Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
              onClick={() => setDrawerOpen(false)} 
            />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 26, stiffness: 300 }} 
              className="fixed right-0 top-0 h-screen w-[520px] max-w-full bg-white shadow-2xl z-50 overflow-y-auto p-6 md:p-8 flex flex-col justify-between border-l border-gray-100"
            >
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-xl font-black text-[#111111]">
                      {editId ? 'Edit Premium Dish' : 'Add New Premium Dish'}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      Changes instantly sync to customer QR table screens.
                    </p>
                  </div>
                  <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600">
                    ✕
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-gray-600 mb-1">Dish Name *</label>
                    <input 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-black focus:outline-none focus:border-[#C8102E]" 
                      value={form.name} 
                      onChange={e => setForm({...form, name: e.target.value})} 
                      placeholder="e.g. Grass-Fed Whey Isolate Shake"
                      required 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-gray-600 mb-1">Premium Description</label>
                    <textarea 
                      rows="2" 
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-black focus:outline-none focus:border-[#C8102E] resize-none" 
                      value={form.description} 
                      onChange={e => setForm({...form, description: e.target.value})} 
                      placeholder="Rich, premium post-workout recovery ingredients..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-gray-600 mb-1">Image URL or Upload</label>
                    <div className="space-y-2">
                      <input 
                        type="url"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono text-black focus:outline-none focus:border-[#C8102E]" 
                        value={form.image} 
                        onChange={e => setForm({...form, image: e.target.value})} 
                        placeholder="https://images.unsplash.com/..."
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">OR UPLOAD FILE</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) setForm({...form, imageFile: file, image: ''});
                        }}
                        className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                      />
                      {form.imageFile && (
                        <p className="text-xs text-green-600 font-medium">Selected: {form.imageFile.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase text-gray-600 mb-1">Category</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-black focus:outline-none focus:border-[#C8102E]"
                        value={form.category} 
                        onChange={e => setForm({...form, category: e.target.value})}
                      >
                        {CATEGORIES_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase text-gray-600 mb-1">Diet Type</label>
                      <select
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-bold text-black focus:outline-none focus:border-[#C8102E]"
                        value={form.isVeg ? 'true' : 'false'}
                        onChange={e => setForm({...form, isVeg: e.target.value === 'true'})}
                      >
                        <option value="true">Pure Veg</option>
                        <option value="false">Non-Veg</option>
                      </select>
                    </div>
                  </div>

                  {/* Nutrition stats row */}
                  <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-gray-600 mb-1">Calories (kcal)</label>
                      <input 
                        type="number" 
                        min="0"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-extrabold text-black focus:outline-none focus:border-[#C8102E]" 
                        value={form.calories} 
                        onChange={e => setForm({...form, calories: Number(e.target.value)})} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-gray-600 mb-1">Protein (g)</label>
                      <input 
                        type="number" 
                        min="0"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-extrabold text-black focus:outline-none focus:border-[#C8102E]" 
                        value={form.protein} 
                        onChange={e => setForm({...form, protein: Number(e.target.value)})} 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-gray-600 mb-1">Prep Time (min)</label>
                      <input 
                        type="number" 
                        min="1"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-extrabold text-black focus:outline-none focus:border-[#C8102E]" 
                        value={form.preparationTime} 
                        onChange={e => setForm({...form, preparationTime: Number(e.target.value)})} 
                      />
                    </div>
                  </div>

                  {/* Feature Checkboxes */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.featured ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={e => setForm({...form, featured: e.target.checked})}
                        className="w-4 h-4 accent-[#F5A623]"
                      />
                      <span className="text-xs font-black text-black">★ Featured Hero Item</span>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.chefRecommended ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
                      <input
                        type="checkbox"
                        checked={form.chefRecommended}
                        onChange={e => setForm({...form, chefRecommended: e.target.checked})}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-xs font-black text-black">👨‍🍳 Chef's Choice</span>
                    </label>

                    <label className={`col-span-2 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.showNutrition ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                      <input
                        type="checkbox"
                        checked={form.showNutrition}
                        onChange={e => setForm({...form, showNutrition: e.target.checked})}
                        className="w-4 h-4 accent-green-600"
                      />
                      <div>
                        <span className="text-xs font-black text-black">🥗 Show Nutrition Info on Menu</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">Displays calories & protein to customers on the ordering page and home page</p>
                      </div>
                    </label>
                  </div>

                  {/* Pricing Table */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-gray-600">Portion Sizes & Price *</label>
                      <button type="button" onClick={addSize} className="text-xs text-[#C8102E] font-black flex items-center gap-1">
                        <Plus size={14} /> Add Size Option
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.sizes.map((s, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input 
                            className="w-1/2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-black focus:outline-none focus:border-[#C8102E]" 
                            placeholder="Size Label (Regular, M, L)" 
                            value={s.label} 
                            onChange={e => updateSize(i, 'label', e.target.value)} 
                            required 
                          />
                          <input 
                            type="number" 
                            className="w-1/2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono font-bold text-black focus:outline-none focus:border-[#C8102E]" 
                            placeholder="Price (₹)" 
                            min="0" 
                            value={s.price} 
                            onChange={e => updateSize(i, 'price', e.target.value)} 
                            required 
                          />
                          {form.sizes.length > 1 && (
                            <button type="button" onClick={() => removeSize(i)} className="p-2 text-red-400 hover:text-red-600">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              </div>

              <div className="pt-6 border-t border-gray-100 mt-6">
                <button 
                  onClick={(e) => { e.preventDefault(); createMutation.mutate(form); }} 
                  disabled={createMutation.isPending}
                  className="w-full py-4 rounded-2xl bg-[#0D0D0D] hover:bg-[#1a1a1a] text-white font-extrabold text-base shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? 'Syncing to Live Menu...' : editId ? 'Update Premium Dish' : 'Publish to Digital Menu'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
