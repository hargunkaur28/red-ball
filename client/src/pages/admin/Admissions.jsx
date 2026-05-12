import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import FeeBadge from '../../components/shared/FeeBadge';
import SkeletonTable from '../../components/shared/SkeletonTable';
import { toast } from 'sonner';

export default function Admissions() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admissions', filter, search],
    queryFn: () => api.get(`/admissions?status=${filter}&search=${search}`).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/admissions', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admissions'] }); setDrawerOpen(false); toast.success('Admission created!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const [form, setForm] = useState({ name: '', email: '', phone: '', emergencyContact: '', sportsIncluded: [], notes: '' });

  const columns = [
    { key: 'admissionNumber', label: 'Admission No.', sortable: true, render: (r) => <span className="font-mono text-black">{r.admissionNumber}</span> },
    { key: 'name', label: 'Name', sortable: true, render: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#E5E5E5] flex items-center justify-center text-xs text-[#111111]">{r.studentId?.name?.[0]}</div>
        <div><p className="text-[#111111] font-medium">{r.studentId?.name}</p><p className="text-xs text-[#888888]">{r.studentId?.email}</p></div>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: (r) => <span className="text-[#666666]">{r.phone || r.studentId?.phone}</span> },
    { key: 'sports', label: 'Sports', render: (r) => (
      <div className="flex gap-1 flex-wrap">{r.sportsIncluded?.map(s => <span key={s} className="badge badge-info text-[10px]">{s}</span>)}</div>
    )},
    { key: 'status', label: 'Status', render: (r) => <FeeBadge status={r.status} /> },
  ];

  const sports = ['cricket', 'swimming', 'gym', 'turf', 'badminton'];

  return (
    <div>
      <PageHeader title="Admissions" subtitle={`${data?.total || 0} total admissions`}
        action={<button className="btn-primary" onClick={() => { setEditData(null); setForm({ name: '', email: '', phone: '', emergencyContact: '', sportsIncluded: [], notes: '' }); setDrawerOpen(true); }}>+ New Admission</button>}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <input type="text" placeholder="Search by name or phone..." className="input-field w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
        {['', 'active', 'inactive', 'expired'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filter === s ? 'bg-black text-white' : 'btn-ghost'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? <SkeletonTable /> : <DataTable columns={columns} data={data?.admissions || []} />}

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setDrawerOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 h-screen w-[480px] bg-white border-l border-[#EAEAEA] z-50 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#111111]">{editData ? 'Edit' : 'New'} Admission</h2>
                <button onClick={() => setDrawerOpen(false)} className="text-[#888888] hover:text-[#111111] text-xl">✕</button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
                <div><label className="block text-sm text-[#666666] mb-1">Full Name</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div><label className="block text-sm text-[#666666] mb-1">Email</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm text-[#666666] mb-1">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                  <div><label className="block text-sm text-[#666666] mb-1">Emergency Contact</label><input className="input-field" value={form.emergencyContact} onChange={e => setForm({...form, emergencyContact: e.target.value})} /></div>
                </div>
                <div>
                  <label className="block text-sm text-[#666666] mb-2">Sports</label>
                  <div className="flex flex-wrap gap-2">
                    {sports.map(s => (
                      <button key={s} type="button"
                        onClick={() => setForm({...form, sportsIncluded: form.sportsIncluded.includes(s) ? form.sportsIncluded.filter(x => x !== s) : [...form.sportsIncluded, s]})}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${form.sportsIncluded.includes(s) ? 'bg-black text-white' : 'btn-ghost'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className="block text-sm text-[#666666] mb-1">Notes</label><textarea className="input-field h-20 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
                <button type="submit" className="btn-primary w-full py-3" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Admission'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
