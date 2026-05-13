import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency, calcGST } from '../../lib/utils';
import { toast } from 'sonner';
import { X, AlertCircle, CheckCircle, Loader, Trash2 } from 'lucide-react';

const sportRates = { cricket: 500, swimming: 400, gym: 300, turf: 800, badminton: 350 };

export default function OneTimePlay() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', sport: 'cricket', hours: 1, ratePerHour: 500, amountPaid: '', paymentMode: 'cash', slotId: '' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const gst = calcGST(form.hours * form.ratePerHour);
  const today = new Date().toISOString().split('T')[0];

  const { data: entries } = useQuery({ queryKey: ['onetimeplay'], queryFn: () => api.get('/onetimeplay').then(r => r.data) });
  const { data: slotsData } = useQuery({ queryKey: ['slots', today, form.sport], queryFn: () => api.get(`/slots?date=${today}&sport=${form.sport}`).then(r => r.data) });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const mutation = useMutation({
    mutationFn: (d) => api.post('/onetimeplay', d),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['onetimeplay'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      const slotToBook = form.slotId; // Capture slot before form reset
      const playerName = form.name;
      setForm({ name: '', phone: '', sport: 'cricket', hours: 1, ratePerHour: 500, amountPaid: '', paymentMode: 'cash', slotId: '' }); 
      setShowPaymentModal(false);
      setPaymentStatus(null);
      toast.success('Entry recorded! Payment & receipt generated.'); 
      
      // Book slot after form submission (async)
      if (slotToBook) {
        api.post(`/slots/${slotToBook}/book`, {
          playerName: playerName,
          numberOfPlayers: 1,
          bookingType: 'one-time-play',
        })
        .then(() => {
          toast.success('Slot booked successfully!');
          queryClient.invalidateQueries({ queryKey: ['slots'] });
        })
        .catch(e => {
          console.error('Slot booking error:', e);
          toast.error('Slot booking failed: ' + (e.response?.data?.message || e.message));
        });
      }
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || 'Error');
      setPaymentStatus(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/onetimeplay/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onetimeplay'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Entry deleted successfully');
    },
    onError: (e) => {
      toast.error(e.response?.data?.message || 'Failed to delete entry');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    // For cash payment, submit directly
    if (form.paymentMode === 'cash') {
      const dataToSubmit = {
        ...form,
        hours: parseInt(form.hours) || 1,
        ratePerHour: parseInt(form.ratePerHour) || 0,
        amountPaid: form.amountPaid ? parseFloat(form.amountPaid) : 0,
      };
      mutation.mutate(dataToSubmit);
    } else {
      // For UPI/Card, show Razorpay modal
      setShowPaymentModal(true);
      handleRazorpayPayment();
    }
  };

  const handleRazorpayPayment = async () => {
    if (!scriptLoaded || !window.Razorpay) {
      toast.error('Payment gateway not loaded');
      return;
    }

    try {
      setPaymentStatus('processing');

      // Create order
      const { data } = await api.post('/onetimeplay/create-razorpay-order', {
        amount: gst.amount,
        gstAmount: gst.gstAmount,
        description: `${form.sport.toUpperCase()} - ${form.name}`,
      });

      const options = {
        key: data.key,
        order_id: data.orderId,
        amount: data.amount,
        currency: 'INR',
        description: `${form.sport.toUpperCase()} - ${form.name}`,
        theme: { color: '#000000' },
        handler: async (response) => {
          try {
            // Submit form with payment details
            mutation.mutate({
              ...form,
              amountPaid: gst.totalAmount,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
            });
            setPaymentStatus('success');
          } catch (error) {
            setPaymentStatus('failed');
            toast.error('Failed to process payment');
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus(null);
            setShowPaymentModal(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      setPaymentStatus('failed');
      toast.error(error.response?.data?.message || 'Failed to create payment order');
      setTimeout(() => {
        setPaymentStatus(null);
        setShowPaymentModal(false);
      }, 2000);
    }
  };

  return (
    <div>
      <PageHeader title="One-Time Play" subtitle="Quick POS for walk-in players" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* POS Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card">
          <h3 className="text-sm font-medium text-[#666666] mb-4">New Entry</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm text-[#666666] mb-1">Name *</label><input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><label className="block text-sm text-[#666666] mb-1">Phone</label><input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div>
              <label className="block text-sm text-[#666666] mb-1">Slot (Optional)</label>
              <select className="input-field bg-white" value={form.slotId} onChange={e => setForm({...form, slotId: e.target.value})}>
                <option value="">— No slot —</option>
                {slotsData?.slots?.filter(s => s.currentBookings < s.capacity).map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.startTime}-{s.endTime}) - {s.capacity - s.currentBookings} spots</option>
                ))}
              </select>
            </div>
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

            {/* POS Payment Collection */}
            <div className="pt-4 border-t border-[#EAEAEA]">
              <h4 className="text-sm font-semibold text-[#111] mb-3">Collect Payment</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-[#666] mb-1">Amount Paid Now (₹)</label>
                  <input type="number" className="input-field" placeholder={`Full: ${gst.totalAmount}`} value={form.amountPaid} onChange={e => setForm({...form, amountPaid: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs text-[#666] mb-1">Payment Mode</label>
                  <select className="input-field bg-white" value={form.paymentMode} onChange={e => setForm({...form, paymentMode: e.target.value})}>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={mutation.isPending}>
              {form.paymentMode === 'cash' ? 'Record Entry' : 'Pay with Razorpay'}
            </button>
          </form>
        </motion.div>

        {/* Today's entries */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#666666]">Recent Entries</h3>
            {entries?.todayTotal > 0 && (
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">Today: {formatCurrency(entries.todayTotal)}</span>
            )}
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {!entries?.plays?.length ? (
              <div className="text-center py-8 text-[#888888] text-sm">No entries yet. Start by adding one!</div>
            ) : (
              entries.plays.map((entry) => (
                <div key={entry._id} className="p-3 rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] flex justify-between items-center group hover:border-[#CCCCCC] transition-all">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#111111]">{entry.name}</p>
                    <p className="text-xs text-[#666666]">{entry.sport} • {entry.hours} hr(s)</p>
                  </div>
                  <div className="text-right mr-3">
                    <p className="text-sm font-bold text-[#111111]">{formatCurrency(entry.totalAmount)}</p>
                    <p className="text-[10px] text-[#888888]">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete entry for ${entry.name}? This will also delete the associated payment.`)) {
                        deleteMutation.mutate(entry._id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-[#888888] hover:text-red-600 transition-colors disabled:opacity-50 p-1"
                    title="Delete entry"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Razorpay Payment Modal */}
      {showPaymentModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EAEAEA]">
              <h2 className="text-xl font-bold text-[#111111]">Complete Payment</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentStatus(null);
                }}
                disabled={paymentStatus === 'processing'}
                className="text-[#666666] hover:text-[#111111] transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {paymentStatus === 'success' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center space-y-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center"
                  >
                    <CheckCircle size={64} className="text-green-600" />
                  </motion.div>
                  <div>
                    <p className="text-lg font-bold text-[#111111]">Payment Successful!</p>
                    <p className="text-sm text-[#666666] mt-2">Entry recorded with payment.</p>
                  </div>
                </motion.div>
              ) : paymentStatus === 'failed' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center space-y-4"
                >
                  <AlertCircle size={64} className="text-red-600 mx-auto" />
                  <div>
                    <p className="text-lg font-bold text-[#111111]">Payment Failed</p>
                    <p className="text-sm text-[#666666] mt-2">Please try again.</p>
                  </div>
                </motion.div>
              ) : paymentStatus === 'processing' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                    <Loader size={48} className="text-[#111111] mx-auto" />
                  </motion.div>
                  <p className="text-sm text-[#666666]">Opening Razorpay...</p>
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
