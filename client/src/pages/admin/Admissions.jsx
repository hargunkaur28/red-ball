import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import FeeBadge from '../../components/shared/FeeBadge';
import SkeletonTable from '../../components/shared/SkeletonTable';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

const emptyForm = {
  name: '', email: '', phone: '', gender: '', address: '',
  emergencyContact: '', sportsIncluded: [], planId: '',
  paymentMode: 'cash', notes: '',
};

export default function Admissions() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admissions', filter, search],
    queryFn: () => api.get(`/admissions?status=${filter}&search=${search}`).then(r => r.data),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/plans').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/admissions', d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admissions'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      setDrawerOpen(false);
      setForm({ ...emptyForm });
      const admission = res.data.admission;
      const isPaid = admission.paymentStatus === 'paid';
      toast.success(
        isPaid
          ? `Admission created! Membership is ACTIVE.`
          : `Admission created! Membership is PENDING (awaiting payment).`
      );
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error creating admission'),
  });

  const columns = [
    { key: 'admissionNumber', label: 'Adm. No.', sortable: true, render: (r) => <span className="font-mono text-black text-xs">{r.admissionNumber}</span> },
    { key: 'name', label: 'Student', sortable: true, render: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#E5E5E5] flex items-center justify-center text-xs font-bold text-[#111111]">{r.studentId?.name?.[0]}</div>
        <div>
          <p className="text-[#111111] font-medium text-sm">{r.studentId?.name}</p>
          <p className="text-xs text-[#888888]">{r.studentId?.email}</p>
        </div>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: (r) => <span className="text-[#666666] text-sm">{r.phone || r.studentId?.phone}</span> },
    { key: 'sports', label: 'Sports', render: (r) => (
      <div className="flex gap-1 flex-wrap">{r.sportsIncluded?.map(s => <span key={s} className="badge badge-info text-[10px]">{s}</span>)}</div>
    )},
    { key: 'plan', label: 'Plan', render: (r) => (
      <span className="text-sm text-[#666]">{r.membershipId?.planId?.name || '—'}</span>
    )},
    { key: 'status', label: 'Status', render: (r) => <FeeBadge status={r.status} /> },
    { key: 'paymentStatus', label: 'Fees', render: (r) => (
      <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
        r.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' :
        r.paymentStatus === 'partial' ? 'bg-blue-50 text-blue-700' :
        r.paymentStatus === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
      }`}>
        {r.paymentStatus || 'N/A'}
      </span>
    )},
  ];

  const sports = ['cricket', 'swimming', 'gym', 'turf', 'badminton', 'football', 'yoga'];

  const selectedPlan = plansData?.plans?.find(p => p._id === form.planId);

  return (
    <div>
      <PageHeader
        title="Admissions"
        subtitle={`${data?.total || 0} total admissions`}
        action={
          <button className="btn-primary" onClick={() => { setForm({ ...emptyForm }); setDrawerOpen(true); }}>
            + New Admission
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input type="text" placeholder="Search name, phone, email..." className="input-field w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
        {['', 'active', 'inactive', 'expired'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm transition-all ${filter === s ? 'bg-black text-white' : 'btn-ghost'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? <SkeletonTable /> : <DataTable columns={columns} data={data?.admissions || []} />}

      {/* Admission Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setDrawerOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 h-screen w-[520px] max-w-full bg-white border-l border-[#EAEAEA] z-50 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-[#111111]">New Admission</h2>
                <button onClick={() => setDrawerOpen(false)} className="text-[#888888] hover:text-[#111111] text-xl">✕</button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
                {/* Student Details */}
                <p className="text-xs font-semibold text-[#999] uppercase tracking-wider">Student Details</p>
                <div><label className="block text-sm text-[#666666] mb-1">Full Name *</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm text-[#666666] mb-1">Email *</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
                  <div><label className="block text-sm text-[#666666] mb-1">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-[#666666] mb-1">Gender</label>
                    <select className="input-field" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div><label className="block text-sm text-[#666666] mb-1">Emergency Contact</label><input className="input-field" value={form.emergencyContact} onChange={e => setForm({...form, emergencyContact: e.target.value})} /></div>
                </div>
                <div><label className="block text-sm text-[#666666] mb-1">Address</label><textarea className="input-field h-16 resize-none" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>

                {/* Sports Access */}
                <p className="text-xs font-semibold text-[#999] uppercase tracking-wider pt-2">Sports Access</p>
                <div className="flex flex-wrap gap-2">
                  {sports.map(s => (
                    <button key={s} type="button"
                      onClick={() => setForm({...form, sportsIncluded: form.sportsIncluded.includes(s) ? form.sportsIncluded.filter(x => x !== s) : [...form.sportsIncluded, s]})}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all capitalize ${form.sportsIncluded.includes(s) ? 'bg-black text-white' : 'btn-ghost'}`}>
                      {s}
                    </button>
                  ))}
                </div>

                {/* Membership Plan */}
                <p className="text-xs font-semibold text-[#999] uppercase tracking-wider pt-2">Membership Plan</p>
                <div className="space-y-2">
                  {plansData?.plans?.map(plan => (
                    <label key={plan._id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${form.planId === plan._id ? 'border-black bg-[#F5F5F5]' : 'border-[#EAEAEA] hover:border-[#CCC]'}`}>
                      <input type="radio" name="plan" className="accent-black" checked={form.planId === plan._id} onChange={() => setForm({...form, planId: plan._id})} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#111]">{plan.name}</p>
                        <p className="text-xs text-[#888]">{plan.durationDays} days • {plan.sportsIncluded?.join(', ')}</p>
                      </div>
                      <span className="text-sm font-bold text-[#111]">{formatCurrency(plan.price)}</span>
                    </label>
                  ))}
                  {(!plansData?.plans || plansData.plans.length === 0) && (
                    <p className="text-sm text-[#888] text-center py-4">No plans created yet. Go to Membership Plans to create one.</p>
                  )}
                </div>

                {/* Payment Method */}
                {form.planId && (
                  <>
                    <p className="text-xs font-semibold text-[#999] uppercase tracking-wider pt-2">Payment Method</p>
                    <div className="grid grid-cols-4 gap-2">
                      {['cash', 'upi', 'card', 'online'].map(mode => (
                        <button key={mode} type="button"
                          onClick={() => setForm({...form, paymentMode: mode})}
                          className={`py-2 rounded-lg text-sm capitalize transition-all ${form.paymentMode === mode ? 'bg-black text-white' : 'btn-ghost'}`}>
                          {mode}
                        </button>
                      ))}
                    </div>

                    {/* Summary */}
                    {selectedPlan && (
                      <div className="rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] p-4 space-y-2">
                        <div className="flex justify-between text-sm"><span className="text-[#666]">Plan</span><span className="text-[#111]">{selectedPlan.name}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-[#666]">Amount</span><span className="text-[#111]">{formatCurrency(selectedPlan.price)}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-[#666]">GST (18%)</span><span className="text-[#111]">{formatCurrency(Math.round(selectedPlan.price * 0.18))}</span></div>
                        <div className="flex justify-between text-base font-bold border-t border-[#EAEAEA] pt-2">
                          <span className="text-[#111]">Total</span>
                          <span className="text-black">{formatCurrency(Math.round(selectedPlan.price * 1.18))}</span>
                        </div>
                        {form.paymentMode === 'online' && (
                          <p className="text-xs text-amber-600 mt-2">⚠ Membership will remain PENDING until online payment is verified.</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div><label className="block text-sm text-[#666666] mb-1">Notes</label><textarea className="input-field h-16 resize-none" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
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
