import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Power,
  Archive,
  X,
  Trophy,
  DollarSign,
  Users,
  Loader2,
  AlertTriangle,
  QrCode,
  RefreshCw,
  Download,
  Settings,
  Tag,
  Dumbbell,
  Trash2,
  Check,
  Ticket,
  ToggleLeft,
  ToggleRight,
  GraduationCap,
} from 'lucide-react';
import api from '../../lib/axios';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import PageHeader from '../../components/shared/PageHeader';

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------
const FILTER_TABS = [
  { key: 'active', label: 'Active' },
  { key: 'archived', label: 'Archived' },
  { key: 'all', label: 'All' },
  { key: 'hero', label: 'Hero Icons' },
  { key: 'discounts', label: 'Discounts' },
  { key: 'coupons', label: 'Coupons' },
  { key: 'kids-academy', label: 'Kids Academy' },
];

// ---------------------------------------------------------------------------
// Skeleton card for loading state
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="skeleton h-7 w-40 rounded" />
          <div className="skeleton h-6 w-16 rounded-full" />
        </div>
        <div className="skeleton h-4 w-56 rounded" />
        <div className="skeleton h-4 w-32 rounded" />
        <div className="flex gap-2 pt-2">
          <div className="skeleton h-9 w-9 rounded-lg" />
          <div className="skeleton h-9 w-9 rounded-lg" />
          <div className="skeleton h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Sports() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('active');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSport, setEditingSport] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // { sportId, action, message, stats }
  const [qrModal, setQrModal] = useState(null); // sport object with qrCodeDataUrl
  const [sessionConfigModal, setSessionConfigModal] = useState(null); // sport object
  const [regenerateConfirm, setRegenerateConfirm] = useState(false);

  // ---- Fetch sports -------------------------------------------------------
  const { data: sports = [], isLoading } = useQuery({
    queryKey: ['sports', filter],
    queryFn: async () => {
      const params =
        filter === 'all'
          ? { includeArchived: true }
          : filter === 'archived'
          ? { includeArchived: true }
          : {};
      const res = await api.get('/sports', { params });
      const list = res.data.sports ?? res.data;
      if (filter === 'archived') return list.filter((s) => !!s.deletedAt);
      if (filter === 'active') return list.filter((s) => !s.deletedAt);
      return list;
    },
  });

  // ---- Create mutation ----------------------------------------------------
  const createMutation = useMutation({
    mutationFn: (payload) => api.post('/sports', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sports'] });
      toast.success('Sport created successfully');
      closeDrawer();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to create sport'),
  });

  // ---- Update mutation ----------------------------------------------------
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/sports/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sports'] });
      toast.success('Sport updated successfully');
      closeDrawer();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || 'Failed to update sport'),
  });

  // ---- Toggle active mutation (optimistic) --------------------------------
  const toggleMutation = useMutation({
    mutationFn: ({ id, forceDeactivate }) =>
      api.patch(`/sports/${id}/toggle`, forceDeactivate ? { forceDeactivate: true } : {}),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ['sports'] });
      const previousQueries = qc.getQueriesData({ queryKey: ['sports'] });
      qc.setQueriesData({ queryKey: ['sports'] }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((s) =>
          s._id === id ? { ...s, active: !s.active } : s
        );
      });
      return { previousQueries };
    },
    onError: (err, variables, context) => {
      // Rollback optimistic update
      context?.previousQueries?.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
      // Check for confirmation-required error
      if (err.response?.status === 409 && err.response?.data?.error === 'CONFIRMATION_REQUIRED') {
        setConfirmModal({
          sportId: variables.id,
          action: 'toggle',
          message: err.response.data.message,
          stats: err.response.data.stats,
        });
        return;
      }
      toast.error(err.response?.data?.message || 'Failed to toggle sport');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sports'] });
      toast.success('Sport status updated');
    },
  });

  // ---- Archive / soft-delete mutation -------------------------------------
  const archiveMutation = useMutation({
    mutationFn: ({ id, forceDeactivate }) =>
      api.delete(`/sports/${id}${forceDeactivate ? '?forceDeactivate=true' : ''}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sports'] });
      toast.success('Sport archived successfully');
    },
    onError: (err, variables) => {
      if (err.response?.status === 409 && err.response?.data?.error === 'CONFIRMATION_REQUIRED') {
        setConfirmModal({
          sportId: variables.id,
          action: 'archive',
          message: err.response.data.message,
          stats: err.response.data.stats,
        });
        return;
      }
      toast.error(err.response?.data?.message || 'Failed to archive sport');
    },
  });

  // ---- Regenerate QR mutation ----------------------------------------------
  const regenerateQRMutation = useMutation({
    mutationFn: (id) => api.post(`/sports/${id}/regenerate-qr`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['sports'] });
      setQrModal(res.data.sport);
      setRegenerateConfirm(false);
      toast.success('QR code regenerated! Old QR codes are now invalid.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to regenerate QR'),
  });

  // ---- Helpers ------------------------------------------------------------
  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => setEditingSport(null), 300);
  }

  function openCreate() {
    setEditingSport(null);
    setDrawerOpen(true);
  }

  function openEdit(sport) {
    setEditingSport(sport);
    setDrawerOpen(true);
  }

  function handleConfirmProceed() {
    if (!confirmModal) return;
    const { sportId, action } = confirmModal;
    if (action === 'toggle') {
      toggleMutation.mutate({ id: sportId, forceDeactivate: true });
    } else if (action === 'archive') {
      archiveMutation.mutate({ id: sportId, forceDeactivate: true });
    }
    setConfirmModal(null);
  }

  // ---- Drawer form submit -------------------------------------------------
  function handleFormSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const file = fd.get('imageFile');
    const hasFile = file && file.size > 0;

    const base = {
      name: fd.get('name'),
      hourlyPrice: fd.get('hourlyPrice') ? Number(fd.get('hourlyPrice')) : null,
      oneMonthPrice: fd.get('price1Month') ? Number(fd.get('price1Month')) : null,
      threeMonthPrice: fd.get('price3Month') ? Number(fd.get('price3Month')) : null,
      sixMonthPrice: fd.get('price6Month') ? Number(fd.get('price6Month')) : null,
      twelveMonthPrice: fd.get('price12Month') ? Number(fd.get('price12Month')) : null,
      active: fd.get('isActive') === 'on',
      thumbnail: fd.get('thumbnail') || '',
      description: fd.get('description') || '',
      tagline: fd.get('tagline') || '',
      rentalEquipment: fd.get('rentalEquipment') || '',
      heroIcon: fd.get('heroIcon') || '',
      // Slot pricing mode
      slotPricingMode: fd.get('slotPricingMode') || 'flat',
      // Training add-on
      trainingAvailable: fd.get('trainingAvailable') === 'on',
      trainingPrice: fd.get('trainingPrice') ? Number(fd.get('trainingPrice')) : 1000,
    };

    let payload = base;
    if (hasFile) {
      const formData = new FormData();
      Object.entries(base).forEach(([k, v]) => { if (v !== null && v !== undefined) formData.append(k, v); });
      formData.append('imageFile', file);
      payload = formData;
    }

    if (editingSport) {
      updateMutation.mutate({ id: editingSport._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  // ---- Computed ------------------------------------------------------------
  const isMutating = createMutation.isPending || updateMutation.isPending;

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <div className="pb-24">
      {/* Page header */}
      <PageHeader
        title="Sports Management"
        subtitle="Create, edit & manage all sports offered at the academy"
        action={
          <button onClick={openCreate} className="btn-primary gap-2 h-11">
            <Plus size={18} />
            Create Sport
          </button>
        }
      />

      {/* Filter toggle bar */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-8">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Hero Icons Editor */}
      {filter === 'hero' && <HeroIconsEditor />}

      {/* Discounts */}
      {filter === 'discounts' && <DiscountsPanel />}

      {/* Coupons */}
      {filter === 'coupons' && <CouponsPanel />}

      {/* Kids Academy */}
      {filter === 'kids-academy' && <KidsAcademyPanel sports={sports} />}

      {/* Content */}
      {filter !== 'hero' && filter !== 'discounts' && filter !== 'coupons' && filter !== 'kids-academy' && isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filter !== 'hero' && filter !== 'discounts' && filter !== 'coupons' && filter !== 'kids-academy' && sports.length === 0 ? (
        <EmptyState filter={filter} onCreateClick={openCreate} />
      ) : filter !== 'hero' && filter !== 'discounts' && filter !== 'coupons' && filter !== 'kids-academy' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {sports.map((sport) => (
              <SportCard
                key={sport._id}
                sport={sport}
                onEdit={() => openEdit(sport)}
                onToggle={() => toggleMutation.mutate({ id: sport._id })}
                onArchive={() => archiveMutation.mutate({ id: sport._id })}
                onViewQR={() => setQrModal(sport)}
                onConfig={() => setSessionConfigModal(sport)}
                isToggling={toggleMutation.isPending}
                isArchiving={archiveMutation.isPending}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : null}

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <SportDrawer
            sport={editingSport}
            onClose={closeDrawer}
            onSubmit={handleFormSubmit}
            isPending={isMutating}
          />
        )}
      </AnimatePresence>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmModal && (
          <ConfirmModal
            data={confirmModal}
            onCancel={() => setConfirmModal(null)}
            onConfirm={handleConfirmProceed}
          />
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => { setQrModal(null); setRegenerateConfirm(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">{qrModal.name} — QR Code</h3>
                <button onClick={() => { setQrModal(null); setRegenerateConfirm(false); }} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              {qrModal.qrCodeDataUrl ? (
                <div className="text-center">
                  <img src={qrModal.qrCodeDataUrl} alt={`${qrModal.name} QR`} className="w-56 h-56 mx-auto rounded-lg mb-4" />
                  <p className="text-xs text-gray-400 mb-6">Scan to enter {qrModal.name}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = qrModal.qrCodeDataUrl;
                        link.download = `${qrModal.name.replace(/\s+/g, '_')}_QR.png`;
                        link.click();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-colors"
                    >
                      <Download size={16} /> Download
                    </button>
                    {!regenerateConfirm ? (
                      <button
                        onClick={() => setRegenerateConfirm(true)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-colors"
                      >
                        <RefreshCw size={16} /> Regenerate
                      </button>
                    ) : (
                      <div className="flex-1 text-center">
                        <p className="text-xs text-red-600 font-semibold mb-2">Old QR codes will stop working!</p>
                        <button
                          onClick={() => regenerateQRMutation.mutate(qrModal._id)}
                          disabled={regenerateQRMutation.isPending}
                          className="w-full px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {regenerateQRMutation.isPending ? 'Regenerating...' : 'Confirm Regenerate'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">QR code unavailable</div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Config Modal */}
      <AnimatePresence>
        {sessionConfigModal && (
          <SessionConfigModal
            sport={sessionConfigModal}
            onClose={() => setSessionConfigModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ===========================================================================
// Sport Card
// ===========================================================================
function SportCard({ sport, onEdit, onToggle, onArchive, onViewQR, onConfig }) {
  const isActive = sport.active && !sport.deletedAt;
  const isArchived = !!sport.deletedAt;
  const isPlaceholder = (sport.memberCount ?? 0) === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="card overflow-hidden hover:shadow-lg transition-shadow duration-200 group"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
              {sport.thumbnail ? (
                <img src={sport.thumbnail} alt={sport.name} className="w-full h-full object-cover" />
              ) : (
                <Trophy size={20} className="text-gray-500" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {sport.name}
              </h3>
              {sport.tagline && (
                <p className="text-xs text-gray-400 mt-0.5">{sport.tagline}</p>
              )}
            </div>
          </div>
          <span
            className={`badge ${
              isArchived
                ? 'badge-danger'
                : isActive
                ? 'badge-success'
                : 'badge-warning'
            }`}
          >
            {isArchived ? 'Archived' : isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Pricing Grid */}
        <div className="my-4 space-y-2">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
            <div className="text-xs font-semibold text-gray-500 flex items-center gap-1 font-[Inter]">
              <DollarSign size={14} className="text-gray-400 shrink-0" />
              Plans & Packages
            </div>
            <div className="flex items-center gap-1.5">
              {isPlaceholder && (
                <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 uppercase tracking-wider">Suggested</span>
              )}
              <div className="text-xs text-gray-400 font-medium">All tiers</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Box 1: Hourly */}
            <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100/50 flex flex-col justify-center min-h-[52px]">
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 leading-none">Hourly</div>
              <div className="text-xs font-bold text-gray-800 mt-1">
                {sport.hourlyPrice ? formatCurrency(sport.hourlyPrice) : '—'}
              </div>
            </div>

            {/* Box 2: Day Pass */}
            <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100/50 flex flex-col justify-center min-h-[52px]">
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 leading-none">Day</div>
              <div className="text-xs font-bold text-gray-800 mt-1">
                {sport.dayPrice != null ? formatCurrency(sport.dayPrice) : '—'}
              </div>
            </div>

            {/* Box 3: 1 Month */}
            <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100/50 flex flex-col justify-center min-h-[52px]">
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 leading-none">1 Month</div>
              <div className="text-xs font-bold text-gray-800 mt-1">
                {sport.oneMonthPrice != null ? formatCurrency(sport.oneMonthPrice) : '—'}
              </div>
            </div>

            {/* Box 4: 3 Months */}
            <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100/50 flex flex-col justify-center min-h-[52px]">
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 leading-none">3 Months</div>
              <div className="text-xs font-bold text-gray-800 mt-1">
                {sport.threeMonthPrice ? formatCurrency(sport.threeMonthPrice) : '—'}
              </div>
            </div>

            {/* Box 5: 6 Months */}
            <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100/50 flex flex-col justify-center min-h-[52px]">
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 leading-none">6 Months</div>
              <div className="text-xs font-bold text-gray-800 mt-1">
                {sport.sixMonthPrice ? formatCurrency(sport.sixMonthPrice) : '—'}
              </div>
            </div>

            {/* Box 6: 12 Months */}
            <div className="bg-gray-50 p-2 rounded-lg text-center border border-gray-100/50 flex flex-col justify-center min-h-[52px]">
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5 leading-none">12 Months</div>
              <div className="text-xs font-bold text-gray-800 mt-1">
                {sport.twelveMonthPrice ? formatCurrency(sport.twelveMonthPrice) : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Member count */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 mt-2">
          <Users size={13} className="text-gray-400 shrink-0" />
          <span>
            Active Subscriptions:{' '}
            <span className="font-semibold text-gray-800">
              {sport.memberCount ?? 0}
            </span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={onEdit}
            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-xs font-semibold"
            title="Edit sport"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onClick={onToggle}
            className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 p-2 rounded-lg transition-colors text-xs font-semibold ${
              isActive
                ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'
            }`}
            title={isActive ? 'Deactivate' : 'Activate'}
          >
            <Power size={14} /> {isActive ? 'Disable' : 'Enable'}
          </button>
          <button
            onClick={onViewQR}
            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 p-2 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors text-xs font-semibold"
            title="View QR Code"
          >
            <QrCode size={14} /> QR
          </button>
          <button
            onClick={onConfig}
            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-semibold"
            title="Session Rules"
          >
            <Settings size={14} /> Rules
          </button>
          <button
            onClick={onArchive}
            className="flex-1 min-w-[80px] flex items-center justify-center gap-1.5 p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors text-xs font-semibold"
            title="Archive sport"
          >
            <Archive size={14} /> Archive
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ===========================================================================
// Hero Icons Editor
// ===========================================================================
const HERO_SLUGS = [
  { slug: 'box-cricket', label: 'Box Cricket' },
  { slug: 'badminton',   label: 'Badminton' },
  { slug: 'pickleball',  label: 'Pickleball' },
  { slug: 'swimming',    label: 'Swimming' },
  { slug: 'all-services',label: 'All Services' },
  { slug: 'gym',         label: 'Gym & Fitness' },
];

function HeroIconsEditor() {
  const qc = useQueryClient();

  const { data: sports = [], isLoading } = useQuery({
    queryKey: ['sports', 'active'],
    queryFn: async () => {
      const res = await api.get('/sports');
      return (res.data.sports ?? res.data).filter((s) => !s.deletedAt);
    },
  });

  const sportsBySlug = Object.fromEntries(sports.map((s) => [s.slug, s]));

  const updateMutation = useMutation({
    mutationFn: ({ id, heroIcon }) => api.put(`/sports/${id}`, { heroIcon }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sports'] });
      toast.success('Hero icon updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const [urls, setUrls] = useState({});
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});

  const handleFileChange = (slug, file) => {
    if (!file) return;
    setFiles((f) => ({ ...f, [slug]: file }));
    setPreviews((p) => ({ ...p, [slug]: URL.createObjectURL(file) }));
    setUrls((u) => ({ ...u, [slug]: '' }));
  };

  const handleSave = async (slug) => {
    const sport = sportsBySlug[slug];
    if (!sport) return toast.error('Sport not found');

    const file = files[slug];
    if (file) {
      const fd = new FormData();
      fd.append('heroIcon', urls[slug] || sport.heroIcon || '');
      fd.append('imageFile', file);
      await api.put(`/sports/${sport._id}`, fd);
      qc.invalidateQueries({ queryKey: ['sports'] });
      toast.success('Hero icon updated');
      setFiles((f) => { const n = { ...f }; delete n[slug]; return n; });
    } else {
      updateMutation.mutate({ id: sport._id, heroIcon: urls[slug] ?? sport.heroIcon ?? '' });
    }
  };

  const getPreview = (slug) => previews[slug] || sportsBySlug[slug]?.heroIcon || '';

  if (isLoading) return (
    <div className="flex items-center gap-2 text-gray-400 py-12">
      <Loader2 size={18} className="animate-spin" /> Loading sports...
    </div>
  );

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">
        These icons appear in the hero section grid on the public homepage. Upload an image or paste a URL for each sport. Leave blank to use the default SVG illustration.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {HERO_SLUGS.map(({ slug, label }) => {
          const sport = sportsBySlug[slug];
          const preview = getPreview(slug);
          return (
            <div key={slug} className="card p-4 flex flex-col gap-3">
              {/* Preview */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                  {preview ? (
                    <img src={preview} alt={label} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Trophy size={22} className="text-gray-300" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {sport ? (sport.heroIcon ? 'Custom icon set' : 'Using default SVG') : <span className="text-amber-500">Sport not found</span>}
                  </p>
                </div>
              </div>

              {/* URL input */}
              <input
                type="url"
                placeholder="Paste image URL..."
                value={urls[slug] ?? (sport?.heroIcon || '')}
                onChange={(e) => {
                  setUrls((u) => ({ ...u, [slug]: e.target.value }));
                  setPreviews((p) => ({ ...p, [slug]: e.target.value }));
                  setFiles((f) => { const n = { ...f }; delete n[slug]; return n; });
                }}
                className="input-field text-xs"
                disabled={!sport}
              />

              {/* File upload */}
              <input
                type="file"
                accept="image/*"
                className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                onChange={(e) => handleFileChange(slug, e.target.files?.[0])}
                disabled={!sport}
              />

              {/* Actions */}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => handleSave(slug)}
                  disabled={!sport || updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors disabled:opacity-40"
                >
                  {updateMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                  Save
                </button>
                {(sport?.heroIcon || previews[slug]) && (
                  <button
                    onClick={() => {
                      setUrls((u) => ({ ...u, [slug]: '' }));
                      setPreviews((p) => { const n = { ...p }; delete n[slug]; return n; });
                      setFiles((f) => { const n = { ...f }; delete n[slug]; return n; });
                      if (sport) updateMutation.mutate({ id: sport._id, heroIcon: '' });
                    }}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors"
                    title="Remove icon (revert to default SVG)"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================================
// Empty State
// ===========================================================================
function EmptyState({ filter, onCreateClick }) {
  const isFiltered = filter !== 'active';

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <Trophy size={28} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {isFiltered && filter === 'archived'
          ? 'No archived sports found'
          : isFiltered
          ? 'No sports match this filter'
          : 'No sports created yet'}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        {isFiltered
          ? 'Try switching to a different filter to see sports.'
          : 'Get started by creating your first sport. You can set pricing, manage memberships, and more.'}
      </p>
      {!isFiltered && (
        <button onClick={onCreateClick} className="btn-primary gap-2">
          <Plus size={18} /> Create Sport
        </button>
      )}
    </div>
  );
}

// ===========================================================================
// Slide-in Drawer
// ===========================================================================
function SportDrawer({ sport, onClose, onSubmit, isPending }) {
  const qc = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState(sport?.thumbnail || '');
  const [imageFile, setImageFile] = useState(null);
  const [pricingMode, setPricingMode] = useState(sport?.slotPricingMode || 'flat');

  // Kids Academy state (only for badminton/cricket)
  const isKidsEligible = sport && (sport.slug === 'badminton' || sport.slug === 'cricket' || sport.slug === 'box-cricket');
  const [kidsEnabled, setKidsEnabled] = useState(false);
  const [kidsAdmissionFee, setKidsAdmissionFee] = useState('');
  const [kidsMonthlyPrice, setKidsMonthlyPrice] = useState('');
  const [kidsActive, setKidsActive] = useState(true);
  const [kidsSaving, setKidsSaving] = useState(false);

  // Load existing kids academy plan if editing a kids-eligible sport
  useEffect(() => {
    if (!sport?._id || !isKidsEligible) return;
    api.get('/plans')
      .then(r => {
        const allPlans = r.data.plans || [];
        const kidsPlan = allPlans.find(p => p.isKidsAcademy && (p.sportsIncluded || []).includes(sport.slug));
        if (kidsPlan) {
          setKidsEnabled(kidsPlan.isActive !== false);
          setKidsAdmissionFee(kidsPlan.admissionFeeAmount?.toString() || '');
          setKidsMonthlyPrice(kidsPlan.price?.toString() || '');
          setKidsActive(kidsPlan.isActive !== false);
        }
      })
      .catch(() => {});
  }, [sport?._id, sport?.slug, isKidsEligible]);

  const handleSaveKidsAcademy = async () => {
    if (!sport?._id) return;
    setKidsSaving(true);
    try {
      await api.post(`/sports/${sport._id}/kids-academy`, {
        enabled: kidsEnabled,
        admissionFeeAmount: Number(kidsAdmissionFee) || 0,
        price: Number(kidsMonthlyPrice) || 0,
        active: kidsActive,
      });
      qc.invalidateQueries({ queryKey: ['membership-plans'] });
      toast.success('Kids Academy plan saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save Kids Academy plan.');
    } finally {
      setKidsSaving(false);
    }
  };

  // Close on Escape
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const isEdit = !!sport;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Edit Sport' : 'Create Sport'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sport Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                defaultValue={sport?.name}
                className="input-field"
                placeholder="e.g., Cricket"
              />
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sport Image
              </label>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-full h-36 object-cover rounded-xl mb-2 border border-gray-200"
                  onError={() => setPreviewUrl('')}
                />
              )}
              <input
                name="thumbnail"
                type="url"
                defaultValue={sport?.thumbnail}
                className="input-field mb-2"
                placeholder="Paste image URL (https://...)"
                onChange={e => { setPreviewUrl(e.target.value); setImageFile(null); }}
              />
              <div className="relative">
                <input
                  name="imageFile"
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Paste a URL above or upload a file — file upload takes priority.</p>
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tagline
              </label>
              <input
                name="tagline"
                defaultValue={sport?.tagline}
                className="input-field"
                placeholder="e.g., Play hard, win big"
              />
            </div>

            {/* Rental Equipment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Rental Equipment Text
              </label>
              <input
                name="rentalEquipment"
                defaultValue={sport?.rentalEquipment}
                className="input-field"
                placeholder="e.g., 🏸 Racket & Shuttle available for renting"
              />
              <p className="text-[11px] text-gray-400 mt-1">Shown on the sport card on the public homepage. Leave blank to use the default for this sport or hide.</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={sport?.description}
                className="input-field resize-none"
                placeholder="Short description shown on the public sport page"
              />
            </div>

            {/* Hourly price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Hourly Price
              </label>
              <input
                name="hourlyPrice"
                type="number"
                min="0"
                defaultValue={sport?.hourlyPrice || ''}
                className="input-field"
                placeholder="₹ (optional)"
              />
            </div>

            {/* Slot pricing mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Slot Pricing Mode</label>
              <select
                name="slotPricingMode"
                value={pricingMode}
                onChange={e => setPricingMode(e.target.value)}
                className="input-field"
              >
                <option value="flat">Flat — single price for all slots</option>
                <option value="dayNight">Day / Night — different price after a cutoff time</option>
              </select>
              {pricingMode === 'dayNight' && (
                <p className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Slot prices and timings are managed in <strong>Live Sports</strong> → Bulk Create Slots.
                </p>
              )}
            </div>

            {/* Monthly pricing grid */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Membership Pricing
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    1 Month
                  </label>
                  <input
                    name="price1Month"
                    type="number"
                    min="0"
                    defaultValue={sport?.oneMonthPrice ?? ''}
                    className="input-field"
                    placeholder="₹ (optional)"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">3 Months</label>
                  <input
                    name="price3Month"
                    type="number"
                    min="0"
                    defaultValue={sport?.threeMonthPrice ?? ''}
                    className="input-field"
                    placeholder="₹ (optional)"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">6 Months</label>
                  <input
                    name="price6Month"
                    type="number"
                    min="0"
                    defaultValue={sport?.sixMonthPrice ?? ''}
                    className="input-field"
                    placeholder="₹ (optional)"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">12 Months</label>
                  <input
                    name="price12Month"
                    type="number"
                    min="0"
                    defaultValue={sport?.twelveMonthPrice ?? ''}
                    className="input-field"
                    placeholder="₹ (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Training Add-on */}
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell size={14} className="text-green-600" />
                  <p className="text-sm font-semibold text-gray-800">Training Add-on</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="trainingAvailable"
                    defaultChecked={sport?.trainingAvailable || false}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600" />
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Training Price Add-on (₹)</label>
                <input
                  name="trainingPrice"
                  type="number"
                  min="0"
                  defaultValue={sport?.trainingPrice ?? 1000}
                  className="input-field"
                  placeholder="₹ 1000"
                />
              </div>
              <p className="text-[11px] text-gray-400">If enabled, membership users can choose "With Training" for +₹ this amount.</p>
            </div>

            {/* Kids Academy subsection — only for badminton/cricket */}
            {isEdit && isKidsEligible && (
              <div className="border border-violet-200 rounded-xl p-4 space-y-3 bg-violet-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={14} className="text-violet-600" />
                    <p className="text-sm font-semibold text-gray-800">Kids Academy</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kidsEnabled}
                      onChange={e => setKidsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600" />
                  </label>
                </div>
                {kidsEnabled && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-violet-600 bg-violet-100 border border-violet-200 rounded-lg px-3 py-2">
                      <Check size={11} /> Coach Included (always enabled for Kids Academy)
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Admission Fee (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={kidsAdmissionFee}
                          onChange={e => setKidsAdmissionFee(e.target.value)}
                          className="input-field"
                          placeholder="e.g., 1500"
                        />
                        <p className="text-[10px] text-gray-400 mt-0.5">Charged only once per student</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Monthly Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={kidsMonthlyPrice}
                          onChange={e => setKidsMonthlyPrice(e.target.value)}
                          className="input-field"
                          placeholder="e.g., 2000"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600">Plan Active</p>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={kidsActive}
                          onChange={e => setKidsActive(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600" />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveKidsAcademy}
                      disabled={kidsSaving}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 transition-colors disabled:opacity-50"
                    >
                      {kidsSaving ? <Loader2 size={12} className="animate-spin" /> : null}
                      Save Kids Academy Plan
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Active toggle */}
            <div className="flex items-center justify-between py-3 border-t border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Active</p>
                <p className="text-xs text-gray-500">
                  Sport will be visible and available for bookings
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={sport ? sport.active : true}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900" />
              </label>
            </div>
          </div>

          {/* Submit / Cancel */}
          <div className="flex items-center gap-3 pt-8">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 h-11"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary flex-1 h-11 gap-2"
            >
              {isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isEdit ? (
                'Save Changes'
              ) : (
                'Create Sport'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

// ===========================================================================
// Confirmation Modal
// ===========================================================================
function ConfirmModal({ data, onCancel, onConfirm }) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-[61] flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          {/* Warning header */}
          <div className="px-6 pt-6 pb-4 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Confirmation Required
              </h3>
              <p className="text-sm text-gray-600">{data.message}</p>
            </div>
          </div>

          {/* Stats */}
          {data.stats && (
            <div className="mx-6 p-4 bg-gray-50 rounded-xl mb-4">
              <div className="grid grid-cols-2 gap-3">
                {data.stats.activeMemberships != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {data.stats.activeMemberships}
                    </p>
                    <p className="text-xs text-gray-500">Active Memberships</p>
                  </div>
                )}
                {data.stats.activeBookings != null && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {data.stats.activeBookings}
                    </p>
                    <p className="text-xs text-gray-500">Active Bookings</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 px-6 pb-6">
            <button onClick={onCancel} className="btn-ghost flex-1 h-11">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-11 inline-flex items-center justify-center gap-2 bg-red-600 text-white font-medium rounded-3xl text-sm hover:bg-red-700 transition-colors cursor-pointer"
            >
              Proceed Anyway
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ===========================================================================
// Discounts Panel
// ===========================================================================
function DiscountsPanel() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);

  const { data: sports = [] } = useQuery({
    queryKey: ['sports', 'active'],
    queryFn: async () => {
      const res = await api.get('/sports');
      return (res.data.sports ?? res.data).filter((s) => !s.deletedAt && s.active);
    },
  });

  const { data: discounts = [], isLoading } = useQuery({
    queryKey: ['sport-discounts'],
    queryFn: async () => {
      const { data } = await api.get('/sports/discounts');
      return data.discounts;
    },
  });

  const createMut = useMutation({
    mutationFn: async ({ entries, startDate, endDate, isActive }) => {
      // Fire one request per sport-entry so each can have its own %
      for (const entry of entries) {
        await api.post('/sports/discounts', {
          sportId: entry.sportId,
          discountPercent: Number(entry.discountPercent),
          startDate,
          endDate,
          isActive,
        });
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sport-discounts'] });
      qc.invalidateQueries({ queryKey: ['public-discounts-banner'] });
      toast.success(vars.entries.length > 1 ? `${vars.entries.length} discounts created` : 'Discount created');
      setShowForm(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, entries, startDate, endDate, isActive }) => api.put(`/sports/discounts/${id}`, {
      discountPercent: Number(entries[0]?.discountPercent),
      startDate,
      endDate,
      isActive,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sport-discounts'] });
      qc.invalidateQueries({ queryKey: ['public-discounts-banner'] });
      toast.success('Discount updated');
      setEditingDiscount(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/sports/discounts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sport-discounts'] }); toast.success('Discount deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const now = new Date();
  const isActiveNow = (d) => d.isActive && new Date(d.startDate) <= now && new Date(d.endDate) >= now;

  function DiscountForm({ initial, onSave, onCancel, isPending }) {
    // entries: [{ sportId, sportName, discountPercent }]
    const [entries, setEntries] = useState(
      initial
        ? [{ sportId: initial.sportId?._id || initial.sportId, sportName: sports.find((s) => s._id === (initial.sportId?._id || initial.sportId))?.name || '', discountPercent: String(initial.discountPercent || '') }]
        : []
    );

    const toggleSport = (sport) => {
      setEntries((prev) => {
        const exists = prev.find((e) => e.sportId === sport._id);
        if (exists) return prev.filter((e) => e.sportId !== sport._id);
        return [...prev, { sportId: sport._id, sportName: sport.name, discountPercent: '' }];
      });
    };

    const setPercent = (sportId, val) =>
      setEntries((prev) => prev.map((e) => e.sportId === sportId ? { ...e, discountPercent: val } : e));

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!entries.length) { toast.error('Select at least one sport.'); return; }
          const missing = entries.filter((e) => !e.discountPercent || Number(e.discountPercent) <= 0);
          if (missing.length) { toast.error(`Enter discount % for: ${missing.map((e) => e.sportName).join(', ')}`); return; }
          const fd = new FormData(e.target);
          onSave({
            entries,
            startDate: `${fd.get('startDate')}T00:00:00`,
            endDate: `${fd.get('endDate')}T23:59:59`,
            isActive: fd.get('isActive') === 'on',
          });
        }}
        className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-200"
      >
        {/* Sport selector (create only) */}
        {!initial && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Sports <span className="text-gray-400 font-normal">— click to add, each gets its own %</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {sports.map((s) => {
                const selected = entries.some((e) => e.sportId === s._id);
                return (
                  <button key={s._id} type="button" onClick={() => toggleSport(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selected ? 'bg-[#C8102E] border-[#C8102E] text-white' : 'border-gray-200 text-gray-600 bg-white hover:border-[#C8102E]/40'}`}>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-sport discount % rows */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600">Discount per sport</label>
            {entries.map((e) => (
              <div key={e.sportId} className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-3 py-2">
                <span className="flex-1 text-sm font-semibold text-gray-800">{e.sportName}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min="1" max="100"
                    value={e.discountPercent}
                    onChange={(ev) => setPercent(e.sportId, ev.target.value)}
                    placeholder="%"
                    className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20"
                  />
                  <span className="text-xs text-gray-400 font-medium">% off</span>
                </div>
                {!initial && (
                  <button type="button" onClick={() => setEntries((prev) => prev.filter((x) => x.sportId !== e.sportId))}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
            <input name="startDate" type="date" required defaultValue={initial?.startDate ? new Date(initial.startDate).toISOString().slice(0,10) : ''} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date *</label>
            <input name="endDate" type="date" required defaultValue={initial?.endDate ? new Date(initial.endDate).toISOString().slice(0,10) : ''} className="input-field text-sm" />
          </div>
          <div className="col-span-2 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isActive" defaultChecked={initial ? initial.isActive : true} className="w-4 h-4 accent-[#C8102E]" />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <p className="text-[11px] text-gray-400">Banner text is auto-generated and shown on homepage.</p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-xl bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#a50d27] disabled:opacity-60 flex items-center justify-center gap-1">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save{entries.length > 1 ? ` (${entries.length} discounts)` : ''}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Manage one-time slot booking discounts per sport. Active discounts are applied automatically during public booking.</p>
        </div>
        {!showForm && (
          <button onClick={() => { setShowForm(true); setEditingDiscount(null); }} className="btn-primary gap-1 h-9 text-sm">
            <Plus size={15} /> New Discount
          </button>
        )}
      </div>

      {showForm && (
        <DiscountForm
          onSave={(d) => createMut.mutate(d)}
          onCancel={() => setShowForm(false)}
          isPending={createMut.isPending}
        />
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2].map((i) => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
      ) : discounts.length === 0 ? (
        <div className="card py-10 text-center text-sm text-gray-400">
          <Tag size={28} className="mx-auto mb-2 text-gray-300" />
          No discounts created yet.
        </div>
      ) : (
        <div className="space-y-3">
          {discounts.map((d) => (
            <div key={d._id}>
              {editingDiscount === d._id ? (
                <DiscountForm
                  initial={{ ...d, sportId: d.sportId?._id || d.sportId }}
                  onSave={(payload) => updateMut.mutate({ id: d._id, ...payload })}
                  onCancel={() => setEditingDiscount(null)}
                  isPending={updateMut.isPending}
                />
              ) : (
                <div className={`card p-4 flex items-center justify-between gap-4 ${isActiveNow(d) ? 'border-green-200 bg-green-50/30' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActiveNow(d) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      <Tag size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">{d.sportId?.name || d.sportNameSnapshot} — {d.discountPercent}% off</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(d.startDate).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })} → {new Date(d.endDate).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </p>
                      {d.bannerText && <p className="text-[11px] text-indigo-500 truncate">{d.bannerText}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActiveNow(d) ? 'bg-green-100 text-green-700' : d.isActive ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {isActiveNow(d) ? 'Live' : d.isActive ? 'Scheduled' : 'Disabled'}
                    </span>
                    <button onClick={() => setEditingDiscount(d._id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => { if (window.confirm('Delete this discount?')) deleteMut.mutate(d._id); }} className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Session Config Modal
// ===========================================================================
function SessionConfigModal({ sport, onClose }) {
  const qc = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['session-configs'],
    queryFn: () => api.get('/session-config').then(r => r.data.data),
  });

  const sportConfig = configs.find(c => c.type === 'sport' && c.sportSlug === sport.slug) || {};
  const globalConfig = configs.find(c => c.key === 'default') || {
    allowedDurationMinutes: 75,
    overtimeThresholdMinutes: 0,
    lateFeePerMinuteOverride: 'sport hourly rate',
    autoCheckoutAfterMinutes: 240,
  };
  const isEditing = !!sportConfig._id;

  const updateMutation = useMutation({
    mutationFn: (payload) => api.put('/session-config', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session-configs'] });
      toast.success('Session configuration saved!');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/session-config/${sportConfig._id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session-configs'] });
      toast.success('Sport specific overrides removed!');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to remove configuration');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      key: `sport_${sport.slug}`,
      type: 'sport',
      sportSlug: sport.slug,
      allowedDurationMinutes: fd.get('allowedDurationMinutes') ? Number(fd.get('allowedDurationMinutes')) : null,
      overtimeThresholdMinutes: fd.get('overtimeThresholdMinutes') ? Number(fd.get('overtimeThresholdMinutes')) : null,
      lateFeePerMinuteOverride: fd.get('lateFeePerMinuteOverride') ? Number(fd.get('lateFeePerMinuteOverride')) : null,
      autoCheckoutAfterMinutes: fd.get('autoCheckoutAfterMinutes') ? Number(fd.get('autoCheckoutAfterMinutes')) : null,
    };
    
    Object.keys(payload).forEach(key => {
      if (payload[key] === null) delete payload[key];
    });

    updateMutation.mutate(payload);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-full"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{sport.name} Session Rules</h2>
              <p className="text-xs text-gray-500 mt-1">Configure specific overrides for this sport</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={20} />
            </button>
          </div>

          {isLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Session Duration (mins)</label>
                  <input name="allowedDurationMinutes" type="number" min="5" defaultValue={sportConfig.allowedDurationMinutes || ''} placeholder={`Leave empty for global default (${globalConfig.allowedDurationMinutes} mins)`} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Overtime Grace Period (mins)</label>
                  <input name="overtimeThresholdMinutes" type="number" min="0" defaultValue={sportConfig.overtimeThresholdMinutes ?? ''} placeholder={`Leave empty for global default (${globalConfig.overtimeThresholdMinutes} mins)`} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee / Minute (₹)</label>
                  <input name="lateFeePerMinuteOverride" type="number" min="0" step="0.01" defaultValue={sportConfig.lateFeePerMinuteOverride || ''} placeholder={`Leave empty for global default (${globalConfig.lateFeePerMinuteOverride === 'sport hourly rate' ? 'sport hourly rate' : '₹' + globalConfig.lateFeePerMinuteOverride})`} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Auto-Checkout After (mins)</label>
                  <input name="autoCheckoutAfterMinutes" type="number" min="30" defaultValue={sportConfig.autoCheckoutAfterMinutes || ''} placeholder={`Leave empty for global default (${globalConfig.autoCheckoutAfterMinutes} mins)`} className="input-field" />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8">
                {isEditing && (
                  <button type="button" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700 px-4">
                    {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Remove Overrides'}
                  </button>
                )}
                <div className="flex-1" />
                <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary gap-2">
                  {updateMutation.isPending && <Loader2 size={16} className="animate-spin" />} Save Rules
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </>
  );
}

// ===========================================================================
// Coupons Panel
// ===========================================================================
function CouponsPanel() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null); // coupon object or null

  const { data: sports = [] } = useQuery({
    queryKey: ['sports', 'active'],
    queryFn: async () => {
      const res = await api.get('/sports');
      return (res.data.sports ?? res.data).filter((s) => !s.deletedAt && s.active);
    },
  });

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['coupons-admin'],
    queryFn: async () => {
      const { data } = await api.get('/coupons/admin');
      return data.coupons;
    },
  });

  const createMut = useMutation({
    mutationFn: (payload) => api.post('/coupons/admin', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons-admin'] });
      toast.success('Coupon created');
      setShowForm(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create coupon'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/coupons/admin/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons-admin'] });
      toast.success('Coupon updated');
      setEditingCoupon(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update coupon'),
  });

  const toggleMut = useMutation({
    mutationFn: (id) => api.patch(`/coupons/admin/${id}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons-admin'] });
      toast.success('Coupon status updated');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/coupons/admin/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['coupons-admin'] });
      toast.success('Coupon archived');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const now = new Date();
  const getCouponStatus = (c) => {
    if (c.archivedAt) return { label: 'Archived', cls: 'bg-gray-100 text-gray-500' };
    if (!c.isActive) return { label: 'Inactive', cls: 'bg-gray-100 text-gray-500' };
    if (c.endsAt && new Date(c.endsAt) < now) return { label: 'Expired', cls: 'bg-red-100 text-red-600' };
    if (c.startsAt && new Date(c.startsAt) > now) return { label: 'Scheduled', cls: 'bg-blue-100 text-blue-600' };
    return { label: 'Active', cls: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Create and manage coupon codes for sports and food orders.</p>
        {!showForm && !editingCoupon && (
          <button
            onClick={() => { setShowForm(true); setEditingCoupon(null); }}
            className="btn-primary gap-1 h-9 text-sm"
          >
            <Plus size={15} /> New Coupon
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <CouponFormModal
          sports={sports}
          onSave={(payload) => createMut.mutate(payload)}
          onCancel={() => setShowForm(false)}
          isPending={createMut.isPending}
        />
      )}

      {/* Edit form */}
      {editingCoupon && (
        <CouponFormModal
          initial={editingCoupon}
          sports={sports}
          onSave={(payload) => updateMut.mutate({ id: editingCoupon._id, payload })}
          onCancel={() => setEditingCoupon(null)}
          isPending={updateMut.isPending}
        />
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="card py-10 text-center text-sm text-gray-400">
          <Ticket size={28} className="mx-auto mb-2 text-gray-300" />
          No coupons created yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Target</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Discount</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Validity</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Usage</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => {
                const status = getCouponStatus(c);
                const isArchived = !!c.archivedAt;
                return (
                  <tr key={c._id} className={`hover:bg-gray-50 transition-colors ${isArchived ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.title || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-600">{c.targetType}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {c.discountType === 'percentage'
                        ? `${c.discountValue}%${c.maxDiscountAmount ? ` (max ₹${c.maxDiscountAmount})` : ''}`
                        : `₹${c.discountValue}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.startsAt || c.endsAt ? (
                        <span>
                          {c.startsAt ? new Date(c.startsAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                          {' → '}
                          {c.endsAt ? new Date(c.endsAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '∞'}
                        </span>
                      ) : (
                        <span className="text-gray-300">No limit</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.usedCount ?? 0}
                      {c.usageLimitTotal != null ? ` / ${c.usageLimitTotal}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isArchived && (
                          <>
                            <button
                              onClick={() => setEditingCoupon(c)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => toggleMut.mutate(c._id)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                c.isActive
                                  ? 'bg-green-50 hover:bg-green-100 text-green-600'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-400'
                              }`}
                              title={c.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {c.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                            </button>
                            <button
                              onClick={() => { if (window.confirm('Archive this coupon?')) deleteMut.mutate(c._id); }}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500"
                              title="Archive"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Coupon Form (create / edit)
// ===========================================================================
function CouponFormModal({ initial, sports, onSave, onCancel, isPending }) {
  const [discountType, setDiscountType] = useState(initial?.discountType || 'percentage');
  const [targetType, setTargetType] = useState(initial?.targetType || 'sports');
  const [appliesToAllSports, setAppliesToAllSports] = useState(initial?.appliesToAllSports ?? true);
  const [selectedSportIds, setSelectedSportIds] = useState(
    (initial?.sportIds || []).map((s) => (s._id || s).toString())
  );
  const [visibility, setVisibility] = useState(initial?.visibility || 'all');
  const [eligibleUsers, setEligibleUsers] = useState(
    (initial?.eligibleUserIds || []).map((u) => ({
      _id: (u._id || u).toString(),
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
    }))
  );

  // User search state
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [userSearching, setUserSearching] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Debounced user search
  useEffect(() => {
    if (userQuery.length < 2) { setUserResults([]); setShowUserDropdown(false); return; }
    const t = setTimeout(async () => {
      setUserSearching(true);
      try {
        const { data } = await api.get('/super-admin/user-search', { params: { q: userQuery } });
        setUserResults(data.users || []);
        setShowUserDropdown(true);
      } catch { /* silent */ } finally { setUserSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [userQuery]);

  const selectUser = (u) => {
    if (!eligibleUsers.find((x) => x._id === u._id)) {
      setEligibleUsers((prev) => [...prev, { _id: u._id, name: u.name, email: u.email, phone: u.phone }]);
    }
    setUserQuery('');
    setUserResults([]);
    setShowUserDropdown(false);
  };

  const removeUser = (id) => setEligibleUsers((prev) => prev.filter((u) => u._id !== id));

  const toggleSportId = (id) => {
    setSelectedSportIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    const code = fd.get('code');
    const discountValue = Number(fd.get('discountValue'));

    if (!code) { toast.error('Coupon code is required.'); return; }
    if (!discountValue || discountValue <= 0) { toast.error('Discount value must be greater than 0.'); return; }

    const payload = {
      code: code.toUpperCase(),
      title: fd.get('title') || '',
      description: fd.get('description') || '',
      discountType,
      discountValue,
      maxDiscountAmount: discountType === 'percentage' && fd.get('maxDiscountAmount') ? Number(fd.get('maxDiscountAmount')) : null,
      minOrderAmount: fd.get('minOrderAmount') ? Number(fd.get('minOrderAmount')) : 0,
      targetType,
      appliesToAllSports: targetType === 'food' ? false : appliesToAllSports,
      sportIds: appliesToAllSports || targetType === 'food' ? [] : selectedSportIds,
      visibility,
      eligibleUserIds: visibility === 'specific-users' ? eligibleUsers.map((u) => u._id) : [],
      startsAt: fd.get('startsAt') ? new Date(fd.get('startsAt')).toISOString() : undefined,
      endsAt: fd.get('endsAt') ? new Date(fd.get('endsAt')).toISOString() : undefined,
      usageLimitTotal: fd.get('usageLimitTotal') ? Number(fd.get('usageLimitTotal')) : undefined,
      usageLimitPerUser: fd.get('usageLimitPerUser') ? Number(fd.get('usageLimitPerUser')) : undefined,
      isActive: fd.get('isActive') === 'on',
    };

    onSave(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200"
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Code */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Code <span className="text-red-500">*</span>
          </label>
          <input
            name="code"
            required
            defaultValue={initial?.code || ''}
            onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }}
            className="input-field text-sm font-mono uppercase"
            placeholder="e.g. SUMMER20"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <input name="title" defaultValue={initial?.title || ''} className="input-field text-sm" placeholder="e.g. Summer Offer" />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <textarea name="description" rows={2} defaultValue={initial?.description || ''} className="input-field text-sm resize-none" placeholder="Optional description shown to users" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Discount Type */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Discount Type</label>
          <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="input-field text-sm">
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount (₹)</option>
          </select>
        </div>

        {/* Discount Value */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Discount Value <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400 text-xs font-medium">
              {discountType === 'percentage' ? '%' : '₹'}
            </span>
            <input name="discountValue" type="number" min="0" required defaultValue={initial?.discountValue || ''} className="input-field text-sm pl-7" placeholder="0" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Max Discount (percentage only) */}
        {discountType === 'percentage' && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Max Discount (₹)</label>
            <input name="maxDiscountAmount" type="number" min="0" defaultValue={initial?.maxDiscountAmount ?? ''} className="input-field text-sm" placeholder="Optional cap" />
          </div>
        )}

        {/* Min Order Amount */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Min Order Amount (₹)</label>
          <input name="minOrderAmount" type="number" min="0" defaultValue={initial?.minOrderAmount ?? 0} className="input-field text-sm" placeholder="0" />
        </div>
      </div>

      {/* Target Type */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Target Type</label>
        <div className="flex gap-2">
          {['sports', 'food', 'both'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTargetType(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors capitalize ${
                targetType === t
                  ? 'bg-[#C8102E] border-[#C8102E] text-white'
                  : 'border-gray-200 text-gray-600 bg-white hover:border-[#C8102E]/40'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Sports selector */}
      {(targetType === 'sports' || targetType === 'both') && (
        <div>
          <div className="flex items-center gap-3 mb-2">
            <label className="block text-xs font-medium text-gray-600">Applicable Sports</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={appliesToAllSports}
                onChange={(e) => setAppliesToAllSports(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#C8102E]"
              />
              <span className="text-xs text-gray-500">All Sports</span>
            </label>
          </div>
          {!appliesToAllSports && (
            <div className="flex flex-wrap gap-2">
              {sports.map((s) => {
                const selected = selectedSportIds.includes(s._id);
                return (
                  <button
                    key={s._id}
                    type="button"
                    onClick={() => toggleSportId(s._id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      selected
                        ? 'bg-[#C8102E] border-[#C8102E] text-white'
                        : 'border-gray-200 text-gray-600 bg-white hover:border-[#C8102E]/40'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Start date */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date/Time</label>
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={initial?.startsAt ? new Date(initial.startsAt).toISOString().slice(0, 16) : ''}
            className="input-field text-sm"
          />
        </div>
        {/* End date */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">End Date/Time</label>
          <input
            name="endsAt"
            type="datetime-local"
            defaultValue={initial?.endsAt ? new Date(initial.endsAt).toISOString().slice(0, 16) : ''}
            className="input-field text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Usage Limit Total */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Total Usage Limit</label>
          <input name="usageLimitTotal" type="number" min="1" defaultValue={initial?.usageLimitTotal ?? ''} className="input-field text-sm" placeholder="Unlimited" />
        </div>
        {/* Usage Limit Per User */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Per User Limit</label>
          <input name="usageLimitPerUser" type="number" min="1" defaultValue={initial?.usageLimitPerUser ?? ''} className="input-field text-sm" placeholder="Unlimited" />
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Visibility</label>
        <div className="flex gap-2">
          {[
            { val: 'all', label: 'All Users' },
            { val: 'specific-users', label: 'Specific Users' },
          ].map(({ val, label }) => (
            <button
              key={val}
              type="button"
              onClick={() => setVisibility(val)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                visibility === val
                  ? 'bg-[#C8102E] border-[#C8102E] text-white'
                  : 'border-gray-200 text-gray-600 bg-white hover:border-[#C8102E]/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Eligible users (specific-users only) */}
      {visibility === 'specific-users' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Eligible Users</label>

          {/* Selected user chips */}
          {eligibleUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {eligibleUsers.map((u) => (
                <div key={u._id} className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                  <span className="text-xs font-semibold text-green-800">{u.name}</span>
                  <span className="text-[10px] text-green-600">{u.email}</span>
                  <button type="button" onClick={() => removeUser(u._id)} className="text-green-400 hover:text-red-500 ml-1">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Loader2 size={14} className={`absolute left-3 top-2.5 ${userSearching ? 'animate-spin text-gray-400' : 'text-transparent'}`} />
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onFocus={() => userResults.length > 0 && setShowUserDropdown(true)}
              placeholder="Search users by name, email or phone..."
              className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E]/20"
            />
            {showUserDropdown && userResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {userResults.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => selectUser(u)}
                    className="w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-0"
                  >
                    <Users size={13} className="text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{u.email} · {u.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {showUserDropdown && !userSearching && userQuery.length >= 2 && userResults.length === 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-sm text-gray-400">
                No registered users found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active toggle */}
      <div className="flex items-center gap-2">
        <input type="checkbox" name="isActive" id="couponIsActive" defaultChecked={initial ? initial.isActive : true} className="w-4 h-4 accent-[#C8102E]" />
        <label htmlFor="couponIsActive" className="text-sm text-gray-700 cursor-pointer">Active</label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100">
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="flex-1 py-2 rounded-xl bg-[#C8102E] text-white text-sm font-semibold hover:bg-[#a50d27] disabled:opacity-60 flex items-center justify-center gap-1">
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {initial ? 'Save Changes' : 'Create Coupon'}
        </button>
      </div>
    </form>
  );
}

// ===========================================================================
// Kids Academy Panel
// ===========================================================================
const DURATION_LABELS = ['1 Month', '3 Months', '6 Months', '1 Year'];

function KidsAcademyPanel({ sports }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSport, setEditingSport] = useState(null); // sport object being edited

  const { data: academyPlans = [], isLoading } = useQuery({
    queryKey: ['kids-academy-plans'],
    queryFn: () => api.get('/sports/kids-academy').then((r) => r.data),
    staleTime: 30_000,
  });

  // Group plans by sport
  const bySport = academyPlans.reduce((acc, plan) => {
    const sid = plan.sport?._id || plan.sport;
    if (!acc[sid]) acc[sid] = { sport: plan.sport, plans: [] };
    acc[sid].plans.push(plan);
    return acc;
  }, {});

  const handleEdit = (sportObj) => {
    setEditingSport(sportObj);
    setShowForm(true);
  };

  const handleDelete = async (sportId) => {
    if (!window.confirm('Remove Kids Academy programmes for this sport?')) return;
    try {
      await api.delete(`/sports/${sportId}/kids-academy`);
      qc.invalidateQueries({ queryKey: ['kids-academy-plans'] });
      toast.success('Kids Academy programmes removed');
    } catch {
      toast.error('Failed to remove programmes');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Kids Academy</h2>
            <p className="text-sm text-gray-500">Manage junior training programmes per sport</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingSport(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          <Plus size={16} />
          Add Programme
        </button>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <KidsAcademyFormModal
            sports={sports}
            editingSport={editingSport}
            existingPlans={editingSport ? (bySport[editingSport._id]?.plans || []) : []}
            onClose={() => { setShowForm(false); setEditingSport(null); }}
          />
        )}
      </AnimatePresence>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-48 rounded-2xl skeleton" />)}
        </div>
      ) : Object.keys(bySport).length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No Kids Academy programmes yet</p>
          <p className="text-gray-400 text-sm mt-1">Click "Add Programme" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(bySport).map(({ sport, plans }) => (
            <KidsAcademySportCard
              key={sport?._id || sport}
              sport={sport}
              plans={plans}
              onEdit={() => handleEdit(sport)}
              onDelete={() => handleDelete(sport?._id || sport)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function KidsAcademySportCard({ sport, plans, onEdit, onDelete }) {
  const admissionFee = plans[0]?.admissionFeeAmount || 0;
  const sortOrder = { '1 Month': 0, '3 Months': 1, '6 Months': 2, '1 Year': 3 };
  const sorted = [...plans].sort((a, b) => (sortOrder[a.duration] ?? 99) - (sortOrder[b.duration] ?? 99));

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Sport header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #0D0A1A 0%, #1A0F2E 100%)' }}>
        <div className="flex items-center gap-3">
          {sport?.imageUrl ? (
            <img src={sport.imageUrl} alt={sport.name} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-violet-600/30 flex items-center justify-center">
              <GraduationCap size={16} className="text-violet-400" />
            </div>
          )}
          <div>
            <p className="font-bold text-white text-sm">{sport?.name || 'Unknown Sport'}</p>
            <p className="text-violet-300 text-xs">Admission: {formatCurrency(admissionFee)} (once)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-1.5 rounded-lg text-violet-300 hover:text-white hover:bg-violet-600/20 transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-red-400 hover:text-white hover:bg-red-600/20 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Duration tiers */}
      <div className="p-4 grid grid-cols-2 gap-2">
        {sorted.map((plan) => (
          <div
            key={plan._id}
            className={`rounded-xl p-3 border ${plan.active !== false ? 'border-violet-100 bg-violet-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">{plan.duration}</p>
            <p className="text-lg font-black text-gray-900 mt-0.5">{formatCurrency(plan.price)}</p>
            {plan.active === false && <p className="text-[9px] text-gray-400 uppercase mt-0.5">Inactive</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function KidsAcademyFormModal({ sports, editingSport, existingPlans, onClose }) {
  const qc = useQueryClient();
  const [selectedSportId, setSelectedSportId] = useState(editingSport?._id || '');
  const [admissionFee, setAdmissionFee] = useState('');
  const [tiers, setTiers] = useState(() =>
    DURATION_LABELS.map((dur) => {
      const existing = existingPlans.find((p) => p.duration === dur);
      return { duration: dur, price: existing?.price ?? '', active: existing?.active !== false };
    })
  );

  // Populate admission fee from existing plans when editing
  useEffect(() => {
    if (existingPlans.length > 0) {
      setAdmissionFee(existingPlans[0]?.admissionFeeAmount ?? '');
    }
  }, [existingPlans]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (body) => api.post(`/sports/${selectedSportId}/kids-academy`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kids-academy-plans'] });
      toast.success(editingSport ? 'Kids Academy updated' : 'Kids Academy programme created');
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to save'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSportId) return toast.error('Please select a sport');
    const activeTiers = tiers.filter((t) => t.price !== '' && t.price !== null);
    if (activeTiers.length === 0) return toast.error('Enter at least one tier price');
    save({
      enabled: true,
      admissionFeeAmount: Number(admissionFee) || 0,
      plans: tiers.map((t) => ({ duration: t.duration, price: Number(t.price) || 0, active: t.active })),
    });
  };

  const updateTier = (idx, field, value) => {
    setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
  };

  const activeSports = sports?.filter((s) => !s.isArchived) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
          <div className="flex items-center gap-2">
            <GraduationCap size={20} className="text-white" />
            <h3 className="text-white font-bold text-lg">{editingSport ? 'Edit Programme' : 'Add Kids Academy Programme'}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Sport selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sport</label>
            {editingSport ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                {editingSport.imageUrl && <img src={editingSport.imageUrl} alt={editingSport.name} className="w-6 h-6 rounded object-cover" />}
                <span className="font-semibold text-gray-800">{editingSport.name}</span>
              </div>
            ) : (
              <select
                value={selectedSportId}
                onChange={(e) => setSelectedSportId(e.target.value)}
                className="input-field text-sm"
                required
              >
                <option value="">Select a sport...</option>
                {activeSports.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Admission fee */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Admission Fee (one-time, ₹)</label>
            <input
              type="number"
              min="0"
              value={admissionFee}
              onChange={(e) => setAdmissionFee(e.target.value)}
              className="input-field text-sm"
              placeholder="e.g. 500"
            />
            <p className="text-[11px] text-gray-400 mt-1">Charged once per student, never again</p>
          </div>

          {/* Duration tiers */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Membership Tiers</label>
            <div className="space-y-2">
              {tiers.map((tier, idx) => (
                <div key={tier.duration} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-20 shrink-0">
                    <p className="text-xs font-bold text-gray-700">{tier.duration}</p>
                  </div>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={tier.price}
                      onChange={(e) => updateTier(idx, 'price', e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                      placeholder="Price"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => updateTier(idx, 'active', !tier.active)}
                    className={`shrink-0 transition-colors ${tier.active ? 'text-violet-600' : 'text-gray-300'}`}
                    title={tier.active ? 'Active' : 'Inactive'}
                  >
                    {tier.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Toggle to enable/disable individual tiers. Leave price blank to skip a tier.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-1"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {editingSport ? 'Save Changes' : 'Create Programme'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
