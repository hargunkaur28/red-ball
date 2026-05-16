import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import SkeletonTable from '../../components/shared/SkeletonTable';
import FeeBadge from '../../components/shared/FeeBadge';
import { formatCurrency } from '../../lib/utils';
import { Printer, CheckCircle, RotateCcw, Loader } from 'lucide-react';
import { toast } from 'sonner';

export default function Payments() {
  const [tab, setTab] = useState('');
  const [collectModal, setCollectModal] = useState(null);
  const [collectForm, setCollectForm] = useState({ amountPaid: 0, paymentMode: 'cash' });
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
    queryKey: ['payments', tab],
    queryFn: () => api.get(`/payments?status=${tab}`).then(r => r.data),
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, ...payload }) => api.post(`/payments/${id}/mark-paid`, payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['admissions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      setCollectModal(null);
      setRazorpayLoading(false);
      toast.success(res.data?.message || 'Payment recorded successfully!');
    },
    onError: (e) => {
      setRazorpayLoading(false);
      toast.error(e.response?.data?.message || 'Error');
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, reason }) => api.put(`/payments/${id}/refund`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Payment refunded.');
    },
  });

  const openInvoice = (paymentId) => {
    window.open(`/api/payments/${paymentId}/invoice/print`, '_blank');
  };

  const handleCollectClick = (payment) => {
    setCollectModal(payment);
    const due = payment.remainingAmount !== undefined ? payment.remainingAmount : payment.totalAmount;
    setCollectForm({ amountPaid: Math.ceil(due), paymentMode: 'cash' });
  };

  const handleCollectionSubmit = async (e) => {
    e.preventDefault();

    if (collectForm.paymentMode === 'cash') {
      markPaidMutation.mutate({
        id: collectModal._id,
        paymentMode: 'cash',
        amountPaid: parseFloat(collectForm.amountPaid)
      });
      return;
    }

    // Razorpay UPI flow
    if (!scriptLoaded || !window.Razorpay) {
      toast.error('Payment gateway not loaded. Please wait and try again.');
      return;
    }

    const amountDue = collectModal.remainingAmount !== undefined ? collectModal.remainingAmount : collectModal.totalAmount;

    try {
      setRazorpayLoading(true);
      const { data: orderData } = await api.post('/payments/create-order', {
        amount: amountDue,
        type: collectModal.type,
        referenceId: collectModal.referenceId,
        gstPercent: collectModal.gstPercent || 0,
        customerName: collectModal.customerName || collectModal.studentId?.name,
        description: `Payment Collection - ${collectModal.invoiceNumber}`,
      });

      const options = {
        key: orderData.keyId,
        order_id: orderData.razorpayOrder.id,
        amount: orderData.razorpayOrder.amount,
        currency: 'INR',
        name: 'Red Ball Academy',
        description: `Payment Collection - ${collectModal.invoiceNumber}`,
        theme: { color: '#000000' },
        method: { upi: true, card: false, netbanking: false, wallet: false },
        prefill: {
          name: collectModal.customerName || collectModal.studentId?.name,
          contact: collectModal.studentId?.phone
        },
        handler: (response) => {
          markPaidMutation.mutate({
            id: collectModal._id,
            paymentMode: 'razorpay',
            amountPaid: amountDue,
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
      toast.error(err.response?.data?.message || 'Failed to initiate payment.');
    }
  };

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice', sortable: true, render: r => <span className="font-mono text-black text-xs">{r.invoiceNumber}</span> },
    { key: 'student', label: 'Customer', render: r => <span className="text-[#111111] text-sm">{r.customerName || r.studentId?.name || 'Unknown'}</span> },
    {
      key: 'type', label: 'Type', render: r => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${r.type === 'membership' ? 'bg-blue-50 text-blue-700' :
            r.type === 'one-time-play' ? 'bg-purple-50 text-purple-700' :
              r.type === 'restaurant' ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600'
          }`}>
          {r.type}
        </span>
      )
    },
    { key: 'total', label: 'Total', sortable: true, render: r => <span className="font-semibold text-[#111111] text-sm">{formatCurrency(r.totalAmount)}</span> },
    { key: 'paid', label: 'Paid', render: r => <span className="text-green-600 text-sm">{formatCurrency(r.amountPaid || 0)}</span> },
    { key: 'due', label: 'Due', render: r => <span className="text-amber-600 font-bold text-sm">{formatCurrency(r.remainingAmount !== undefined ? r.remainingAmount : r.totalAmount)}</span> },
    { key: 'status', label: 'Status', render: r => <FeeBadge status={r.status} /> },
    { key: 'mode', label: 'Mode', render: r => <span className="text-[#666666] text-xs capitalize">{r.paymentMode || '—'}</span> },
    {
      key: 'actions', label: '', render: r => (
        <div className="flex gap-1">
          {(r.status === 'pending' || r.status === 'partial') && (
            <button
              onClick={() => handleCollectClick(r)}
              className="btn-ghost text-xs gap-1 text-green-700 hover:bg-green-50"
              title="Collect Payment"
            >
              <CheckCircle size={14} /> Collect
            </button>
          )}
          {r.status === 'paid' && (
            <button onClick={() => openInvoice(r._id)} className="btn-ghost text-xs gap-1" title="Print Invoice">
              <Printer size={14} /> Invoice
            </button>
          )}
          {(r.status === 'paid' || r.status === 'partial') && (
            <button
              onClick={() => { if (confirm('Are you sure you want to refund?')) refundMutation.mutate({ id: r._id, reason: 'Admin refund' }); }}
              className="btn-ghost text-xs gap-1 text-red-600 hover:bg-red-50"
              title="Refund"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      )
    },
  ];

  const tabs = [
    { value: '', label: 'All' },
    { value: 'pending', label: `Pending${data?.pendingTotal ? ` (₹${data.pendingTotal.toLocaleString('en-IN')})` : ''}` },
    { value: 'partial', label: 'Partial' },
    { value: 'paid', label: 'Paid' },
    { value: 'refunded', label: 'Refunded' },
  ];

  return (
    <div>
      <PageHeader title="Payments & Invoices" subtitle="Track all payments, manual POS collection, and pending dues" />

      {/* Summary Bar */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA]">
            <p className="text-xs text-[#888]">Total Records</p>
            <p className="text-lg font-bold text-[#111]">{data.total}</p>
          </div>
          <div className="p-3 rounded-xl bg-green-50 border border-green-100">
            <p className="text-xs text-green-600">Total Collected</p>
            <p className="text-lg font-bold text-green-700">{formatCurrency(data.paidTotal)}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-xs text-amber-600">Pending Collection</p>
            <p className="text-lg font-bold text-amber-700">{formatCurrency(data.pendingTotal)}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA]">
            <p className="text-xs text-[#888]">This Page</p>
            <p className="text-lg font-bold text-[#111]">{data.payments?.length}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${tab === t.value ? 'bg-black text-white' : 'btn-ghost'}`}>{t.label}</button>
        ))}
      </div>

      {isLoading ? <SkeletonTable cols={9} /> : <DataTable columns={columns} data={data?.payments || []} />}

      {/* POS Collection Modal */}
      <AnimatePresence>
        {collectModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setCollectModal(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-sm card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[#111]">Collect Payment</h2>
                  <button onClick={() => setCollectModal(null)} className="text-[#888] hover:text-[#111]">✕</button>
                </div>

                <div className="bg-[#F7F7F7] border border-[#EAEAEA] p-3 rounded-xl mb-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#666]">Invoice:</span> <span className="font-mono">{collectModal.invoiceNumber}</span></div>
                  <div className="flex justify-between"><span className="text-[#666]">Total Amount:</span> <span>{formatCurrency(collectModal.totalAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-[#666]">Already Paid:</span> <span className="text-green-600">{formatCurrency(collectModal.amountPaid || 0)}</span></div>
                  <div className="flex justify-between font-bold pt-2 border-t border-[#EAEAEA]"><span className="text-[#111]">Amount Due:</span> <span className="text-amber-600">{formatCurrency(collectModal.remainingAmount !== undefined ? collectModal.remainingAmount : collectModal.totalAmount)}</span></div>
                </div>

                <form onSubmit={handleCollectionSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#666] mb-1">Paying Amount</label>
                    <input
                      type="number"
                      min="1"
                      max={Math.ceil(collectModal.remainingAmount !== undefined ? collectModal.remainingAmount : collectModal.totalAmount)}
                      className="input-field text-lg font-bold"
                      value={collectForm.amountPaid}
                      onChange={e => setCollectForm({ ...collectForm, amountPaid: e.target.value })}
                      disabled={collectForm.paymentMode === 'razorpay'}
                      autoFocus
                    />
                    {collectForm.paymentMode === 'razorpay' && (
                      <p className="text-xs text-blue-600 mt-1">⚡ Full remaining amount will be collected via Razorpay.</p>
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
                          onClick={() => setCollectForm({
                            ...collectForm,
                            paymentMode: value,
                            amountPaid: value === 'razorpay' ? Math.ceil(collectModal.remainingAmount !== undefined ? collectModal.remainingAmount : collectModal.totalAmount) : collectForm.amountPaid
                          })}
                          className={`py-2.5 rounded-lg text-sm font-medium transition-all ${collectForm.paymentMode === value ? 'bg-black text-white' : 'btn-ghost'
                            }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                    disabled={markPaidMutation.isPending || razorpayLoading || !collectForm.amountPaid}
                  >
                    {(markPaidMutation.isPending || razorpayLoading)
                      ? <><Loader size={16} className="animate-spin" /> Processing...</>
                      : collectForm.paymentMode === 'razorpay'
                        ? '⚡ Pay via UPI & Collect'
                        : 'Confirm Payment'
                    }
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
