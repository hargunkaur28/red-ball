import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Users, Clock, MapPin } from 'lucide-react';

const sports = ['cricket', 'badminton', 'swimming', 'gym', 'turf'];
const timeSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export default function Slots() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', sport: 'cricket', date: '', startTime: '09:00', endTime: '10:00', capacity: 10, pricePerSlot: 500, isPeakHour: false, peakHourMultiplier: 1.5 });
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllDates, setShowAllDates] = useState(false);

  const { data: slots } = useQuery({
    queryKey: ['slots', selectedDate, showAllDates],
    queryFn: () => {
      const url = showAllDates ? '/slots' : `/slots?date=${selectedDate}`;
      return api.get(url).then(r => r.data);
    },
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/slots', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      setForm({ name: '', sport: 'cricket', date: '', startTime: '09:00', endTime: '10:00', capacity: 10, pricePerSlot: 500, isPeakHour: false, peakHourMultiplier: 1.5 });
      setShowForm(false);
      toast.success('Slot created successfully!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/slots/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      toast.success('Slot deleted');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.date) {
      toast.error('Please fill all required fields');
      return;
    }
    
    // Calculate duration in minutes
    const [startHour, startMin] = form.startTime.split(':').map(Number);
    const [endHour, endMin] = form.endTime.split(':').map(Number);
    const startTotalMins = startHour * 60 + startMin;
    const endTotalMins = endHour * 60 + endMin;
    let duration = endTotalMins - startTotalMins;
    if (duration <= 0) duration += 24 * 60; // If end time is next day

    createMutation.mutate({
      ...form,
      duration,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'filling-fast':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'full':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'ongoing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getOccupancyPercent = (slot) => {
    return Math.round((slot.currentBookings / slot.capacity) * 100);
  };

  return (
    <div>
      <PageHeader title="Slot Bookings" subtitle="Manage arena & court availability" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Slot Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[#666666]">Create Slot</h3>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="btn-ghost text-xs gap-1">
                <Plus size={14} /> New
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-[#666666] mb-1">Slot Name *</label>
                <input className="input-field text-sm" placeholder="e.g., Court A" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">Sport</label>
                <select className="input-field bg-white text-sm" value={form.sport} onChange={e => setForm({...form, sport: e.target.value})}>
                  {sports.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#666666] mb-1">Date *</label>
                <input type="date" className="input-field text-sm" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[#666666] mb-1">Start Time</label>
                  <select className="input-field bg-white text-sm" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})}>
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#666666] mb-1">End Time</label>
                  <select className="input-field bg-white text-sm" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})}>
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-[#666666] mb-1">Capacity</label>
                  <input type="number" className="input-field text-sm" value={form.capacity} onChange={e => setForm({...form, capacity: parseInt(e.target.value) || 1})} min={1} />
                </div>
                <div>
                  <label className="block text-xs text-[#666666] mb-1">Price (₹)</label>
                  <input type="number" className="input-field text-sm" value={form.pricePerSlot} onChange={e => setForm({...form, pricePerSlot: parseInt(e.target.value) || 0})} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-[#666666]">
                <input type="checkbox" checked={form.isPeakHour} onChange={e => setForm({...form, isPeakHour: e.target.checked})} />
                Peak Hour (Multiplier: {form.peakHourMultiplier}x)
              </label>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary text-sm flex-1">Create</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost text-sm flex-1">Cancel</button>
              </div>
            </form>
          )}
        </motion.div>

        {/* Slots List */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[#666666]">
                {showAllDates ? 'All Slots' : `Slots for ${selectedDate}`}
              </h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-[#666666] cursor-pointer">
                  <input type="checkbox" checked={showAllDates} onChange={e => setShowAllDates(e.target.checked)} className="cursor-pointer" />
                  Show All Dates
                </label>
                {!showAllDates && (
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input-field text-sm" style={{ maxWidth: '150px' }} />
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {!slots?.slots?.length ? (
                <div className="text-center py-8 text-[#888888] text-sm">{showAllDates ? 'No slots available. Create one!' : 'No slots for this date. Create one!'}</div>
              ) : (
                slots.slots.map(slot => {
                  const occupancyPercent = getOccupancyPercent(slot);
                  const effectivePrice = slot.isPeakHour ? Math.round(slot.pricePerSlot * slot.peakHourMultiplier) : slot.pricePerSlot;
                  return (
                    <motion.div key={slot._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-4 rounded-xl border-2 ${getStatusColor(slot.status)}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-sm">{slot.name}</p>
                          <div className="flex gap-3 text-xs mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {slot.sport.toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {slot.startTime} - {slot.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={12} /> {slot.currentBookings}/{slot.capacity}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => { if (confirm('Delete this slot?')) deleteMutation.mutate(slot._id); }} className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Occupancy Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#666666]">Occupancy</span>
                          <span className="font-semibold">{occupancyPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              slot.status === 'full' ? 'bg-red-600' :
                              slot.status === 'filling-fast' ? 'bg-yellow-600' : 'bg-green-600'
                            }`}
                            style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-[#888888]">Status</span>
                          <p className="font-semibold">{slot.status}</p>
                        </div>
                        <div>
                          <span className="text-[#888888]">Price</span>
                          <p className="font-semibold">{formatCurrency(effectivePrice)}</p>
                        </div>
                        <div>
                          <span className="text-[#888888]">Duration</span>
                          <p className="font-semibold">{slot.duration} min</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bookings Summary */}
      {slots?.bookings?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mt-6">
          <h3 className="text-sm font-medium text-[#666666] mb-4">Today's Bookings</h3>
          <div className="space-y-2">
            {slots.bookings.map(booking => (
              <div key={booking._id} className="flex justify-between items-center p-3 rounded-lg bg-[#F7F7F7] border border-[#EAEAEA]">
                <div>
                  <p className="text-sm font-semibold text-[#111111]">{booking.playerName}</p>
                  <p className="text-xs text-[#666666]">{booking.numberOfPlayers} player(s) • {formatCurrency(booking.price)}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  booking.status === 'checked-in' ? 'bg-green-100 text-green-700' :
                  booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                  booking.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
