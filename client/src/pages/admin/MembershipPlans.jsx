import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency } from '../../lib/utils';
import { Activity, Waves, Dumbbell, CircleDot, Target, Check } from 'lucide-react';
import { toast } from 'sonner';

const durations = { monthly: 30, quarterly: 90, 'half-yearly': 180 };
const sports = ['cricket', 'swimming', 'gym', 'turf', 'badminton'];
const sportIcons = { cricket: <Activity size={14} className='inline mr-1' />, swimming: <Waves size={14} className='inline mr-1' />, gym: <Dumbbell size={14} className='inline mr-1' />, turf: <CircleDot size={14} className='inline mr-1' />, badminton: <Target size={14} className='inline mr-1' /> };

export default function MembershipPlans() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', duration: 'monthly', durationDays: 30, sportsIncluded: [], price: '', gstPercent: 18, features: [''], isActive: true });
  const qc = useQueryClient();

  const { data } = useQuery({ queryKey: ['plans'], queryFn: () => api.get('/plans').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/plans', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['plans'] }); setModalOpen(false); toast.success('Plan created!'); },
  });

  return (
    <div>
      <PageHeader title="Membership Plans" subtitle="Manage academy membership plans"
        action={<button className="btn-primary" onClick={() => setModalOpen(true)}>+ New Plan</button>} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(data?.plans || []).map((plan, i) => (
          <motion.div key={plan._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-400" />
            <div className="flex items-center justify-between mb-4">
              <span className="badge badge-info">{plan.duration}</span>
              <span className={`badge ${plan.isActive ? 'badge-success' : 'badge-danger'}`}>{plan.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            <h3 className="text-lg font-bold text-[#111111] mb-1">{plan.name}</h3>
            <div className="text-3xl font-bold text-[#111111] mb-4">{formatCurrency(plan.price)}<span className="text-sm text-[#888888] font-normal">/{plan.duration}</span></div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {plan.sportsIncluded?.map(s => (
                <span key={s} className="px-2 py-1 rounded-md bg-[#F0F0F0] text-xs text-[#666666]">{sportIcons[s]} {s}</span>
              ))}
            </div>
            {plan.features?.length > 0 && (
              <ul className="space-y-1.5 mb-4">
                {plan.features.map((f, i) => f && <li key={i} className="text-sm text-[#666666] flex items-center gap-2"><Check size={14} className='text-green-600' />{f}</li>)}
              </ul>
            )}
            <div className="flex gap-2 mt-auto">
              <button className="btn-ghost flex-1 text-xs">Edit</button>
              <button className="btn-ghost flex-1 text-xs">Duplicate</button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Plan Builder Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-lg card max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[#111111]">New Membership Plan</h2>
                  <button onClick={() => setModalOpen(false)} className="text-[#888888] hover:text-[#111111]">✕</button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
                  <div><label className="block text-sm text-[#666666] mb-1">Plan Name</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                  <div>
                    <label className="block text-sm text-[#666666] mb-2">Duration</label>
                    <div className="flex gap-2">
                      {Object.keys(durations).map(d => (
                        <button key={d} type="button" onClick={() => setForm({...form, duration: d, durationDays: durations[d]})}
                          className={`flex-1 py-2 rounded-lg text-sm transition-all ${form.duration === d ? 'bg-black text-white' : 'btn-ghost'}`}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[#666666] mb-1">Price (₹)</label><input type="number" className="input-field" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required /></div>
                    <div><label className="block text-sm text-[#666666] mb-1">GST %</label><input type="number" className="input-field" value={form.gstPercent} onChange={e => setForm({...form, gstPercent: e.target.value})} /></div>
                  </div>
                  {form.price && <div className="px-3 py-2 rounded-lg bg-[#F0F0F0] text-sm text-[#666666]">GST: ₹{Math.round(form.price * form.gstPercent / 100)} | Total: ₹{Math.round(form.price * (1 + form.gstPercent / 100))}</div>}
                  <div>
                    <label className="block text-sm text-[#666666] mb-2">Sports Included</label>
                    <div className="flex flex-wrap gap-2">
                      {sports.map(s => (
                        <button key={s} type="button" onClick={() => setForm({...form, sportsIncluded: form.sportsIncluded.includes(s) ? form.sportsIncluded.filter(x => x !== s) : [...form.sportsIncluded, s]})}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${form.sportsIncluded.includes(s) ? 'bg-black text-white' : 'btn-ghost'}`}>{sportIcons[s]} {s}</button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full py-3" disabled={createMutation.isPending}>Create Plan</button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
