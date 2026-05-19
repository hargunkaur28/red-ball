import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import { formatCurrency } from '../lib/utils';

const sports = ['cricket', 'swimming', 'gym', 'turf', 'badminton', 'pickleball'];

export default function OneTimeBookingPortal() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    sport: 'cricket',
    date: new Date().toISOString().slice(0, 10),
    slotId: '',
    duration: 60,
    paymentMethod: 'cash',
  });
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['public-services'],
    queryFn: () => api.get('/services').then(r => r.data),
  });

  const services = useMemo(
    () => (servicesData?.services || []).filter(s => s.isActive),
    [servicesData]
  );

  const selectedService = services.find(s => s._id === form.slotId);
  const baseAmount = selectedService ? selectedService.hourlyPrice : 0;
  const totalAmount = Math.round(baseAmount * 1.18);

  const submitCashBooking = async () => {
    const { data: result } = await api.post('/slots/public-booking', form);
    setSuccess(result);
    toast.success('Booking request sent to reception.');
  };

  const submitRazorpayBooking = async () => {
    if (!scriptLoaded || !window.Razorpay) {
      toast.error('Payment gateway is still loading.');
      return;
    }
    const { data: order } = await api.post('/slots/public-booking/order', {
      slotId: form.slotId,
      duration: form.duration,
    });

    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.razorpayOrder.id,
      amount: order.razorpayOrder.amount,
      currency: order.razorpayOrder.currency,
      name: 'Red Ball Academy',
      description: `${form.sport} one-time booking`,
      theme: { color: '#C8102E' },
      prefill: { name: form.name, email: form.email, contact: form.phone },
      handler: async (response) => {
        const { data: result } = await api.post('/slots/public-booking', {
          ...form,
          paymentMethod: 'razorpay',
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        setSuccess(result);
        toast.success('Booking confirmed.');
      },
      modal: {
        ondismiss: async () => {
          toast.info('Payment not completed. Creating a pending booking...');
          try {
            const { data: result } = await api.post('/slots/public-booking', {
              ...form,
              paymentMethod: 'cash', // Force cash flow for pending status
            });
            setSuccess(result);
            toast.success('Booking request sent to reception.');
          } catch (error) {
            toast.error('Failed to create pending booking.');
          }
        },
      },
    });
    rzp.open();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.slotId) {
      toast.error('Please complete all required details.');
      return;
    }
    setSubmitting(true);
    try {
      if (form.paymentMethod === 'cash') await submitCashBooking();
      else await submitRazorpayBooking();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md rounded-3xl bg-[#161616] border border-white/10 p-8 text-center shadow-2xl">
          <CheckCircle2 size={64} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-3xl font-bold mb-2">Booking Received</h1>
          <p className="text-sm text-white/60 mb-5">{success.message}</p>
          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 text-left text-sm space-y-2">
            <div className="flex justify-between"><span className="text-white/50">Booking ID</span><span className="font-mono">{success.booking?.bookingId}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Status</span><span className="capitalize">{success.booking?.status}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Payment</span><span className="capitalize">{success.booking?.paymentStatus}</span></div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#C8102E] flex items-center justify-center"><QrCode /></div>
          <div>
            <h1 className="text-3xl font-bold">One-Time Play Booking</h1>
            <p className="text-sm text-white/55">Choose a service and confirm payment for entry.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl bg-white text-[#111] p-5 md:p-7 shadow-2xl space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="input-field" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            <input className="input-field" type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input className="input-field" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select className="input-field bg-white capitalize" value={form.sport} onChange={e => setForm({ ...form, sport: e.target.value, slotId: '' })}>
              {sports.map(sport => <option key={sport} value={sport}>{sport}</option>)}
            </select>
            <input className="input-field" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value, slotId: '' })} />
            <select className="input-field bg-white" value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })}>
              {[30, 60, 90, 120].map(min => <option key={min} value={min}>{min} min</option>)}
            </select>
            <select className="input-field bg-white" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
              <option value="cash">Cash at reception</option>
              <option value="razorpay">Razorpay / UPI</option>
            </select>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#666] mb-2">Available Services</p>
            {isLoading ? (
              <div className="text-sm text-[#666]">Loading services...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map(service => (
                  <button key={service._id} type="button" onClick={() => setForm({ ...form, slotId: service._id })}
                    className={`p-4 rounded-2xl border text-left transition-all ${form.slotId === service._id ? 'border-black bg-[#F7F7F7]' : 'border-[#EAEAEA] hover:border-[#111]'}`}>
                    <p className="font-bold">{service.name}</p>
                    <p className="text-xs text-[#666]">{service.description || 'Service'}</p>
                    <p className="text-sm font-bold mt-2">{formatCurrency(service.hourlyPrice)} / hr</p>
                  </button>
                ))}
                {services.length === 0 && <div className="text-sm text-[#888]">No services available.</div>}
              </div>
            )}
          </div>

          {selectedService && (
            <div className="rounded-2xl bg-[#F7F7F7] border border-[#EAEAEA] p-4 flex justify-between text-sm">
              <span>Total with GST</span>
              <span className="font-bold">{formatCurrency(totalAmount)}</span>
            </div>
          )}

          <button className="btn-primary w-full py-3 justify-center" disabled={submitting || !form.slotId}>
            {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {form.paymentMethod === 'cash' ? 'Request Cash Booking' : 'Pay & Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}
