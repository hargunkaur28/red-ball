import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, ShieldAlert, Trash2, Plus, X, Loader2, MapPin, Info } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';
import PageHeader from '../../components/shared/PageHeader';
import { formatDate } from '../../lib/utils';

export default function ScheduleBlocking() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: blockedSlots, isLoading } = useQuery({
    queryKey: ['blocked-schedules', selectedDate],
    queryFn: () => api.get('/blocked-schedules', { params: { date: selectedDate } }).then(res => res.data.blocked),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/blocked-schedules', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocked-schedules'] });
      toast.success('Schedule blocked successfully');
      setIsModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/blocked-schedules/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocked-schedules'] });
      toast.success('Block removed');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    createMutation.mutate(data);
  };

  return (
    <div className="pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <PageHeader 
          title="Schedule Blocking" 
          subtitle="Reserve arenas for maintenance, private events, or coaching batches" 
        />
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary w-full sm:w-auto gap-2 h-11"
        >
          <Plus size={20} /> Create New Block
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Calendar/Filter */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarIcon size={18} className="text-[#C8102E]" />
              Select Date
            </h3>
            <input 
              type="date" 
              className="input-field" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="bg-[#C8102E]/5 border border-[#C8102E]/10 rounded-3xl p-6">
            <div className="flex gap-3 mb-4 text-[#C8102E]">
              <Info size={24} />
              <h4 className="font-bold">Blocking Logic</h4>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Blocked periods will prevent customers from booking slots during these times. 
              Existing bookings will NOT be cancelled automatically. Please manually reschedule or cancel conflicting bookings.
            </p>
          </div>
        </div>

        {/* Right: List of Blocks */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-gray-300" /></div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode='popLayout'>
                {blockedSlots?.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium">No blocks scheduled for this date</p>
                  </div>
                ) : (
                  blockedSlots?.map((block) => (
                    <motion.div
                      key={block._id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="card p-5 flex items-center justify-between border border-gray-100 hover:border-[#C8102E]/20 transition-colors"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                          <ShieldAlert size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-black text-gray-900 tracking-tight">{block.startTime} - {block.endTime}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                              Blocked
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><MapPin size={14} /> {block.arena}</span>
                            <span className="text-gray-300">|</span>
                            <span className="italic">{block.reason || 'No reason provided'}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => { if(confirm('Remove this block?')) deleteMutation.mutate(block._id); }}
                        className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Create Block Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden z-10"
            >
              <div className="p-6 border-b flex items-center justify-between bg-[#C8102E] text-white">
                <h2 className="text-xl font-bold flex items-center gap-2"><ShieldAlert size={24} /> Create Time Block</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arena / Court Name</label>
                  <input name="arena" required className="input-field" placeholder="e.g., Cricket Turf A, Badminton Court 1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input name="date" type="date" defaultValue={selectedDate} required className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <select name="reason" className="input-field">
                      <option value="Maintenance">Maintenance</option>
                      <option value="Private Event">Private Event</option>
                      <option value="Coaching Batch">Coaching Batch</option>
                      <option value="Tournament">Tournament</option>
                      <option value="VIP Reservation">VIP Reservation</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input name="startTime" type="time" required className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input name="endTime" type="time" required className="input-field" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <input type="checkbox" name="recurring" id="recurring" className="w-5 h-5 rounded border-gray-300 text-[#C8102E] focus:ring-[#C8102E]" />
                  <label htmlFor="recurring" className="text-sm font-medium text-amber-900">Make this a recurring block (Daily)</label>
                </div>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="btn-primary w-full h-12 gap-2 mt-4"
                >
                  {createMutation.isPending ? <Loader2 className="animate-spin" /> : 'Confirm Time Block'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
