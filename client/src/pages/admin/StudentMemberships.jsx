import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import SkeletonTable from '../../components/shared/SkeletonTable';
import { formatCurrency, calcGST } from '../../lib/utils';
import { RefreshCw, CheckCircle, AlertTriangle, Clock, Loader } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentMemberships() {
  const [tab, setTab] = useState('');
  const [renewModal, setRenewModal] = useState(null);
  const [renewForm, setRenewForm] = useState({ amountPaid: '', paymentMode: 'cash' });
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
    queryKey: ['all-memberships', tab],
    queryFn: () => api.get(`/memberships/all${tab ? `?status=${tab}` : ''}`).then(r => r.data),
  });

  const renewMutation = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/memberships/${id}/renew`, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['all-memberships'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      setRenewModal(null);
      setRazorpayLoading(false);
      toast.success(res.data?.message || 'Membership renewal processed successfully!');
    },
    onError: (e) => {
      setRazorpayLoading(false);
      toast.error(e.response?.data?.message || 'Error renewing membership');
    },
  });

  const handleRenewClick = (m) => {
    const gst = calcGST(m.planId?.price || 0, m.planId?.gstPercent || 18);
    setRenewModal({ ...m, gst });
    setRenewForm({ amountPaid: gst.totalAmount, paymentMode: 'cash' });
  };

  const handleRenewalSubmit = async (e) => {
    e.preventDefault();

    if (renewForm.paymentMode === 'cash') {
      renewMutation.mutate({
        id: renewModal._id,
        payload: { paymentMode: 'cash', amountPaid: parseFloat(renewForm.amountPaid) }
      });
      return;
    }

    // Razorpay UPI flow
    if (!scriptLoaded || !window.Razorpay) {
      toast.error('Payment gateway not loaded. Please wait and try again.');
      return;
    }

    const plan = renewModal.planId;
    const totalAmount = renewModal.gst.totalAmount;

    try {
      setRazorpayLoading(true);
      const { data: orderData } = await api.post('/payments/create-order', {
        amount: plan?.price,
        type: 'membership',
        referenceId: plan?._id,
        gstPercent: plan?.gstPercent || 18,
        customerName: renewModal.studentId?.name,
        description: `Renewal — ${plan?.name}`,
      });

      const options = {
        key: orderData.keyId,
        order_id: orderData.razorpayOrder.id,
        amount: orderData.razorpayOrder.amount,
        currency: 'INR',
        name: 'Red Ball Academy',
        description: `${plan?.name} Renewal`,
        theme: { color: '#000000' },
        method: { upi: true, card: false, netbanking: false, wallet: false },
        prefill: { name: renewModal.studentId?.name, contact: renewModal.studentId?.phone },
        handler: (response) => {
          renewMutation.mutate({
            id: renewModal._id,
            payload: {
              paymentMode: 'razorpay',
              amountPaid: totalAmount,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }
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
      toast.error(err.response?.data?.message || 'Failed to initiate payment.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <span className="badge badge-success gap-1"><CheckCircle size={12} /> Active</span>;
      case 'pending': return <span className="badge badge-warning gap-1"><Clock size={12} /> Pending</span>;
      case 'expired': return <span className="badge badge-danger gap-1"><AlertTriangle size={12} /> Expired</span>;
      case 'frozen': return <span className="badge badge-info gap-1">Frozen</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const columns = [
    {
      key: 'student', label: 'Student', render: r => (
        <div>
          <p className="font-semibold text-[#111]">{r.studentId?.name || 'Unknown'}</p>
          <p className="text-xs text-[#666]">{r.studentId?.phone}</p>
        </div>
      )
    },
    { key: 'plan', label: 'Plan', render: r => <span className="font-medium text-[#111]">{r.planId?.name || '—'}</span> },
    { key: 'status', label: 'Status', render: r => getStatusBadge(r.status) },
    {
      key: 'expiry', label: 'Expiry Date', render: r => (
        <span className={`text-sm ${r.status === 'expired' ? 'text-red-600 font-bold' : 'text-[#111]'}`}>
          {r.endDate ? new Date(r.endDate).toLocaleString('en-IN') : '—'}
        </span>
      )
    },
    {
      key: 'actions', label: '', render: r => (
        <button
          onClick={() => handleRenewClick(r)}
          className="btn-ghost text-xs gap-1 text-blue-600 hover:bg-blue-50"
        >
          <RefreshCw size={14} /> Renew
        </button>
      )
    },
  ];

  const tabs = [
    { value: '', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'expired', label: 'Expired' },
  ];

  return (
    <div>
      <PageHeader title="Student Memberships" subtitle="Manage student memberships and manual renewals" />

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${tab === t.value ? 'bg-black text-white' : 'btn-ghost'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? <SkeletonTable cols={5} /> : <DataTable columns={columns} data={data?.memberships || []} />}

      {/* POS Renewal Modal */}
      <AnimatePresence>
        {renewModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setRenewModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#111]">Renew Membership</h2>
                  <button onClick={() => setRenewModal(null)} className="text-[#888] hover:text-[#111]">✕</button>
                </div>

                <div className="bg-[#F7F7F7] border border-[#EAEAEA] p-3 rounded-xl mb-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#666]">Student:</span> <span className="font-semibold text-[#111]">{renewModal.studentId?.name}</span></div>
                  <div className="flex justify-between"><span className="text-[#666]">Plan:</span> <span>{renewModal.planId?.name}</span></div>
                  <div className="flex justify-between"><span className="text-[#666]">Renewal Amount:</span> <span>{formatCurrency(renewModal.gst.totalAmount)}</span></div>
                </div>

                <form onSubmit={handleRenewalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#666] mb-1">Amount Paid Now</label>
                    <input
                      type="number"
                      min="0"
                      max={renewModal.gst.totalAmount}
                      className="input-field text-lg font-bold"
                      value={renewForm.amountPaid}
                      onChange={e => setRenewForm({ ...renewForm, amountPaid: e.target.value })}
                      disabled={renewForm.paymentMode === 'razorpay'}
                      autoFocus
                    />
                    {renewForm.paymentMode === 'razorpay' && (
                      <p className="text-xs text-blue-600 mt-1">⚡ Full amount will be collected via Razorpay.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-[#666] mb-1">Payment Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'cash', label: 'Cash' },
                        { value: 'razorpay', label: 'UPI (Razorpay)' },
                      ].map(({ value, label }) => (
                        <button key={value} type="button"
                          onClick={() => setRenewForm({ ...renewForm, paymentMode: value, amountPaid: value === 'razorpay' ? renewModal.gst.totalAmount : renewForm.amountPaid })}
                          className={`py-2.5 rounded-lg text-sm font-medium transition-all ${renewForm.paymentMode === value ? 'bg-black text-white' : 'btn-ghost'
                            }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                    disabled={renewMutation.isPending || razorpayLoading || renewForm.amountPaid === ''}
                  >
                    {(renewMutation.isPending || razorpayLoading)
                      ? <><Loader size={16} className="animate-spin" /> Processing...</>
                      : renewForm.paymentMode === 'razorpay'
                        ? '⚡ Pay via UPI & Renew'
                        : 'Confirm Renewal'
                    }
                  </button>
                  <p className="text-xs text-center text-[#888]">Note: If partial amount is paid, membership will remain pending until full payment is collected.</p>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
