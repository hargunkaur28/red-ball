import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  MapPin,
  DollarSign,
  Activity,
  CheckCircle,
  Calendar as CalendarIcon,
  Plus,
  X,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShieldAlert
} from 'lucide-react';
import api from '../../lib/axios';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

export default function OperationalDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('timeline'); // 'occupancy', 'timeline', 'schedule'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGroundFilter, setSelectedGroundFilter] = useState('All');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); // For view/reschedule
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const groundsList = ['Court A', 'Court B', 'Turf 1', 'Main Ground', 'Swimming Pool', 'Gym Area'];
  const sportOptions = ['cricket', 'football', 'badminton', 'swimming', 'gym', 'turf'];
  const eventTypes = ['coaching', 'one-time-play', 'club-booking', 'maintenance', 'cleaning', 'event'];

  // Form states
  const [createForm, setCreateForm] = useState({
    title: '',
    eventType: 'coaching',
    ground: 'Court A',
    sport: 'cricket',
    startTime: '10:00',
    endTime: '11:00',
    date: new Date().toISOString().split('T')[0],
    maxCapacity: 20,
    description: ''
  });

  const [rescheduleForm, setRescheduleForm] = useState({
    newStartTime: '',
    newEndTime: '',
    newGround: '',
    date: ''
  });

  // Queries
  const { data: groundsData } = useQuery({
    queryKey: ['operations:grounds'],
    queryFn: () => api.get('/operations/grounds').then((r) => r.data),
    refetchInterval: 5000,
  });

  const { data: timelineData, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['operations:timeline', selectedDate, selectedGroundFilter],
    queryFn: () => api.get('/operations/timeline', {
      params: { 
        date: selectedDate, 
        ...(selectedGroundFilter !== 'All' && { ground: selectedGroundFilter }) 
      }
    }).then((r) => r.data),
  });

  const { data: scheduleData, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['operations:schedule', selectedDate],
    queryFn: () => {
      const start = new Date(selectedDate);
      start.setDate(start.getDate() - 3);
      const end = new Date(selectedDate);
      end.setDate(end.getDate() + 10);
      return api.get('/operations/schedule', {
        params: { 
          startDate: start.toISOString().split('T')[0], 
          endDate: end.toISOString().split('T')[0] 
        }
      }).then((r) => r.data);
    },
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance:today'],
    queryFn: () => api.get('/attendance/today').then((r) => r.data),
    refetchInterval: 10000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics:dashboard'],
    queryFn: () => api.get('/analytics/dashboard').then((r) => r.data),
  });

  const { data: paymentData } = useQuery({
    queryKey: ['payments', { page: 1, limit: 5 }],
    queryFn: () => api.get('/payments', { params: { page: 1, limit: 5 } }).then((r) => r.data),
    refetchInterval: 15000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/operations/events', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations:timeline'] });
      queryClient.invalidateQueries({ queryKey: ['operations:schedule'] });
      queryClient.invalidateQueries({ queryKey: ['operations:grounds'] });
      toast.success('Event scheduled successfully!');
      setShowCreateModal(false);
      setCreateForm({
        title: '', eventType: 'coaching', ground: 'Court A', sport: 'cricket',
        startTime: '10:00', endTime: '11:00', date: selectedDate, maxCapacity: 20, description: ''
      });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Scheduling failed'),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, data }) => api.post(`/operations/events/${id}/reschedule`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations:timeline'] });
      queryClient.invalidateQueries({ queryKey: ['operations:schedule'] });
      queryClient.invalidateQueries({ queryKey: ['operations:grounds'] });
      toast.success('Event rescheduled successfully!');
      setShowRescheduleModal(false);
      setSelectedEvent(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Rescheduling failed: Slot conflict detected'),
  });

  const startMutation = useMutation({
    mutationFn: (id) => api.post(`/operations/events/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations:timeline'] });
      queryClient.invalidateQueries({ queryKey: ['operations:schedule'] });
      queryClient.invalidateQueries({ queryKey: ['operations:grounds'] });
      toast.success('Event started!');
      setSelectedEvent(null);
    },
  });

  const endMutation = useMutation({
    mutationFn: (id) => api.post(`/operations/events/${id}/end`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations:timeline'] });
      queryClient.invalidateQueries({ queryKey: ['operations:schedule'] });
      queryClient.invalidateQueries({ queryKey: ['operations:grounds'] });
      toast.success('Event completed!');
      setSelectedEvent(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/operations/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations:timeline'] });
      queryClient.invalidateQueries({ queryKey: ['operations:schedule'] });
      queryClient.invalidateQueries({ queryKey: ['operations:grounds'] });
      toast.success('Event deleted');
      setSelectedEvent(null);
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    createMutation.mutate(createForm);
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    rescheduleMutation.mutate({
      id: selectedEvent._id,
      data: {
        newStartTime: rescheduleForm.newStartTime || selectedEvent.startTime,
        newEndTime: rescheduleForm.newEndTime || selectedEvent.endTime,
        newGround: rescheduleForm.newGround || selectedEvent.ground,
        date: rescheduleForm.date || selectedEvent.date
      }
    });
  };

  const openReschedule = (event) => {
    setSelectedEvent(event);
    setRescheduleForm({
      newStartTime: event.startTime,
      newEndTime: event.endTime,
      newGround: event.ground,
      date: new Date(event.date).toISOString().split('T')[0]
    });
    setShowRescheduleModal(true);
  };

  const getEventTypeBadge = (type) => {
    switch (type) {
      case 'coaching': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'one-time-play': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'club-booking': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'maintenance': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cleaning': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const statCards = [
    {
      title: 'Active Players',
      value: attendanceData?.stats?.totalCheckedIn || 0,
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      trend: '+12%',
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(analyticsData?.todayRevenue || 0),
      icon: DollarSign,
      color: 'bg-green-50 text-green-600 border-green-200',
      trend: '+8.5%',
    },
    {
      title: 'Active Bookings',
      value: groundsData?.grounds?.filter((g) => g.isOccupied).length || 0,
      icon: Activity,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      trend: '+3',
    },
    {
      title: 'Pending Dues',
      value: formatCurrency(analyticsData?.pendingDues || 0),
      icon: AlertCircle,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      trend: '-2 members',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAEAEA] shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-[#111111] tracking-tight">Daily Operations Board</h1>
            <p className="text-sm text-[#666666] mt-1">Multi-view operational scheduling & live ground tracking</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* View Switcher */}
            <div className="flex bg-[#F7F7F7] p-1 rounded-xl border border-[#EAEAEA]">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'timeline' ? 'bg-black text-white shadow-md' : 'text-[#666666] hover:text-black'
                }`}
              >
                <Clock size={16} /> Timeline
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'schedule' ? 'bg-black text-white shadow-md' : 'text-[#666666] hover:text-black'
                }`}
              >
                <CalendarIcon size={16} /> Schedule
              </button>
              <button
                onClick={() => setActiveTab('occupancy')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'occupancy' ? 'bg-black text-white shadow-md' : 'text-[#666666] hover:text-black'
                }`}
              >
                <Activity size={16} /> Live Occupancy
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2 py-2.5 px-4 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={18} /> Schedule Event
            </button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`card border ${card.color} shadow-sm hover:shadow-md transition-all`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm text-[#666666] font-medium">{card.title}</p>
                    <p className="text-3xl font-bold text-[#111111] mt-1">{card.value}</p>
                  </div>
                  <Icon size={24} className={card.color.split(' ')[1]} />
                </div>
                <p className="text-xs font-semibold text-green-600">{card.trend}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Filters Bar for Timeline & Schedule */}
        {(activeTab === 'timeline' || activeTab === 'schedule') && (
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#EAEAEA]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#666666] flex items-center gap-1.5">
                <Filter size={16} /> Filter Ground:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['All', ...groundsList].map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGroundFilter(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedGroundFilter === g
                        ? 'bg-black text-white'
                        : 'bg-[#F7F7F7] text-[#666666] hover:bg-[#EAEAEA]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#666666]">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field py-1 px-3 text-sm"
              />
            </div>
          </div>
        )}

        {/* VIEW 1: TIMELINE VIEW */}
        {activeTab === 'timeline' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="card">
              <h2 className="text-lg font-bold text-[#111111] mb-4 flex items-center gap-2">
                <Clock className="text-[#666666]" size={20} /> Daily Timeline — {new Date(selectedDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </h2>

              {isLoadingTimeline ? (
                <div className="text-center py-12 text-[#888888]">Loading timeline events...</div>
              ) : !timelineData?.events?.length ? (
                <div className="text-center py-12 text-[#888888] bg-[#F7F7F7] rounded-xl border border-dashed border-[#CCCCCC]">
                  <p className="font-semibold text-[#666666]">No operational events scheduled for this date.</p>
                  <button onClick={() => setShowCreateModal(true)} className="btn-ghost text-xs mt-2 text-black font-bold">
                    + Schedule New Event
                  </button>
                </div>
              ) : (
                <div className="relative border-l-2 border-[#EAEAEA] ml-4 pl-6 space-y-6 py-2">
                  {timelineData.events.map((event) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative group"
                    >
                      {/* Timeline dot */}
                      <span className={`absolute -left-[31px] top-3 w-4 h-4 rounded-full border-4 border-white shadow-md ${
                        event.status === 'ongoing' ? 'bg-green-600 animate-pulse' :
                        event.status === 'completed' ? 'bg-gray-400' : 'bg-black'
                      }`} />

                      <div className="bg-white p-5 rounded-xl border border-[#EAEAEA] shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-[#111111]">{event.title}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getEventTypeBadge(event.eventType)}`}>
                              {event.eventType.toUpperCase()}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              event.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                              event.status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {event.status.toUpperCase()}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-[#666666] flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-black"><Clock size={13} /> {event.startTime} - {event.endTime}</span>
                            <span className="flex items-center gap-1"><MapPin size={13} /> {event.ground}</span>
                            {event.sport && <span className="capitalize">• {event.sport}</span>}
                            <span>• {event.participants || 0}/{event.maxCapacity} participants</span>
                          </div>
                          {event.description && <p className="text-xs text-[#666666] mt-1">{event.description}</p>}
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center">
                          {event.status === 'scheduled' && (
                            <button
                              onClick={() => startMutation.mutate(event._id)}
                              disabled={startMutation.isPending}
                              className="btn-ghost text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 py-1.5 px-3"
                            >
                              <Play size={13} className="inline mr-1" /> Start
                            </button>
                          )}
                          {event.status === 'ongoing' && (
                            <button
                              onClick={() => endMutation.mutate(event._id)}
                              disabled={endMutation.isPending}
                              className="btn-ghost text-xs bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 py-1.5 px-3"
                            >
                              <Square size={13} className="inline mr-1" /> Complete
                            </button>
                          )}
                          <button
                            onClick={() => openReschedule(event)}
                            className="btn-ghost text-xs py-1.5 px-3 border border-[#EAEAEA] hover:border-black"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this event?')) deleteMutation.mutate(event._id); }}
                            className="btn-ghost text-xs text-red-600 hover:bg-red-50 p-2"
                            title="Delete Event"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: MULTI-DAY SCHEDULE VIEW */}
        {activeTab === 'schedule' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-bold text-[#111111] mb-4 flex items-center gap-2">
                <CalendarIcon className="text-[#666666]" size={20} /> Multi-Day Schedule Roster
              </h2>

              {isLoadingSchedule ? (
                <div className="text-center py-12 text-[#888888]">Loading schedule roster...</div>
              ) : !scheduleData?.events?.length ? (
                <div className="text-center py-12 text-[#888888]">No schedule events found around this date.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scheduleData.events.map((event) => (
                    <motion.div
                      key={event._id}
                      whileHover={{ scale: 1.01 }}
                      className="p-4 rounded-xl border border-[#EAEAEA] bg-white shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-bold text-sm text-[#111111]">{event.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getEventTypeBadge(event.eventType)}`}>
                            {event.eventType.toUpperCase()}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-[#666666] mb-4">
                          <p className="font-semibold text-black flex items-center gap-1.5">
                            <Calendar size={13} /> {new Date(event.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', weekday: 'short' })}
                          </p>
                          <p className="flex items-center gap-1.5"><Clock size={13} /> {event.startTime} - {event.endTime}</p>
                          <p className="flex items-center gap-1.5"><MapPin size={13} /> {event.ground}</p>
                          <p className="flex items-center gap-1.5"><Users size={13} /> {event.participants || 0}/{event.maxCapacity} spots</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#EAEAEA] pt-3">
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                          event.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                          event.status === 'completed' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {event.status.toUpperCase()}
                        </span>
                        
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openReschedule(event)}
                            className="btn-ghost text-[11px] py-1 px-2.5 border border-[#EAEAEA]"
                          >
                            Reschedule
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 3: LIVE OCCUPANCY VIEW */}
        {activeTab === 'occupancy' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-[#111111]">Live Facility Occupancy</h2>
                <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 animate-pulse">
                  <Activity size={12} /> Live Updates
                </span>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {!groundsData?.grounds?.length ? (
                  <p className="text-sm text-[#666666] text-center py-12">No ground operational status available.</p>
                ) : (
                  groundsData.grounds.map((ground, index) => {
                    const occupancyPercent = (ground.occupancy / ground.maxCapacity) * 100 || 0;
                    const statusGradient =
                      occupancyPercent === 100 ? 'from-red-600 to-red-500' :
                      occupancyPercent >= 75 ? 'from-yellow-600 to-yellow-500' : 'from-green-600 to-green-500';

                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.01 }}
                        className="p-4 rounded-xl border border-[#EAEAEA] bg-white shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-extrabold text-base text-[#111111]">{ground.name}</h3>
                            {ground.currentEvent ? (
                              <p className="text-xs font-semibold text-black mt-0.5">🟢 Ongoing: {ground.currentEvent.title}</p>
                            ) : (
                              <p className="text-xs text-[#888888] mt-0.5">Idle — No active session right now</p>
                            )}
                          </div>
                          <span className={`px-3 py-1 text-xs font-extrabold rounded-full shadow-sm ${
                            ground.isOccupied ? 'bg-green-600 text-white animate-pulse' : 'bg-[#EAEAEA] text-[#666666]'
                          }`}>
                            {ground.isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-[#666666]">
                            <span>Capacity Used: {ground.occupancy}/{ground.maxCapacity}</span>
                            <span>{occupancyPercent.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-[#EAEAEA] rounded-full h-2.5 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                              className={`h-full bg-gradient-to-r ${statusGradient}`}
                            />
                          </div>
                        </div>

                        {ground.nextEvent && (
                          <div className="text-xs text-[#666666] border-t border-[#F0F0F0] pt-2 flex items-center justify-between">
                            <span>Next Session: <strong className="text-black">{ground.nextEvent.title}</strong></span>
                            <span>{ground.nextEvent.startTime}</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Side pane: Today Attendance & Payments */}
            <div className="space-y-6">
              <div className="card space-y-3">
                <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider text-left">Live Player Checked-in</h3>
                <div className="space-y-2">
                  {attendanceData?.attendance?.slice(0, 5).map((record, index) => (
                    <div key={index} className="p-3 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#111111]">{record.userId.name}</p>
                        <p className="text-[10px] text-[#666666]">Checked in: {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <span className="bg-green-100 text-green-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">PRESENT</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card space-y-3">
                <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider text-left">Recent POS Cashflow</h3>
                <div className="space-y-2">
                  {paymentData?.payments?.slice(0, 5).map((payment, index) => (
                    <div key={index} className="p-3 rounded-xl bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#111111]">{payment.studentId?.name || payment.customerName || 'Walk-in'}</p>
                        <p className="text-[10px] text-[#666666] capitalize">{payment.type.replace('-', ' ')}</p>
                      </div>
                      <p className="text-xs font-extrabold text-[#111111]">{formatCurrency(payment.totalAmount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* MODAL 1: SCHEDULE NEW EVENT */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#EAEAEA] space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-4">
                <h2 className="text-xl font-bold text-[#111111]">Schedule Operation Event</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-[#666666] hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#666666] mb-1">Event Title *</label>
                  <input
                    className="input-field w-full text-sm"
                    placeholder="e.g. U16 Weekend Camp / Club Tournament"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#666666] mb-1">Event Type</label>
                    <select
                      className="input-field w-full text-sm bg-white"
                      value={createForm.eventType}
                      onChange={(e) => setCreateForm({ ...createForm, eventType: e.target.value })}
                    >
                      {eventTypes.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#666666] mb-1">Ground/Arena</label>
                    <select
                      className="input-field w-full text-sm bg-white"
                      value={createForm.ground}
                      onChange={(e) => setCreateForm({ ...createForm, ground: e.target.value })}
                    >
                      {groundsList.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#666666] mb-1">Sport</label>
                    <select
                      className="input-field w-full text-sm bg-white"
                      value={createForm.sport}
                      onChange={(e) => setCreateForm({ ...createForm, sport: e.target.value })}
                    >
                      {sportOptions.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#666666] mb-1">Date</label>
                    <input
                      type="date"
                      className="input-field w-full text-sm"
                      value={createForm.date}
                      onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#666666] mb-1">Start Time</label>
                    <input
                      type="time"
                      className="input-field w-full text-sm"
                      value={createForm.startTime}
                      onChange={(e) => setCreateForm({ ...createForm, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#666666] mb-1">End Time</label>
                    <input
                      type="time"
                      className="input-field w-full text-sm"
                      value={createForm.endTime}
                      onChange={(e) => setCreateForm({ ...createForm, endTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#666666] mb-1">Capacity</label>
                    <input
                      type="number"
                      className="input-field w-full text-sm"
                      value={createForm.maxCapacity}
                      onChange={(e) => setCreateForm({ ...createForm, maxCapacity: parseInt(e.target.value) || 1 })}
                      min={1}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#666666] mb-1">Notes / Description</label>
                  <textarea
                    className="input-field w-full text-sm h-20"
                    placeholder="Special requirements, equipment setup, etc."
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-ghost text-sm">Cancel</button>
                  <button type="submit" disabled={createMutation.isPending} className="btn-primary text-sm py-2 px-6">
                    {createMutation.isPending ? 'Scheduling...' : 'Confirm Schedule'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL 2: RESCHEDULE / VIEW DETAILS */}
        {showRescheduleModal && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#EAEAEA] space-y-6"
            >
              <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-4">
                <div>
                  <h2 className="text-xl font-bold text-[#111111]">Reschedule Event</h2>
                  <p className="text-xs text-[#666666] mt-0.5">{selectedEvent.title}</p>
                </div>
                <button onClick={() => setShowRescheduleModal(false)} className="text-[#666666] hover:text-black">
                  <X size={22} />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3">
                <ShieldAlert size={20} className="text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 font-medium">
                  Conflict Engine Active: The system will verify that your target ground and time slot are fully vacant before committing changes.
                </p>
              </div>

              <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#666666] mb-1">Target Ground/Arena</label>
                  <select
                    className="input-field w-full text-sm bg-white"
                    value={rescheduleForm.newGround}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, newGround: e.target.value })}
                  >
                    {groundsList.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#666666] mb-1">Target Date</label>
                  <input
                    type="date"
                    className="input-field w-full text-sm"
                    value={rescheduleForm.date}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#666666] mb-1">New Start Time</label>
                    <input
                      type="time"
                      className="input-field w-full text-sm"
                      value={rescheduleForm.newStartTime}
                      onChange={(e) => setRescheduleForm({ ...rescheduleForm, newStartTime: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#666666] mb-1">New End Time</label>
                    <input
                      type="time"
                      className="input-field w-full text-sm"
                      value={rescheduleForm.newEndTime}
                      onChange={(e) => setRescheduleForm({ ...rescheduleForm, newEndTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#EAEAEA]">
                  <button type="button" onClick={() => setShowRescheduleModal(false)} className="btn-ghost text-sm">Cancel</button>
                  <button type="submit" disabled={rescheduleMutation.isPending} className="btn-primary text-sm py-2 px-6">
                    {rescheduleMutation.isPending ? 'Verifying Conflict...' : 'Confirm Reschedule'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
