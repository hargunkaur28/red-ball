import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency, calcGST } from '../../lib/utils';
import { toast } from 'sonner';

const sportRates = { cricket: 500, swimming: 400, gym: 300, turf: 800, badminton: 350 };

export default function OneTimePlay() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', sport: 'cricket', hours: 1, ratePerHour: 500 });
  const gst = calcGST(form.hours * form.ratePerHour);

  const { data: entries } = useQuery({ queryKey: ['onetimeplay'], queryFn: () => api.get('/onetimeplay').then(r => r.data) });

  const mutation = useMutation({
    mutationFn: (d) => api.post('/onetimeplay', d),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['onetimeplay'] });
      setForm({ name: '', phone: '', sport: 'cricket', hours: 1, ratePerHour: 500 }); 
      toast.success('Entry recorded!'); 
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  return (
    <div>
      <PageHeader title="One-Time Play" subtitle="Quick POS for walk-in players" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* POS Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card">
          <h3 className="text-sm font-medium text-[#666666] mb-4">New Entry</h3>
          <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
            <div><label className="block text-sm text-[#666666] mb-1">Name *</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><label className="block text-sm text-[#666666] mb-1">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div>
              <label className="block text-sm text-[#666666] mb-2">Sport</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(sportRates).map(s => (
                  <button key={s} type="button" onClick={() => setForm({...form, sport: s, ratePerHour: sportRates[s]})}
                    className={`py-2 rounded-lg text-sm transition-all ${form.sport === s ? 'bg-black text-white' : 'btn-ghost'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[#666666] mb-1">Hours</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setForm({...form, hours: Math.max(1, form.hours - 1)})} className="btn-ghost w-10 h-10">−</button>
                  <input type="number" className="input-field text-center" value={form.hours} onChange={e => setForm({...form, hours: parseInt(e.target.value) || 1})} min={1} />
                  <button type="button" onClick={() => setForm({...form, hours: form.hours + 1})} className="btn-ghost w-10 h-10">+</button>
                </div>
              </div>
              <div><label className="block text-sm text-[#666666] mb-1">Rate/Hour (₹)</label><input type="number" className="input-field" value={form.ratePerHour} onChange={e => setForm({...form, ratePerHour: parseInt(e.target.value) || 0})} /></div>
            </div>
            <div className="rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-[#666666]">Subtotal</span><span className="text-[#111111]">{formatCurrency(gst.amount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#666666]">GST (18%)</span><span className="text-[#111111]">{formatCurrency(gst.gstAmount)}</span></div>
              <div className="flex justify-between text-base font-bold border-t border-[#EAEAEA] pt-2"><span className="text-[#111111]">Total</span><span className="text-black">{formatCurrency(gst.totalAmount)}</span></div>
            </div>
            <button type="submit" className="btn-primary w-full py-3" disabled={mutation.isPending}>Generate Receipt</button>
          </form>
        </motion.div>

        {/* Today's entries */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card">
          <h3 className="text-sm font-medium text-[#666666] mb-4">Recent Entries</h3>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {!entries?.entries?.length ? (
              <div className="text-center py-8 text-[#888888] text-sm">No entries yet. Start by adding one!</div>
            ) : (
              entries.entries.map((entry) => (
                <div key={entry._id} className="p-3 rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-[#111111]">{entry.name}</p>
                    <p className="text-xs text-[#666666]">{entry.sport} • {entry.hours} hr(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#111111]">{formatCurrency(entry.amount)}</p>
                    <p className="text-[10px] text-[#888888]">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
