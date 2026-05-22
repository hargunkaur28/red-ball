import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarCheck, CreditCard, Download, Edit, Loader, QrCode, RefreshCw, Snowflake, Trash2 } from 'lucide-react';
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
  paymentMode: 'upi', notes: '',
};

export default function Admissions() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const qc = useQueryClient();

  // Load Razorpay script once
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['admissions', filter, search],
    queryFn: () => api.get(`/admissions?status=${filter}&search=${search}`).then(r => r.data),
  });

  const { data: membershipsData, isLoading: membershipsLoading } = useQuery({
    queryKey: ['all-memberships', filter],
    queryFn: () => api.get(`/memberships/all${filter ? `?status=${filter}` : ''}`).then(r => r.data),
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => api.get('/attendance/today').then(r => r.data).catch(() => ({ attendance: [] })),
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
      setRazorpayLoading(false);
      const admission = res.data.admission;
      const isPaid = admission.paymentStatus === 'paid';
      toast.success(
        isPaid
          ? `Admission created! Membership is ACTIVE.`
          : `Admission created! Membership is PENDING (awaiting payment).`
      );
    },
    onError: (e) => {
      setRazorpayLoading(false);
      toast.error(e.response?.data?.message || 'Error creating admission');
    },
  });

  // Handle form submit — UPI opens Razorpay
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.planId) {
      createMutation.mutate(form);
      return;
    }

    // UPI → Razorpay
    if (!scriptLoaded || !window.Razorpay) {
      toast.error('Payment gateway not loaded. Please wait a moment and try again.');
      return;
    }

    const selectedPlan = plansData?.plans?.find(p => p._id === form.planId);
    if (!selectedPlan) { toast.error('Plan not found.'); return; }

    const totalAmount = Math.round(selectedPlan.price * 1.18);

    try {
      setRazorpayLoading(true);
      const { data: orderData } = await api.post('/payments/create-order', {
        amount: selectedPlan.price,
        type: 'membership',
        referenceId: selectedPlan._id,
        gstPercent: 18,
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        description: `Membership — ${selectedPlan.name}`,
      });

      const options = {
        key: orderData.keyId,
        order_id: orderData.razorpayOrder.id,
        amount: orderData.razorpayOrder.amount,
        currency: 'INR',
        name: 'Red Ball Academy',
        description: `${selectedPlan.name} Membership`,
        theme: { color: '#000000' },
        method: { upi: true, card: false, netbanking: false, wallet: false },
        prefill: { name: form.name, email: form.email, contact: form.phone },
        handler: (response) => {
          createMutation.mutate({
            ...form,
            paymentMode: 'razorpay',
            amountPaid: totalAmount,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: () => {
            setRazorpayLoading(false);
            toast.info('Payment cancelled.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setRazorpayLoading(false);
      toast.error(err.response?.data?.message || 'Failed to initiate UPI payment.');
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admissions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admissions'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      setDeleteTarget(null);
      toast.success('Admission deleted successfully.');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to delete admission'),
  });

  const freezeMutation = useMutation({
    mutationFn: (id) => api.put(`/memberships/${id}/freeze`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all-memberships'] });
      qc.invalidateQueries({ queryKey: ['admissions'] });
      toast.success('Membership frozen.');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not freeze membership'),
  });

  const getBadge = (status) => {
    const styles = {
      paid: 'bg-green-50 text-green-700',
      active: 'bg-green-50 text-green-700',
      present: 'bg-green-50 text-green-700',
      pending: 'bg-amber-50 text-amber-700',
      partial: 'bg-blue-50 text-blue-700',
      frozen: 'bg-blue-50 text-blue-700',
      expired: 'bg-red-50 text-red-700',
      missing: 'bg-gray-100 text-gray-600',
      ready: 'bg-green-50 text-green-700',
    };
    return <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${styles[status] || styles.missing}`}>{status || 'missing'}</span>;
  };

  const membershipById = new Map((membershipsData?.memberships || []).map(m => [m._id, m]));
  const attendanceByUser = new Map((attendanceData?.attendance || []).map(a => [a.userId?._id, a]));
  const operationalRows = (data?.admissions || []).map((admission) => {
    const membership = admission.membershipId?._id ? membershipById.get(admission.membershipId._id) || admission.membershipId : admission.membershipId;
    const plan = membership?.planId || admission.membershipId?.planId;
    const student = admission.studentId || membership?.studentId || {};
    const attendance = attendanceByUser.get(student?._id);
    return {
      ...admission,
      student,
      membership,
      plan,
      memberName: student?.name || 'Unknown',
      phone: admission.phone || student?.phone || '',
      membershipType: plan?.name || 'No plan',
      sports: admission.sportsIncluded?.length ? admission.sportsIncluded : plan?.sportsIncluded || [],
      startDate: membership?.startDate,
      expiryDate: membership?.endDate,
      paymentStatus: admission.paymentStatus || membership?.paymentId?.status || 'pending',
      attendanceStatus: attendance?.checkInTime && !attendance?.checkOutTime ? 'present' : 'missing',
      qrStatus: membership?._id && membership.status === 'active' ? 'ready' : 'missing',
    };
  });

  const filteredRows = operationalRows.filter((row) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return [row.memberName, row.phone, row.membershipType, row.sports.join(' ')]
      .join(' ')
      .toLowerCase()
      .includes(term);
  }).map(row => {
    // Add actions menu items to each row
    row.actions = [
      { label: 'Renew', icon: <RefreshCw size={14} />, onClick: () => toast.info('Open Student Memberships to complete renewal.') },
      row.membership?._id && { label: 'Freeze', icon: <Snowflake size={14} />, onClick: () => freezeMutation.mutate(row.membership._id) },
      { label: 'Edit', icon: <Edit size={14} />, onClick: () => toast.info('Edit drawer will use the existing admission form in the next phase.') },
      { label: 'Attendance', icon: <CalendarCheck size={14} />, onClick: () => window.open(`/admin/attendance-desk?member=${row.student?._id || ''}`, '_self') },
      { label: 'QR', icon: <QrCode size={14} />, onClick: () => row.membership?._id ? navigator.clipboard.writeText(`MEMBERSHIP_${row.membership._id}`).then(() => toast.success('QR payload copied.')) : toast.error('No active membership QR') },
      { label: 'Payments', icon: <CreditCard size={14} />, onClick: () => window.open('/admin/payments', '_self') },
    ].filter(Boolean);
    return row;
  });

  const exportOperationalRows = () => {
    const headers = ['Member Name', 'Phone', 'Sport/Membership', 'Membership Type', 'Start Date', 'Expiry Date', 'Payment Status', 'Attendance Status', 'QR Status'];
    const rows = filteredRows.map(r => [
      r.memberName,
      r.phone,
      r.sports.join(' / '),
      r.membershipType,
      r.startDate ? new Date(r.startDate).toLocaleDateString('en-IN') : '',
      r.expiryDate ? new Date(r.expiryDate).toLocaleDateString('en-IN') : '',
      r.paymentStatus,
      r.attendanceStatus,
      r.qrStatus,
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `red-ball-members-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const legacyColumns = [
    { key: 'admissionNumber', label: 'Adm. No.', sortable: true, render: (r) => <span className="font-mono text-black text-xs">{r.admissionNumber}</span> },
    {
      key: 'name', label: 'Student', sortable: true, render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#E5E5E5] flex items-center justify-center text-xs font-bold text-[#111111]">{r.studentId?.name?.[0]}</div>
          <div>
            <p className="text-[#111111] font-medium text-sm">{r.studentId?.name}</p>
            <p className="text-xs text-[#888888]">{r.studentId?.email}</p>
          </div>
        </div>
      )
    },
    { key: 'phone', label: 'Phone', render: (r) => <span className="text-[#666666] text-sm">{r.phone || r.studentId?.phone}</span> },
    {
      key: 'sports', label: 'Sports', render: (r) => (
        <div className="flex gap-1 flex-wrap">{r.sportsIncluded?.map(s => <span key={s} className="badge badge-info text-[10px]">{s}</span>)}</div>
      )
    },
    {
      key: 'plan', label: 'Plan', render: (r) => (
        <span className="text-sm text-[#666]">{r.membershipId?.planId?.name || '—'}</span>
      )
    },
    { key: 'status', label: 'Status', render: (r) => <FeeBadge status={r.status} /> },
    {
      key: 'paymentStatus', label: 'Fees', render: (r) => (
        <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${r.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' :
            r.paymentStatus === 'partial' ? 'bg-blue-50 text-blue-700' :
              r.paymentStatus === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
          }`}>
          {r.paymentStatus || 'N/A'}
        </span>
      )
    },
    {
      key: 'actions', label: '', render: (r) => (
        <button
          onClick={() => setDeleteTarget(r)}
          className="btn-ghost text-xs gap-1 text-red-500 hover:bg-red-50 hover:text-red-700"
          title="Delete Admission"
        >
          <Trash2 size={14} />
        </button>
      )
    },
  ];

  const columns = [
    {
      key: 'name', label: 'Member Name', sortable: true, render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#111] flex items-center justify-center text-xs font-bold text-white">{r.memberName?.[0]}</div>
          <div>
            <p className="text-[#111111] font-medium text-sm">{r.memberName}</p>
            <p className="text-xs text-[#888888]">{r.admissionNumber}</p>
          </div>
        </div>
      )
    },
    { key: 'phone', label: 'Phone', render: (r) => <span className="text-[#666666] text-sm">{r.phone || '-'}</span> },
    {
      key: 'sports', label: 'Sport/Membership', render: (r) => (
        <div className="flex gap-1 flex-wrap">{r.sports?.map(s => <span key={s} className="badge badge-info text-[10px]">{s}</span>)}</div>
      )
    },
    { key: 'membershipType', label: 'Membership Type', render: r => <span className="text-sm font-medium text-[#111]">{r.membershipType}</span> },
    { key: 'startDate', label: 'Start Date', render: r => <span className="text-sm text-[#666]">{r.startDate ? new Date(r.startDate).toLocaleDateString('en-IN') : '-'}</span> },
    {
      key: 'expiryDate', label: 'Expiry Date', render: r => (
        <span className={`text-sm ${r.expiryDate && new Date(r.expiryDate) < new Date() ? 'text-red-600 font-bold' : 'text-[#666]'}`}>
          {r.expiryDate ? new Date(r.expiryDate).toLocaleDateString('en-IN') : '-'}
        </span>
      ),
    },
    { key: 'paymentStatus', label: 'Payment Status', render: r => getBadge(r.paymentStatus) },
    { key: 'attendanceStatus', label: 'Attendance Status', render: r => getBadge(r.attendanceStatus) },
    { key: 'qrStatus', label: 'QR Status', render: r => getBadge(r.qrStatus) },
    {
      key: 'actions',
      label: '',
      isActionMenu: true,
    },
  ];

  const sports = ['cricket', 'swimming', 'gym', 'turf', 'badminton', 'football', 'yoga'];

  const selectedPlan = plansData?.plans?.find(p => p._id === form.planId);

  return (
    <div>
      <PageHeader
        title="Admissions + Memberships"
        subtitle={`${filteredRows.length} operational records`}
        action={
          <div className="flex gap-2">
            <button className="btn-ghost gap-2" onClick={exportOperationalRows}>
              <Download size={16} /> Export
            </button>
            <button className="btn-primary" onClick={() => { setForm({ ...emptyForm }); setDrawerOpen(true); }}>
              + New Admission
            </button>
          </div>
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

      {(isLoading || membershipsLoading) ? <SkeletonTable /> : <DataTable columns={columns} data={filteredRows} />}

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
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Student Details */}
                <p className="text-xs font-semibold text-[#999] uppercase tracking-wider">Student Details</p>
                <div><label className="block text-sm text-[#666666] mb-1">Full Name *</label><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm text-[#666666] mb-1">Email *</label><input type="email" className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
                  <div><label className="block text-sm text-[#666666] mb-1">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-[#666666] mb-1">Gender</label>
                    <select className="input-field" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div><label className="block text-sm text-[#666666] mb-1">Emergency Contact</label><input className="input-field" value={form.emergencyContact} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} /></div>
                </div>
                <div><label className="block text-sm text-[#666666] mb-1">Address</label><textarea className="input-field h-16 resize-none" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>

                {/* Sports Access */}
                <p className="text-xs font-semibold text-[#999] uppercase tracking-wider pt-2">Sports Access</p>
                <div className="flex flex-wrap gap-2">
                  {sports.map(s => (
                    <button key={s} type="button"
                      onClick={() => setForm({ ...form, sportsIncluded: form.sportsIncluded.includes(s) ? form.sportsIncluded.filter(x => x !== s) : [...form.sportsIncluded, s] })}
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
                      <input type="radio" name="plan" className="accent-black" checked={form.planId === plan._id} onChange={() => setForm({ ...form, planId: plan._id })} />
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
                    <div className="grid grid-cols-1 gap-2">
                      {['upi'].map(mode => (
                        <button key={mode} type="button"
                          onClick={() => setForm({ ...form, paymentMode: mode })}
                          className={`py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${form.paymentMode === mode ? 'bg-black text-white' : 'btn-ghost'
                            }`}>
                          {mode === 'upi' ? 'UPI (Razorpay)' : 'Cash'}
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
                        {form.paymentMode === 'upi' && (
                          <p className="text-xs text-blue-600 mt-1">⚡ You'll be prompted to pay via Razorpay UPI before the admission is created.</p>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div><label className="block text-sm text-[#666666] mb-1">Notes</label><textarea className="input-field h-16 resize-none" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <button
                  type="submit"
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                  disabled={createMutation.isPending || razorpayLoading}
                >
                  {(createMutation.isPending || razorpayLoading)
                    ? <><Loader size={16} className="animate-spin" /> Processing...</>
                    : form.paymentMode === 'upi' && form.planId
                      ? '⚡ Pay via UPI & Create Admission'
                      : 'Create Admission'
                  }
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setDeleteTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                    <Trash2 size={18} className="text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[#111]">Delete Admission</h2>
                    <p className="text-xs text-[#888]">This action cannot be undone</p>
                  </div>
                </div>
                <div className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-xl p-3 mb-5 text-sm">
                  <p className="text-[#666]">You are about to permanently delete the admission for:</p>
                  <p className="font-semibold text-[#111] mt-1">{deleteTarget.studentId?.name}</p>
                  <p className="text-xs text-[#888]">{deleteTarget.admissionNumber} · {deleteTarget.studentId?.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteTarget(null)} className="btn-ghost flex-1 py-2.5">
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(deleteTarget._id)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
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
