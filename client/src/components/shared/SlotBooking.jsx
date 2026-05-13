import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Users, MapPin } from 'lucide-react';
import api from '../../lib/axios';
import PaymentModal from './PaymentModal';
import { toast } from 'sonner';

const sportRates = {
  cricket: 500,
  football: 600,
  badminton: 350,
  swimming: 400,
  gym: 300,
  turf: 800,
};

const slotStatuses = {
  available: { color: 'bg-green-50 border-green-200', badge: 'Available' },
  'filling-fast': { color: 'bg-yellow-50 border-yellow-200', badge: 'Filling Fast' },
  full: { color: 'bg-red-50 border-red-200', badge: 'Full' },
  ongoing: { color: 'bg-blue-50 border-blue-200', badge: 'Ongoing' },
  completed: { color: 'bg-gray-50 border-gray-200', badge: 'Completed' },
};

export default function SlotBooking() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSport, setSelectedSport] = useState('cricket');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [form, setForm] = useState({
    playerName: '',
    playerPhone: '',
    playerEmail: '',
    numberOfPlayers: 1,
  });

  // Fetch available slots
  const { data: slotsData } = useQuery({
    queryKey: ['slots', selectedDate, selectedSport],
    queryFn: () =>
      api
        .get('/slots', {
          params: { date: selectedDate, sport: selectedSport },
        })
        .then((r) => r.data),
  });

  // Book slot mutation
  const bookingMutation = useMutation({
    mutationFn: (data) => api.post(`/slots/${selectedSlot._id}/book`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      setForm({ playerName: '', playerPhone: '', playerEmail: '', numberOfPlayers: 1 });
      setSelectedSlot(null);
      toast.success('Slot booked! Proceed to payment.');
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || 'Booking failed'),
  });

  const handleBooking = () => {
    if (!form.playerName.trim()) {
      toast.error('Please enter player name');
      return;
    }
    if (selectedSlot.currentBookings >= selectedSlot.capacity) {
      toast.error('Slot is now full');
      return;
    }
    bookingMutation.mutate(form);
  };

  // Get previous 7 days and next 30 days
  const getDateOptions = () => {
    const dates = [];
    const today = new Date();
    for (let i = -7; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-4 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111111]">Slot Booking</h1>
          <p className="text-sm text-[#666666] mt-1">
            Choose your preferred sport, date, and time slot
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card space-y-6"
            >
              {/* Date Picker */}
              <div>
                <label className="block text-sm font-semibold text-[#111111] mb-3">
                  Select Date
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {getDateOptions().map((date) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`w-full px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedDate === date
                          ? 'bg-black text-white'
                          : 'bg-[#F7F7F7] border border-[#EAEAEA] text-[#111111] hover:border-black'
                      }`}
                    >
                      {new Date(date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        weekday: 'short',
                      })}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sport Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#111111] mb-3">
                  Sport
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(sportRates).map((sport) => (
                    <button
                      key={sport}
                      onClick={() => setSelectedSport(sport)}
                      className={`py-2 rounded-lg text-sm transition-all capitalize ${
                        selectedSport === sport
                          ? 'bg-black text-white'
                          : 'btn-ghost'
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Main Area - Slots */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {!slotsData?.slots?.length ? (
                <div className="card text-center py-12">
                  <p className="text-[#666666]">No slots available for selected date/sport</p>
                </div>
              ) : (
                slotsData.slots.map((slot) => {
                  const occupancy = (slot.currentBookings / slot.capacity) * 100;
                  const statusInfo = slotStatuses[slot.status] || slotStatuses.available;
                  const isAvailable = slot.currentBookings < slot.capacity;

                  return (
                    <motion.div
                      key={slot._id}
                      whileHover={{ scale: isAvailable ? 1.02 : 1 }}
                      onClick={() => isAvailable && setSelectedSlot(slot)}
                      className={`card cursor-pointer transition-all ${
                        selectedSlot?._id === slot._id
                          ? 'ring-2 ring-black'
                          : ''
                      } ${!isAvailable ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-[#111111]">
                            {slot.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={14} className="text-[#666666]" />
                            <span className="text-sm text-[#666666]">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            slot.status === 'available'
                              ? 'bg-green-100 text-green-800'
                              : slot.status === 'filling-fast'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {statusInfo.badge}
                        </span>
                      </div>

                      {/* Occupancy Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-[#666666] mb-1">
                          <span>{slot.currentBookings}/{slot.capacity} Booked</span>
                          <span>{occupancy.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-[#EAEAEA] rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${occupancy}%` }}
                            className={`h-full ${
                              occupancy === 100
                                ? 'bg-red-500'
                                : occupancy >= 75
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-[#666666]">
                            <Users size={16} />
                            <span>Max {slot.capacity}</span>
                          </div>
                          {slot.isPeakHour && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                              Peak ({slot.peakHourMultiplier}x)
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#111111]">
                            ₹{slot.pricePerSlot}
                          </p>
                          <p className="text-xs text-[#666666]">per person</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </div>
        </div>

        {/* Booking Form - Shows when slot selected */}
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#EAEAEA] p-6 shadow-2xl"
          >
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-[#666666] mb-1">
                    Player Name *
                  </label>
                  <input
                    className="input-field"
                    value={form.playerName}
                    onChange={(e) =>
                      setForm({ ...form, playerName: e.target.value })
                    }
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#666666] mb-1">
                    Phone
                  </label>
                  <input
                    className="input-field"
                    value={form.playerPhone}
                    onChange={(e) =>
                      setForm({ ...form, playerPhone: e.target.value })
                    }
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#666666] mb-1">
                    Number of Players
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.numberOfPlayers}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        numberOfPlayers: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    min={1}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="btn-ghost flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBooking}
                    disabled={bookingMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    {bookingMutation.isPending ? 'Booking...' : 'Book Slot'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        paymentDetails={{
          amount: selectedSlot
            ? selectedSlot.pricePerSlot * form.numberOfPlayers
            : 0,
          type: 'one-time-play',
          description: `Slot booking for ${selectedSlot?.name}`,
        }}
        onSuccess={() => {
          setSelectedSlot(null);
          queryClient.invalidateQueries({ queryKey: ['slots'] });
        }}
      />
    </div>
  );
}
