import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, RefreshCw, ChevronRight, ChevronLeft, AlertTriangle,
  Check, Building2, X, Lock, Unlock, Loader2, Plus, Sun, Moon,
  Layers, IndianRupee, LayoutGrid, Trash2, Pencil, Clock, Search, User, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';
import socket from '../../lib/socket';

// ── Helpers ───────────────────────────────────────────────────────────────────
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const addDays = (dateStr, n) => { const d = new Date(dateStr); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

const DAYS = [
  { label: 'Su', val: 0 }, { label: 'Mo', val: 1 }, { label: 'Tu', val: 2 },
  { label: 'We', val: 3 }, { label: 'Th', val: 4 }, { label: 'Fr', val: 5 }, { label: 'Sa', val: 6 },
];
const QUICK_DURATIONS = [30, 45, 60, 90, 120, 180];

const isSlotAvailable = (s) => s.isBookable && s.status !== 'full' && s.status !== 'maintenance' && s.currentBookings < s.capacity;

const slotBg = (s) => {
  if (!s.isBookable || s.status === 'maintenance') return 'bg-amber-50 border-amber-200 text-amber-700';
  if (s.status === 'full' || s.currentBookings >= s.capacity) return 'bg-red-50 border-red-200 text-red-700';
  return 'bg-green-50 border-green-200 text-green-700';
};
const slotLabel = (s) => {
  if (!s.isBookable || s.status === 'maintenance') return 'Closed';
  if (s.status === 'full' || s.currentBookings >= s.capacity) return 'Booked';
  return 'Available';
};

// ── Court Detail Panel (floating right-side sheet) ────────────────────────────
function CourtDetailPanel({ group, sport, date, onClose, onManualPayment, onToggleCourt, onDeleteCourt, onDeleteSlot, onSaved, onOpenBulk }) {
  const { court, slots } = group;
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [createForm, setCreateForm] = useState({ startTime: '', endTime: '', pricePerSlot: '' });
  const [creating, setCreating] = useState(false);

  const openEdit = (s) => {
    setShowCreateSlot(false);
    setEditingSlotId(s._id);
    setEditForm({ startTime: s.startTime, endTime: s.endTime, pricePerSlot: s.pricePerSlot });
  };

  const saveEdit = async (slotId) => {
    setSaving(true);
    try {
      const [sh, sm] = editForm.startTime.split(':').map(Number);
      const [eh, em] = editForm.endTime.split(':').map(Number);
      const duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration <= 0) { toast.error('End time must be after start time.'); setSaving(false); return; }
      await api.put(`/slots/${slotId}`, {
        startTime: editForm.startTime,
        endTime: editForm.endTime,
        duration,
        pricePerSlot: parseFloat(editForm.pricePerSlot) || 0,
      });
      toast.success('Slot updated.');
      setEditingSlotId(null);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally { setSaving(false); }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!createForm.startTime || !createForm.endTime) return toast.error('Start and end time required.');
    const [sh, sm] = createForm.startTime.split(':').map(Number);
    const [eh, em] = createForm.endTime.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    if (duration <= 0) return toast.error('End time must be after start time.');
    setCreating(true);
    try {
      // Reuse bulk endpoint for a single slot on one court/date
      await api.post('/slots/admin/bulk', {
        sportId: sport._id,
        courtIds: [court._id],
        startDateStr: date,
        endDateStr: date,
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        slotStartTime: createForm.startTime,
        slotEndTime: createForm.endTime,
        slotDurationMin: duration,
        gapBetweenMin: 0,
        priceMode: 'flat',
        flatPrice: parseFloat(createForm.pricePerSlot) || 0,
      });
      toast.success(`Slot ${createForm.startTime}–${createForm.endTime} created.`);
      setCreateForm({ startTime: '', endTime: '', pricePerSlot: '' });
      setShowCreateSlot(false);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Create failed.');
    } finally { setCreating(false); }
  };

  const available = slots.filter(isSlotAvailable).length;
  const booked = slots.filter((s) => !isSlotAvailable(s) && s.status !== 'maintenance').length;
  const maintenance = slots.filter((s) => s.status === 'maintenance').length;

  return (
    <>
      {/* Backdrop */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose} />

      {/* Centered modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col pointer-events-auto"
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 py-4 border-b border-[#EAEAEA] shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <Building2 size={16} className={court.isOpen ? 'text-green-600' : 'text-gray-400'} />
                <h3 className="font-bold text-[#111] text-base">{court.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${court.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {court.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              <p className="text-xs text-[#999] mt-0.5">
                {sport?.name} · {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
              <div className="flex gap-3 mt-1.5 text-[11px] font-semibold">
                <span className="text-green-700">{available} available</span>
                <span className="text-red-600">{booked} booked</span>
                {maintenance > 0 && <span className="text-amber-600">{maintenance} maintenance</span>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => { setShowCreateSlot((v) => !v); setEditingSlotId(null); }}
                title="Create single slot"
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${showCreateSlot ? 'bg-[#C8102E] border-[#C8102E] text-white' : 'border-[#EAEAEA] text-[#555] hover:bg-[#F5F5F5]'}`}>
                <Plus size={14} />
              </button>
              <button onClick={() => onOpenBulk?.(court._id)}
                title="Bulk create slots"
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#EAEAEA] text-[#555] hover:bg-[#F5F5F5] transition-colors">
                <Layers size={14} />
              </button>
              <button onClick={() => onToggleCourt(court)} title={court.isOpen ? 'Close court' : 'Open court'}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${court.isOpen ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                {court.isOpen ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
              <button onClick={() => onDeleteCourt(court)} title="Delete court"
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#EAEAEA] text-[#999] hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors">
                <Trash2 size={14} />
              </button>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F5F5] text-[#666]"><X size={16} /></button>
            </div>
          </div>

          {/* Create slot inline form */}
          <AnimatePresence>
            {showCreateSlot && (
              <motion.form
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22 }}
                onSubmit={handleCreateSlot}
                className="overflow-hidden border-b border-[#EAEAEA] shrink-0"
              >
                <div className="px-5 py-4 bg-[#FAFAFA] space-y-3">
                  <p className="text-xs font-bold text-[#333]">Create new slot for this date</p>
                  <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[11px]">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <span>This creates a slot for <strong>this date only</strong>. Use the <strong>Bulk Create</strong> (<span className="font-mono">⧉</span>) button for daily/weekly recurring slots.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-[#999] block mb-0.5">Start time</label>
                      <input type="time" value={createForm.startTime}
                        onChange={(e) => setCreateForm((p) => ({ ...p, startTime: e.target.value }))}
                        className="w-full border border-[#EAEAEA] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 bg-white" />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#999] block mb-0.5">End time</label>
                      <input type="time" value={createForm.endTime}
                        onChange={(e) => setCreateForm((p) => ({ ...p, endTime: e.target.value }))}
                        className="w-full border border-[#EAEAEA] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#999] block mb-0.5">Price per slot (₹)</label>
                    <input type="number" min={0} value={createForm.pricePerSlot}
                      onChange={(e) => setCreateForm((p) => ({ ...p, pricePerSlot: e.target.value }))}
                      placeholder="e.g. 500"
                      className="w-full border border-[#EAEAEA] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 bg-white" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowCreateSlot(false)}
                      className="flex-1 py-2 rounded-xl border border-[#EAEAEA] text-[11px] font-medium text-[#666] hover:bg-[#F0F0F0]">Cancel</button>
                    <button type="submit" disabled={creating}
                      className="flex-1 py-2 rounded-xl bg-[#C8102E] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#a50d27] disabled:opacity-60">
                      {creating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Create Slot
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Slot list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {slots.length === 0 ? (
              <div className="text-center py-12 text-sm text-[#999]">
                <Clock size={28} className="mx-auto mb-2 text-[#DDD]" />
                No slots for this date.
                <div className="mt-3 flex items-center gap-3 justify-center">
                  <button onClick={() => setShowCreateSlot(true)}
                    className="flex items-center gap-1.5 text-[#C8102E] text-xs font-semibold hover:underline">
                    <Plus size={12} /> Create first slot
                  </button>
                  <span className="text-[#DDD]">·</span>
                  <button onClick={() => onOpenBulk?.(court._id)}
                    className="flex items-center gap-1.5 text-[#555] text-xs font-semibold hover:text-[#C8102E] hover:underline">
                    <Layers size={12} /> Bulk Create
                  </button>
                </div>
              </div>
            ) : (
              slots.map((s) => (
                <div key={s._id} className={`rounded-xl border p-3 transition-all ${slotBg(s)}`}>
                  {editingSlotId === s._id ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-current/60 block mb-0.5">Start time</label>
                          <input type="time" value={editForm.startTime}
                            onChange={(e) => setEditForm((p) => ({ ...p, startTime: e.target.value }))}
                            className="w-full bg-white/80 border border-current/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-[10px] text-current/60 block mb-0.5">End time</label>
                          <input type="time" value={editForm.endTime}
                            onChange={(e) => setEditForm((p) => ({ ...p, endTime: e.target.value }))}
                            className="w-full bg-white/80 border border-current/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-current/60 block mb-0.5">Price per slot (₹)</label>
                        <input type="number" min={0} value={editForm.pricePerSlot}
                          onChange={(e) => setEditForm((p) => ({ ...p, pricePerSlot: e.target.value }))}
                          className="w-full bg-white/80 border border-current/20 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setEditingSlotId(null)}
                          className="flex-1 py-1.5 rounded-lg border border-current/20 text-[11px] font-medium hover:bg-white/50">Cancel</button>
                        <button onClick={() => saveEdit(s._id)} disabled={saving}
                          className="flex-1 py-1.5 rounded-lg bg-white/80 border border-current/30 text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-white disabled:opacity-60">
                          {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-[13px]">{s.startTime}–{s.endTime}</p>
                          <p className="text-[11px] opacity-70">{s.duration}min · ₹{s.pricePerSlot}
                            {s.priceLabel && <span className="ml-1 uppercase font-semibold text-[9px]">({s.priceLabel})</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold">{slotLabel(s)}</span>
                          <button onClick={() => openEdit(s)} title="Edit"
                            className="w-6 h-6 flex items-center justify-center rounded-md border border-current/20 hover:bg-white/60 transition-colors">
                            <Pencil size={10} />
                          </button>
                          <button onClick={() => onDeleteSlot(s)} title="Delete"
                            className="w-6 h-6 flex items-center justify-center rounded-md border border-current/20 hover:bg-red-100 hover:text-red-600 hover:border-red-300 transition-colors">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                      {s.bookings?.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-current/15 space-y-1">
                          {s.bookings.map((b) => (
                            <div key={b._id} className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold">{b.playerName}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="opacity-60">{b.playerPhone}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  b.paymentStatus === 'paid' ? 'bg-green-200 text-green-800' : b.paymentStatus === 'partial' ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'
                                }`}>{b.paymentStatus}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {isSlotAvailable(s) && (
                        <button onClick={() => onManualPayment(s)}
                          className="mt-2 w-full text-[11px] font-semibold py-1.5 rounded-lg border border-current/25 hover:bg-white/50 flex items-center justify-center gap-1 transition-colors">
                          <Plus size={11} /> Manual Payment
                        </button>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ── Court Card (shown in the grid) ────────────────────────────────────────────
function CourtCard({ group, onClick }) {
  const { court, slots } = group;
  const available = slots.filter(isSlotAvailable).length;
  const booked = slots.filter((s) => !isSlotAvailable(s) && s.status !== 'maintenance' && (s.status === 'full' || s.currentBookings >= s.capacity)).length;
  const maintenance = slots.filter((s) => s.status === 'maintenance' || !s.isBookable).length;

  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onClick}
      className={`rounded-2xl border p-4 text-left w-full transition-all hover:shadow-md ${court.isOpen ? 'bg-white border-[#EAEAEA]' : 'bg-gray-50 border-gray-200 opacity-75'}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${court.isOpen ? 'bg-green-50' : 'bg-gray-100'}`}>
            <Building2 size={16} className={court.isOpen ? 'text-green-600' : 'text-gray-400'} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#111] leading-tight">{court.name}</p>
            <p className="text-[10px] text-[#999]">{slots.length} slot{slots.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${court.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
          {court.isOpen ? 'Open' : 'Closed'}
        </span>
      </div>
      <div className="flex gap-2 text-[11px]">
        <span className="flex-1 bg-green-50 text-green-700 font-bold rounded-lg py-1 text-center">{available}<br /><span className="text-[9px] font-normal opacity-70">Free</span></span>
        <span className="flex-1 bg-red-50 text-red-600 font-bold rounded-lg py-1 text-center">{booked}<br /><span className="text-[9px] font-normal opacity-70">Booked</span></span>
        {maintenance > 0 && <span className="flex-1 bg-amber-50 text-amber-600 font-bold rounded-lg py-1 text-center">{maintenance}<br /><span className="text-[9px] font-normal opacity-70">Closed</span></span>}
      </div>
      <p className="text-[10px] text-[#999] mt-2 text-right">Tap to manage →</p>
    </motion.button>
  );
}

// ── Add Court Modal ────────────────────────────────────────────────────────────
function AddCourtModal({ sport, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Court name is required.');
    setSaving(true);
    try {
      const { data } = await api.post('/courts', { sportId: sport._id, sportSlug: sport.slug, name: name.trim() });
      toast.success(`Court "${data.court.name}" created.`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create court.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAEAEA]">
          <div>
            <h3 className="font-bold text-[#111] text-base">Add Court / Facility</h3>
            <p className="text-xs text-[#999] mt-0.5">{sport?.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F5F5] text-[#666]"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-[#666] block mb-1">Court Name *</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Badminton Court 1"
              className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#EAEAEA] text-sm font-medium text-[#666] hover:bg-[#F5F5F5]">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#a50d27] disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add Court
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Bulk Slot Modal ────────────────────────────────────────────────────────────
function BulkSlotModal({ sport, courts, onClose, onSuccess, initialCourtIds }) {
  const [form, setForm] = useState({
    courtIds: initialCourtIds ?? courts.filter((c) => c.isOpen).map((c) => c._id),
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    slotStartTime: sport?.dayStartTime || '06:00',
    slotEndTime: sport?.nightEndTime || '22:00',
    slotDurationMin: 60,
    gapBetweenMin: 0,
    priceMode: sport?.slotPricingMode === 'dayNight' ? 'dayNight' : 'flat',
    flatPrice: String(sport?.hourlyPrice || sport?.daySlotPrice || ''),
    dayPrice: String(sport?.daySlotPrice || sport?.hourlyPrice || ''),
    nightPrice: String(sport?.nightSlotPrice || sport?.hourlyPrice || ''),
    dayStartTime: sport?.dayStartTime || '06:00',
    dayEndTime: sport?.nightStartTime || '18:00',
    nightStartTime: sport?.nightStartTime || '18:00',
    nightEndTime: sport?.nightEndTime || '22:00',
  });
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState(null);
  const [submitMeta, setSubmitMeta] = useState({ slotsPerDay: 0, courts: 0 });
  const [customSlots, setCustomSlots] = useState([]); // [{ startTime, endTime, price }]

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const toggleDay = (val) => setForm((p) => ({ ...p, weekdays: p.weekdays.includes(val) ? p.weekdays.filter((d) => d !== val) : [...p.weekdays, val] }));
  const toggleCourt = (id) => setForm((p) => ({ ...p, courtIds: p.courtIds.includes(id) ? p.courtIds.filter((c) => c !== id) : [...p.courtIds, id] }));

  const addCustomSlot = () => setCustomSlots((p) => [...p, { startTime: '', endTime: '', price: '' }]);
  const removeCustomSlot = (i) => setCustomSlots((p) => p.filter((_, idx) => idx !== i));
  const setCustomSlot = (i, k, v) => setCustomSlots((p) => p.map((cs, idx) => idx === i ? { ...cs, [k]: v } : cs));

  const customSlotDuration = (cs) => {
    if (!cs.startTime || !cs.endTime) return null;
    const [sh, sm] = cs.startTime.split(':').map(Number);
    const [eh, em] = cs.endTime.split(':').map(Number);
    const d = (eh * 60 + em) - (sh * 60 + sm);
    return d > 0 ? d : null;
  };

  // Slots per day estimate (single day)
  const slotsPerDay = (() => {
    if (form.priceMode === 'dayNight') return 2; // always 1 day + 1 night slot
    try {
      const [sh, sm] = form.slotStartTime.split(':').map(Number);
      const [eh, em] = form.slotEndTime.split(':').map(Number);
      const dur = Number(form.slotDurationMin) || 60;
      const gap = Number(form.gapBetweenMin) || 0;
      const mins = eh * 60 + em - (sh * 60 + sm);
      if (mins <= 0 || dur <= 0) return 0;
      return Math.floor(mins / (dur + gap));
    } catch { return 0; }
  })();

  const handleClearSlots = async () => {
    if (!form.courtIds.length) return toast.error('Select at least one court.');
    if (!window.confirm(`Delete ALL slots for the selected courts across all future dates? This cannot be undone.`)) return;
    setClearing(true);
    try {
      const startDateStr = todayStr();
      const endDateStr = addDays(startDateStr, 364);
      const { data } = await api.delete('/slots/admin/bulk', {
        data: { sportId: sport._id, courtIds: form.courtIds, startDateStr, endDateStr },
      });
      toast.success(`Cleared ${data.deletedCount} slot(s).`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Clear failed.');
    } finally { setClearing(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.courtIds.length) return toast.error('Select at least one court.');
    if (!form.weekdays.length) return toast.error('Select at least one day.');
    const dur = form.priceMode === 'dayNight' ? 0 : Number(form.slotDurationMin);
    if (form.priceMode !== 'dayNight' && (!dur || dur <= 0)) return toast.error('Duration must be > 0.');
    setSaving(true);
    try {
      // Create for next 365 days — slots are always present until deleted
      const startDateStr = todayStr();
      const endDateStr = addDays(startDateStr, 364);
      const { data } = await api.post('/slots/admin/bulk', {
        sportId: sport._id,
        courtIds: form.courtIds,
        startDateStr,
        endDateStr,
        weekdays: form.weekdays,
        slotStartTime: form.priceMode === 'dayNight' ? form.dayStartTime : form.slotStartTime,
        slotEndTime: form.priceMode === 'dayNight' ? form.nightEndTime : form.slotEndTime,
        ...(form.priceMode === 'dayNight' ? { nightStartTime: form.nightStartTime } : {}),
        slotDurationMin: dur,
        gapBetweenMin: Number(form.gapBetweenMin) || 0,
        priceMode: form.priceMode,
        ...(form.priceMode === 'flat'
          ? { flatPrice: parseFloat(form.flatPrice) || 0 }
          : { dayPrice: parseFloat(form.dayPrice) || 0, nightPrice: parseFloat(form.nightPrice) || 0, nightCutoffTime: form.dayEndTime, nightStartTime: form.nightStartTime }),
        customSlots: customSlots.filter((cs) => cs.startTime && cs.endTime && customSlotDuration(cs) > 0).map((cs) => ({
          startTime: cs.startTime,
          endTime: cs.endTime,
          price: cs.price !== '' ? parseFloat(cs.price) : undefined,
        })),
      });
      setSubmitMeta({ slotsPerDay: slotsPerDay + customSlots.filter(cs => cs.startTime && cs.endTime && customSlotDuration(cs) > 0).length, courts: form.courtIds.length });
      setResult(data);
      toast.success(`Slots created successfully.`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk creation failed.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-4">

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAEAEA]">
          <div>
            <h3 className="font-bold text-[#111] text-base flex items-center gap-2">
              <Layers size={16} className="text-[#C8102E]" /> Bulk Create Slots
            </h3>
            <p className="text-xs text-[#999] mt-0.5">{sport?.name} · slots created for next 365 days</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F5F5] text-[#666]"><X size={16} /></button>
        </div>

        {result ? (
          <div className="p-6 space-y-4">
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-3">
                <Check size={26} className="text-green-600" />
              </div>
              <h4 className="font-bold text-[#111] text-lg">Done!</h4>
              <p className="text-sm text-[#555] mt-1">
                <span className="font-bold text-green-700">{submitMeta.slotsPerDay} slot{submitMeta.slotsPerDay !== 1 ? 's' : ''}/day</span>
                {submitMeta.courts > 1 && <span className="text-[#999]"> × {submitMeta.courts} courts</span>}
                <span className="text-[#999]"> · every day for 365 days</span>
              </p>
              {result.skippedDuplicates > 0 && (
                <p className="text-xs text-amber-600 mt-1">{result.skippedDuplicates} already existed and were skipped</p>
              )}
            </div>
            {result.skippedClosedCourts > 0 && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5 text-xs text-gray-500 text-center">
                {result.skippedClosedCourts} closed court{result.skippedClosedCourts !== 1 ? 's' : ''} skipped
              </div>
            )}
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#a50d27]">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">

            {/* Courts */}
            <div>
              <label className="text-xs font-bold text-[#333] flex items-center gap-1.5 mb-2">
                <Building2 size={13} className="text-[#C8102E]" /> Courts ({form.courtIds.length}/{courts.length} selected)
              </label>
              {courts.length === 0 ? (
                <p className="text-xs text-[#999]">No courts. Add courts first.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setForm((p) => ({ ...p, courtIds: courts.map((c) => c._id) }))}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-[#EAEAEA] hover:bg-[#F5F5F5] text-[#666]">All</button>
                  <button type="button" onClick={() => setForm((p) => ({ ...p, courtIds: [] }))}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-[#EAEAEA] hover:bg-[#F5F5F5] text-[#666]">None</button>
                  {courts.map((c) => (
                    <button key={c._id} type="button" onClick={() => toggleCourt(c._id)}
                      className={`text-[11px] px-3 py-1 rounded-full border font-medium transition-colors ${form.courtIds.includes(c._id) ? 'bg-[#C8102E] border-[#C8102E] text-white' : 'border-[#EAEAEA] text-[#555] hover:border-[#C8102E]/40'} ${!c.isOpen ? 'opacity-50' : ''}`}>
                      {c.name}{!c.isOpen ? ' (closed)' : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Weekdays */}
            <div>
              <label className="text-xs font-bold text-[#333] block mb-2">Repeat on days</label>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map((d) => (
                  <button key={d.val} type="button" onClick={() => toggleDay(d.val)}
                    className={`w-9 h-9 rounded-full text-xs font-bold border transition-colors ${form.weekdays.includes(d.val) ? 'bg-[#C8102E] border-[#C8102E] text-white' : 'border-[#EAEAEA] text-[#666] hover:border-[#C8102E]/40'}`}>
                    {d.label}
                  </button>
                ))}
                <button type="button" onClick={() => setForm((p) => ({ ...p, weekdays: DAYS.map((d) => d.val) }))}
                  className="px-3 h-9 rounded-full text-[11px] border border-[#EAEAEA] text-[#666] hover:bg-[#F5F5F5]">All</button>
                <button type="button" onClick={() => setForm((p) => ({ ...p, weekdays: [1, 2, 3, 4, 5] }))}
                  className="px-3 h-9 rounded-full text-[11px] border border-[#EAEAEA] text-[#666] hover:bg-[#F5F5F5]">Weekdays</button>
              </div>
            </div>

            {/* Time window — only shown for flat mode; dayNight has its own time fields below */}
            {form.priceMode !== 'dayNight' && (
            <div>
              <label className="text-xs font-bold text-[#333] flex items-center gap-1.5 mb-2">Time Window & Slot Duration</label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[11px] text-[#999] mb-1 block">Window starts</label>
                  <input type="time" value={form.slotStartTime} onChange={(e) => set('slotStartTime', e.target.value)}
                    className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
                </div>
                <div>
                  <label className="text-[11px] text-[#999] mb-1 block">Window ends</label>
                  <input type="time" value={form.slotEndTime} onChange={(e) => set('slotEndTime', e.target.value)}
                    className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
                </div>
              </div>

              <label className="text-[11px] text-[#999] mb-1.5 block">Slot duration (min)</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {QUICK_DURATIONS.map((d) => (
                  <button key={d} type="button" onClick={() => set('slotDurationMin', d)}
                    className={`px-3 h-8 rounded-full text-xs font-bold border transition-colors ${form.slotDurationMin === d ? 'bg-[#C8102E] border-[#C8102E] text-white' : 'border-[#EAEAEA] text-[#666] hover:border-[#C8102E]/40'}`}>
                    {d < 60 ? `${d}m` : `${d / 60}hr${d > 60 ? 's' : ''}`}
                  </button>
                ))}
              </div>
              <input type="number" min={5} step={5}
                placeholder="Or type any duration (e.g. 45, 75, 150…)"
                value={QUICK_DURATIONS.includes(form.slotDurationMin) ? '' : form.slotDurationMin || ''}
                onChange={(e) => set('slotDurationMin', Number(e.target.value) || '')}
                onFocus={() => { if (QUICK_DURATIONS.includes(form.slotDurationMin)) set('slotDurationMin', ''); }}
                className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />

              <div className="mt-3">
                <label className="text-[11px] text-[#999] mb-1 block">Gap between slots</label>
                <select value={form.gapBetweenMin} onChange={(e) => set('gapBetweenMin', Number(e.target.value))}
                  className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20">
                  <option value={0}>No gap</option>
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                </select>
              </div>
            </div>
            )}

            {/* Pricing */}
            <div>
              <label className="text-xs font-bold text-[#333] flex items-center gap-1.5 mb-2">
                <IndianRupee size={13} className="text-[#C8102E]" /> Slot Pricing
              </label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => set('priceMode', 'flat')}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-colors ${form.priceMode === 'flat' ? 'bg-[#C8102E] border-[#C8102E] text-white' : 'border-[#EAEAEA] text-[#666]'}`}>
                  <Layers size={13} /> Flat — one price
                </button>
                <button type="button" onClick={() => set('priceMode', 'dayNight')}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-colors ${form.priceMode === 'dayNight' ? 'bg-[#C8102E] border-[#C8102E] text-white' : 'border-[#EAEAEA] text-[#666]'}`}>
                  <Moon size={13} /> Day / Night
                </button>
              </div>
              {form.priceMode === 'flat' ? (
                <div>
                  <label className="text-[11px] text-[#999] mb-1 block">Price per slot (₹)</label>
                  <input type="number" min={0} value={form.flatPrice} onChange={(e) => set('flatPrice', e.target.value)} placeholder="e.g. 500"
                    className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Day row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-[#999] mb-1 flex items-center gap-1"><Sun size={11} /> Day (₹)</label>
                      <input type="number" min={0} value={form.dayPrice} onChange={(e) => set('dayPrice', e.target.value)} placeholder="e.g. 500"
                        className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#999] mb-1 block">Start time</label>
                      <input type="time" value={form.dayStartTime} onChange={(e) => set('dayStartTime', e.target.value)}
                        className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#999] mb-1 block">End time</label>
                      <input type="time" value={form.dayEndTime} onChange={(e) => set('dayEndTime', e.target.value)}
                        className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
                    </div>
                  </div>
                  {/* Night row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-[#999] mb-1 flex items-center gap-1"><Moon size={11} /> Night (₹)</label>
                      <input type="number" min={0} value={form.nightPrice} onChange={(e) => set('nightPrice', e.target.value)} placeholder="e.g. 700"
                        className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#999] mb-1 block">Start time</label>
                      <input type="time" value={form.nightStartTime} onChange={(e) => set('nightStartTime', e.target.value)}
                        className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#999] mb-1 block">End time</label>
                      <input type="time" value={form.nightEndTime} onChange={(e) => set('nightEndTime', e.target.value)}
                        className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Custom Slot Overrides */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#333] flex items-center gap-1.5">
                  <Clock size={13} className="text-[#C8102E]" /> Custom Slot Overrides
                  <span className="font-normal text-[#999]">— different duration for specific windows</span>
                </label>
                <button type="button" onClick={addCustomSlot}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#C8102E] hover:underline">
                  <Plus size={11} /> Add
                </button>
              </div>
              {customSlots.length === 0 ? (
                <p className="text-[11px] text-[#BBB] italic">
                  e.g. add 17:00–19:00 to create a 2hr slot instead of two 1hr slots in that window
                </p>
              ) : (
                <div className="space-y-2">
                  {customSlots.map((cs, i) => {
                    const dur = customSlotDuration(cs);
                    return (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl border border-[#EAEAEA] bg-[#FAFAFA]">
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <input type="time" value={cs.startTime} onChange={(e) => setCustomSlot(i, 'startTime', e.target.value)}
                            className="flex-1 border border-[#EAEAEA] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
                          <span className="text-[#999] text-xs shrink-0">to</span>
                          <input type="time" value={cs.endTime} onChange={(e) => setCustomSlot(i, 'endTime', e.target.value)}
                            className="flex-1 border border-[#EAEAEA] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
                        </div>
                        {dur && (
                          <span className="text-[10px] font-bold text-[#C8102E] bg-red-50 px-2 py-1 rounded-full shrink-0">
                            {dur >= 60 ? `${dur / 60 % 1 === 0 ? dur / 60 : (dur / 60).toFixed(1)}hr` : `${dur}m`}
                          </span>
                        )}
                        <input type="number" min={0} value={cs.price} onChange={(e) => setCustomSlot(i, 'price', e.target.value)}
                          placeholder="₹ price"
                          className="w-20 border border-[#EAEAEA] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
                        <button type="button" onClick={() => removeCustomSlot(i)}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-[#BBB] hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-[#999] pt-0.5">Auto-generated slots that overlap with these windows will be replaced. Leave price blank to inherit bulk pricing.</p>
                </div>
              )}
            </div>

            {/* Preview */}
            {slotsPerDay > 0 && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                <LayoutGrid size={14} />
                ~<strong>{slotsPerDay} slot{slotsPerDay !== 1 ? 's' : ''}/day</strong> per court · {form.courtIds.length} court{form.courtIds.length !== 1 ? 's' : ''} · 365 days
                <span className="text-blue-500 text-xs">(skips duplicates)</span>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={handleClearSlots} disabled={clearing || saving}
                className="py-2.5 px-4 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 flex items-center gap-2 shrink-0">
                {clearing ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                {clearing ? 'Clearing…' : 'Clear All'}
              </button>
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#EAEAEA] text-sm font-medium text-[#666] hover:bg-[#F5F5F5]">Cancel</button>
              <button type="submit" disabled={saving || clearing || !form.courtIds.length || !form.weekdays.length}
                className="flex-1 py-2.5 rounded-xl bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#a50d27] disabled:opacity-60 flex items-center justify-center gap-2">
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
                {saving ? 'Creating…' : 'Create Slots'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// ── Manual Payment Modal ──────────────────────────────────────────────────────
function ManualPaymentModal({ slot, onClose, onSuccess }) {
  const [form, setForm] = useState({
    playerName: '', playerPhone: '', playerEmail: '',
    amountPaid: slot?.pricePerSlot || '', paymentMode: 'cash',
    isReference: false, referenceNote: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // User search state
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [userSearching, setUserSearching] = useState(false);
  const [linkedUser, setLinkedUser] = useState(null); // { _id, name, email, phone }
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Debounced user search
  useEffect(() => {
    if (userQuery.length < 2) { setUserResults([]); setShowDropdown(false); return; }
    const t = setTimeout(async () => {
      setUserSearching(true);
      try {
        const { data } = await api.get('/super-admin/user-search', { params: { q: userQuery } });
        setUserResults(data.users || []);
        setShowDropdown(true);
      } catch { /* silent */ } finally { setUserSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [userQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectUser = (u) => {
    setLinkedUser(u);
    setForm((p) => ({ ...p, playerName: u.name || p.playerName, playerPhone: u.phone || p.playerPhone, playerEmail: u.email || p.playerEmail }));
    setUserQuery('');
    setUserResults([]);
    setShowDropdown(false);
  };

  const clearLinkedUser = () => { setLinkedUser(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.playerName || !form.playerPhone) return toast.error('Name and phone are required.');
    if (form.isReference && !linkedUser) {
      const confirmed = window.confirm(
        'No user account linked. Reference price will NOT be saved for online bookings.\n\nProceed anyway?'
      );
      if (!confirmed) return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/slots/admin/manual-booking', {
        slotId: slot._id,
        playerName: form.playerName, playerPhone: form.playerPhone, playerEmail: form.playerEmail,
        amountPaid: parseFloat(form.amountPaid) || 0,
        paymentMode: form.paymentMode, isReference: form.isReference,
        referenceNote: form.referenceNote, notes: form.notes,
        customerUserId: linkedUser?._id || undefined,
      });

      if (data.referencePriceCreated) {
        toast.success(`Booking created (${data.booking.bookingId}) — reference price ₹${parseFloat(form.amountPaid)} saved for ${data.matchedUserName || 'user'}`);
      } else if (data.referencePriceWarning) {
        toast.success(`Booking created — ${data.booking.bookingId}`);
        toast.warning(data.referencePriceWarning, { duration: 6000 });
      } else {
        toast.success(`Booking created — ${data.booking.bookingId}`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setSubmitting(false); }
  };

  const remaining = Math.max(0, (slot?.pricePerSlot || 0) - (parseFloat(form.amountPaid) || 0));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[96vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EAEAEA]">
          <div>
            <h3 className="font-bold text-[#111] text-base">Manual Payment Entry</h3>
            <p className="text-xs text-[#999] mt-0.5">{slot?.courtNameSnapshot} · {slot?.startTime}–{slot?.endTime}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F5F5] text-[#666]"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* User account search */}
          <div ref={searchRef}>
            <label className="text-xs font-medium text-[#666] block mb-1">
              Link to User Account <span className="text-[#999] font-normal">(search by name / phone / email)</span>
            </label>
            {linkedUser ? (
              <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-green-50 border border-green-200">
                <div className="flex items-center gap-2">
                  <User size={14} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">{linkedUser.name}</p>
                    <p className="text-[11px] text-green-600">{linkedUser.email} · {linkedUser.phone}</p>
                  </div>
                </div>
                <button type="button" onClick={clearLinkedUser} className="text-green-600 hover:text-red-500 ml-2">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-[#AAA]" />
                <input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  onFocus={() => userResults.length > 0 && setShowDropdown(true)}
                  placeholder="Type to search registered users…"
                  className="w-full border border-[#EAEAEA] rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20"
                />
                {userSearching && <Loader2 size={12} className="absolute right-3 top-2.5 animate-spin text-[#AAA]" />}
                {showDropdown && userResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-[#EAEAEA] rounded-xl shadow-lg overflow-hidden">
                    {userResults.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => selectUser(u)}
                        className="w-full px-3 py-2.5 text-left hover:bg-[#F9F9F9] flex items-center gap-2 border-b border-[#F5F5F5] last:border-0"
                      >
                        <User size={13} className="text-[#AAA] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111] truncate">{u.name}</p>
                          <p className="text-[11px] text-[#888] truncate">{u.email} · {u.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && !userSearching && userQuery.length >= 2 && userResults.length === 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-[#EAEAEA] rounded-xl shadow-lg px-3 py-2 text-sm text-[#888]">
                    No registered users found
                  </div>
                )}
              </div>
            )}
            {form.isReference && !linkedUser && (
              <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={11} /> Reference price won't be saved — no user account linked
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#666] block mb-1">Name *</label>
              <input value={form.playerName} onChange={(e) => set('playerName', e.target.value)} placeholder="Customer name"
                className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
            </div>
            <div>
              <label className="text-xs font-medium text-[#666] block mb-1">Phone *</label>
              <input value={form.playerPhone} onChange={(e) => set('playerPhone', e.target.value)} placeholder="10-digit phone"
                className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#666] block mb-1">Email (optional)</label>
            <input value={form.playerEmail} onChange={(e) => set('playerEmail', e.target.value)} placeholder="customer@email.com"
              className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[#666] block mb-1">Amount Paid (₹)</label>
              <input type="number" value={form.amountPaid} onChange={(e) => set('amountPaid', e.target.value)}
                placeholder={String(slot?.pricePerSlot || '')}
                className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
              <p className="text-[10px] text-[#999] mt-0.5">Slot price: ₹{slot?.pricePerSlot}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[#666] block mb-1">Mode</label>
              <select value={form.paymentMode} onChange={(e) => set('paymentMode', e.target.value)}
                className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20">
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank-transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
          {remaining > 0 && (
            <div className={`rounded-lg px-3 py-2 text-sm flex items-center gap-2 ${form.isReference ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
              <AlertTriangle size={14} />
              {form.isReference ? `₹${remaining} will be waived` : `₹${remaining} will remain as pending`}
            </div>
          )}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={form.isReference} onChange={(e) => set('isReference', e.target.checked)} className="w-4 h-4 rounded accent-[#C8102E]" />
            <span className="text-sm text-[#333]">Reference booking (waive remaining)</span>
          </label>
          {form.isReference && linkedUser && (
            <div className="rounded-lg px-3 py-2 bg-yellow-50 border border-yellow-200 flex items-center gap-2 text-xs text-yellow-800">
              <ShieldCheck size={13} className="text-yellow-600 shrink-0" />
              Online reference price of ₹{parseFloat(form.amountPaid) || 0} will be saved for <strong className="ml-1">{linkedUser.name}</strong>
            </div>
          )}
          {form.isReference && (
            <input value={form.referenceNote} onChange={(e) => set('referenceNote', e.target.value)} placeholder="Reference note (e.g. VIP guest)"
              className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
          )}
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Notes (optional)"
            className="w-full border border-[#EAEAEA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20 resize-none" />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#EAEAEA] text-sm font-medium text-[#666] hover:bg-[#F5F5F5]">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#a50d27] disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Confirm
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Sport Overview Card ───────────────────────────────────────────────────────
function SportOverviewCard({ item, selected, onClick }) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      className={`rounded-2xl p-4 text-left w-full transition-all border ${selected ? 'border-[#C8102E] bg-[#C8102E]/5 shadow-lg shadow-[#C8102E]/10' : 'border-[#EAEAEA] bg-white hover:shadow-md'}`}>
      <div className="flex items-center gap-2 mb-3">
        {item.sport.thumbnail ? (
          <img src={item.sport.thumbnail} className="w-8 h-8 rounded-lg object-cover" alt="" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C8102E] to-[#8B0B1E] flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-[#111]">{item.sport.name}</p>
          <p className="text-[10px] text-[#999]">{item.totalCourts} courts</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="bg-green-50 rounded-lg px-2 py-1.5"><p className="font-bold text-green-700">{item.availableSlots}</p><p className="text-green-600/70">Available</p></div>
        <div className="bg-red-50 rounded-lg px-2 py-1.5"><p className="font-bold text-red-700">{item.bookedSlots}</p><p className="text-red-600/70">Booked</p></div>
        {item.closedCourts > 0 && <div className="bg-gray-50 rounded-lg px-2 py-1.5"><p className="font-bold text-gray-500">{item.closedCourts}</p><p className="text-gray-400">Closed</p></div>}
        {item.pendingPayments > 0 && <div className="bg-amber-50 rounded-lg px-2 py-1.5"><p className="font-bold text-amber-700">{item.pendingPayments}</p><p className="text-amber-600/70">Pending ₹</p></div>}
      </div>
      {selected && <div className="mt-2 flex items-center gap-1 text-[#C8102E] text-[10px] font-semibold"><ChevronRight size={12} /> Viewing below</div>}
    </motion.button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LiveSports() {
  const qc = useQueryClient();
  const [date, setDate] = useState(todayStr());
  const [selectedSportId, setSelectedSportId] = useState(null);
  const [openCourtGroup, setOpenCourtGroup] = useState(null); // court detail panel
  const [manualPaymentSlot, setManualPaymentSlot] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCourtPreselect, setBulkCourtPreselect] = useState(null);
  const [showAddCourt, setShowAddCourt] = useState(false);

  const { data: overviewData, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['live-sports-overview', date],
    queryFn: async () => { const { data } = await api.get('/slots/admin/live', { params: { date } }); return data; },
    refetchInterval: 30_000,
  });

  const { data: detailData, isLoading: detailLoading, refetch: refetchDetail } = useQuery({
    queryKey: ['live-sports-detail', selectedSportId, date],
    queryFn: async () => {
      if (!selectedSportId) return null;
      const { data } = await api.get(`/slots/admin/live/${selectedSportId}`, { params: { date } });
      return data;
    },
    enabled: !!selectedSportId,
    refetchInterval: 15_000,
  });

  const { data: courtsData } = useQuery({
    queryKey: ['courts-for-sport', selectedSportId],
    queryFn: async () => { const { data } = await api.get('/courts', { params: { sportId: selectedSportId } }); return data; },
    enabled: !!selectedSportId,
  });
  const courts = courtsData?.courts || [];

  const invalidateAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['live-sports-overview', date] });
    qc.invalidateQueries({ queryKey: ['live-sports-detail', selectedSportId, date] });
    qc.invalidateQueries({ queryKey: ['courts-for-sport', selectedSportId] });
  }, [qc, date, selectedSportId]);

  const toggleCourtMut = useMutation({
    mutationFn: async ({ courtId, statusReason }) => { const { data } = await api.patch(`/courts/${courtId}/toggle`, { statusReason }); return data; },
    onSuccess: (data) => { toast.success(`Court "${data.court.name}" is now ${data.court.isOpen ? 'open' : 'closed'}.`); if (data.warning) toast.warning(data.warning); invalidateAll(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const deleteCourtMut = useMutation({
    mutationFn: async (courtId) => { await api.delete(`/courts/${courtId}`); },
    onSuccess: () => { toast.success('Court deleted.'); setOpenCourtGroup(null); invalidateAll(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const deleteSlotMut = useMutation({
    mutationFn: async (slotId) => { await api.delete(`/slots/${slotId}`); },
    onSuccess: () => { toast.success('Slot deleted.'); invalidateAll(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed.'),
  });

  const handleToggleCourt = (court) => {
    const reason = court.isOpen ? window.prompt('Reason for closing (optional):') : '';
    if (reason === null) return;
    toggleCourtMut.mutate({ courtId: court._id, statusReason: reason || '' });
  };

  const handleDeleteCourt = (court) => {
    if (!window.confirm(`Delete court "${court.name}"? All its slots will be removed.`)) return;
    deleteCourtMut.mutate(court._id);
  };

  const handleDeleteSlot = (slot) => {
    if (!window.confirm(`Delete slot ${slot.startTime}–${slot.endTime}?`)) return;
    deleteSlotMut.mutate(slot._id);
  };

  // Keep openCourtGroup in sync with fresh detail data after invalidation
  useEffect(() => {
    if (!openCourtGroup || !detailData?.courtGroups) return;
    const fresh = detailData.courtGroups.find((g) => g.court._id === openCourtGroup.court._id);
    if (fresh) setOpenCourtGroup(fresh);
  }, [detailData]);

  useEffect(() => {
    const refresh = () => {
      qc.invalidateQueries({ queryKey: ['live-sports-overview', date] });
      if (selectedSportId) qc.invalidateQueries({ queryKey: ['live-sports-detail', selectedSportId, date] });
    };
    socket.on('slot:updated', refresh);
    socket.on('booking:created', refresh);
    socket.on('dashboard:refresh', refresh);
    socket.on('court:updated', refresh);
    return () => { socket.off('slot:updated', refresh); socket.off('booking:created', refresh); socket.off('dashboard:refresh', refresh); socket.off('court:updated', refresh); };
  }, [qc, date, selectedSportId]);

  const changeDate = (delta) => { const d = new Date(date); d.setDate(d.getDate() + delta); setDate(d.toISOString().split('T')[0]); setSelectedSportId(null); setOpenCourtGroup(null); };
  const isToday = date === todayStr();
  const selectedSport = detailData?.sport;

  return (
    <div className="w-full pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#111] flex items-center gap-2"><Zap size={22} className="text-[#C8102E]" /> Live Sports</h1>
          <p className="text-sm text-[#999] mt-0.5">Real-time slot & booking overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)} className="w-8 h-8 rounded-lg border border-[#EAEAEA] flex items-center justify-center hover:bg-[#F5F5F5]"><ChevronLeft size={16} /></button>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSelectedSportId(null); setOpenCourtGroup(null); }}
            className="border border-[#EAEAEA] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20" />
          <button onClick={() => changeDate(1)} className="w-8 h-8 rounded-lg border border-[#EAEAEA] flex items-center justify-center hover:bg-[#F5F5F5]"><ChevronRight size={16} /></button>
          {!isToday && (
            <button onClick={() => { setDate(todayStr()); setSelectedSportId(null); setOpenCourtGroup(null); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#F5F5F5] hover:bg-[#EAEAEA] font-medium text-[#555]">Today</button>
          )}
          <button onClick={() => { refetchOverview(); if (selectedSportId) refetchDetail(); }}
            className="w-8 h-8 rounded-lg border border-[#EAEAEA] flex items-center justify-center hover:bg-[#F5F5F5] text-[#666]">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <section className="mb-6">
        <p className="text-xs font-bold tracking-wider text-[#999] uppercase mb-3">Sports Overview</p>
        {overviewLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="rounded-2xl border border-[#EAEAEA] bg-white animate-pulse h-36" />)}
          </div>
        ) : (overviewData?.overview || []).length === 0 ? (
          <div className="card py-10 text-center text-sm text-[#999]">No sports found.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {(overviewData?.overview || []).map((item) => (
              <SportOverviewCard key={item.sport._id} item={item}
                selected={selectedSportId === item.sport._id}
                onClick={() => { setSelectedSportId(selectedSportId === item.sport._id ? null : item.sport._id); setOpenCourtGroup(null); }} />
            ))}
          </div>
        )}
      </section>

      {/* Sport Detail — Court Cards Grid */}
      <AnimatePresence>
        {selectedSportId && (
          <motion.section key={selectedSportId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="bg-white rounded-2xl border border-[#EAEAEA] overflow-hidden">

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#EAEAEA]">
              <div>
                <h2 className="font-bold text-[#111] text-base flex items-center gap-2">
                  {detailData?.sport?.name || 'Loading…'}
                  {selectedSport?.slotPricingMode === 'dayNight' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                      <Sun size={9} />Day/<Moon size={9} />Night
                    </span>
                  )}
                </h2>
                <p className="text-xs text-[#999] mt-0.5">
                  {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  <span className="ml-2 opacity-60">· click a court to manage slots</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowAddCourt(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EAEAEA] text-xs font-semibold text-[#555] hover:bg-[#F5F5F5] hover:border-[#C8102E]/30">
                  <Building2 size={13} /> Add Court
                </button>
                <button onClick={() => { setBulkCourtPreselect(null); setShowBulkModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C8102E] text-white text-xs font-semibold hover:bg-[#a50d27]">
                  <Zap size={13} /> Bulk Create Slots
                </button>
                <button onClick={() => setSelectedSportId(null)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F5F5F5] text-[#666]"><X size={16} /></button>
              </div>
            </div>

            {detailLoading ? (
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl border border-[#EAEAEA] animate-pulse h-32" />)}
              </div>
            ) : !detailData?.courtGroups?.length ? (
              <div className="p-10 text-center text-sm text-[#999]">
                <Building2 size={28} className="mx-auto mb-2 text-[#DDD]" />
                No courts or slots for this date.
                <div className="mt-3 flex gap-2 justify-center">
                  <button onClick={() => setShowAddCourt(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EAEAEA] text-xs font-semibold text-[#555] hover:bg-[#F5F5F5]">
                    <Plus size={13} /> Add Court
                  </button>
                  <button onClick={() => { if (courts.length) { setBulkCourtPreselect(null); setShowBulkModal(true); } else toast.info('Add a court first.'); }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C8102E] text-white text-xs font-semibold hover:bg-[#a50d27]">
                    <Zap size={13} /> Bulk Create Slots
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {detailData.courtGroups.map((group, i) => (
                  <CourtCard key={group.court._id || i} group={group}
                    onClick={() => setOpenCourtGroup(group)} />
                ))}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Court Detail Panel */}
      <AnimatePresence>
        {openCourtGroup && selectedSport && (
          <CourtDetailPanel
            group={openCourtGroup}
            sport={selectedSport}
            date={date}
            onClose={() => setOpenCourtGroup(null)}
            onManualPayment={(slot) => setManualPaymentSlot(slot)}
            onToggleCourt={handleToggleCourt}
            onDeleteCourt={handleDeleteCourt}
            onDeleteSlot={handleDeleteSlot}
            onSaved={invalidateAll}
            onOpenBulk={(courtId) => { setBulkCourtPreselect(courtId ? [courtId] : null); setShowBulkModal(true); }}
          />
        )}
      </AnimatePresence>

      {/* Manual Payment Modal (z-60 so it floats over the court panel) */}
      <AnimatePresence>
        {manualPaymentSlot && (
          <ManualPaymentModal slot={manualPaymentSlot} onClose={() => setManualPaymentSlot(null)} onSuccess={invalidateAll} />
        )}
        {showBulkModal && selectedSport && (
          <BulkSlotModal sport={selectedSport} courts={courts}
            initialCourtIds={bulkCourtPreselect}
            onClose={() => setShowBulkModal(false)}
            onSuccess={() => { invalidateAll(); setShowBulkModal(false); }} />
        )}
        {showAddCourt && selectedSport && (
          <AddCourtModal sport={selectedSport}
            onClose={() => setShowAddCourt(false)}
            onSuccess={() => { invalidateAll(); setShowAddCourt(false); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
