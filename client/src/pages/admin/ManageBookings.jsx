import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, MoreVertical, Search, Filter, Loader2, QrCode, RefreshCcw } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function ManageBookings() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings', statusFilter],
    queryFn: () => api.get('/bookings', { params: { status: statusFilter !== 'all' ? statusFilter : undefined } }).then(res => res.data.bookings),
  });

  const checkInMutation = useMutation({
    mutationFn: (id) => api.post(`/bookings/${id}/check-in`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Player checked in successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Check-in failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => api.post(`/bookings/${id}/cancel`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking cancelled');
    },
  });

  const filteredBookings = bookings?.filter(b => 
    b.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.slotName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'checked-in': return 'bg-green-50 text-green-600 border-green-100';
      case 'completed': return 'bg-gray-50 text-gray-600 border-gray-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="pb-24">
      <PageHeader 
        title="Booking Management" 
        subtitle="Track, reschedule, and manage player session bookings live" 
      />

      <div className="flex flex-col md:flex-row gap-4 mb-8 mt-6">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search bookings by player or service..." 
            className="input-field pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {['all', 'pending', 'confirmed', 'checked-in', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${
                statusFilter === status 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {filteredBookings?.map((booking) => (
            <motion.div
              key={booking._id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card p-5 border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-[#C8102E]/5 text-[#C8102E]">
                    <QrCode size={20} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{booking.slotName || 'Service Session'}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Calendar size={14} />
                  <span>{formatDate(booking.createdAt)}</span>
                  <span className="text-gray-300">•</span>
                  <Clock size={14} />
                  <span>{booking.startTime} - {booking.endTime}</span>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 space-y-2 mb-4 border border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <User size={14} className="text-gray-400" />
                    <span className="font-bold">{booking.playerName}</span>
                  </div>
                  {booking.playerPhone && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone size={14} className="text-gray-400" />
                      <span>{booking.playerPhone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between py-3 border-t border-gray-100 mb-4">
                  <span className="text-xs text-gray-500 font-medium">Total Paid</span>
                  <span className="text-sm font-bold text-gray-900">{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {booking.status === 'confirmed' && (
                  <button 
                    onClick={() => checkInMutation.mutate(booking._id)}
                    className="flex-1 btn-primary h-10 text-xs gap-2"
                  >
                    <CheckCircle size={16} /> Check-In
                  </button>
                )}
                {['pending', 'confirmed'].includes(booking.status) && (
                  <button 
                    onClick={() => { const r = prompt('Reason for cancellation?'); if(r) cancelMutation.mutate({id: booking._id, reason: r}); }}
                    className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100 transition-colors"
                  >
                    <XCircle size={18} />
                  </button>
                )}
                {booking.status === 'checked-in' && (
                  <div className="flex-1 py-2 rounded-xl bg-green-50 text-green-600 text-center text-xs font-bold border border-green-100">
                    Currently Playing
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredBookings?.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
            <RefreshCcw size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No bookings found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  );
}
