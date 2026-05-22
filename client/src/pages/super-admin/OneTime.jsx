import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import { formatCurrency, formatDate, getStatusColor } from '../../lib/utils';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Ticket,
  Clock,
  Calendar,
  DollarSign,
  Loader2,
  User,
} from 'lucide-react';

/* ─── helpers ─── */
function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const paymentStatusOptions = ['All', 'Paid', 'Pending', 'Partial'];
const bookingStatusOptions = [
  'All',
  'Confirmed',
  'Completed',
  'Cancelled',
  'Pending',
  'No-Show',
];

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusBadge(status) {
  switch (status) {
    case 'active': return 'badge-success';
    case 'completed': return 'badge-success';
    case 'expired': return 'badge-warning';
    case 'cancelled': return 'badge-danger';
    case 'unused': return 'badge-info';
    default: return 'badge-info';
  }
}

/* ─── skeleton row ─── */
function SkeletonRow({ cols = 10 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/* ─── main page ─── */
export default function OneTime() {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'passes'

  /* filter state */
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [bookingStatus, setBookingStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 10;

  /* drawer */
  const [selectedEntry, setSelectedEntry] = useState(null);

  /* fetch sports */
  const { data: sportsData } = useQuery({
    queryKey: ['sports'],
    queryFn: () => api.get('/sports').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const sports = sportsData?.sports ?? sportsData ?? [];

  /* fetch entries */
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'super-admin-onetime',
      search,
      sportFilter,
      paymentStatus,
      bookingStatus,
      startDate,
      endDate,
      page,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (sportFilter) params.append('sport', sportFilter);
      if (paymentStatus !== 'All')
        params.append('paymentStatus', paymentStatus.toLowerCase());
      if (bookingStatus !== 'All')
        params.append('status', bookingStatus.toLowerCase());
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', page);
      params.append('limit', limit);
      return api
        .get(`/super-admin/one-time?${params.toString()}`)
        .then((r) => r.data);
    },
    keepPreviousData: true,
    enabled: activeTab === 'bookings',
    onError: () => toast.error('Failed to load one-time entries'),
  });

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  /* fetch prepaid passes */
  const { data: passesData, isLoading: isPassesLoading, isError: isPassesError } = useQuery({
    queryKey: ['admin-flexible-passes'],
    queryFn: () => api.get('/onetimeaccess/admin/passes').then((r) => r.data),
    enabled: activeTab === 'passes',
    onError: () => toast.error('Failed to load prepaid passes'),
  });

  const passes = passesData?.passes ?? [];

  // Filter passes client-side
  const filteredPasses = passes.filter((pass) => {
    if (search) {
      const q = search.toLowerCase();
      const name = pass.userId?.name?.toLowerCase() || '';
      const email = pass.userId?.email?.toLowerCase() || '';
      const phone = pass.userId?.phone || '';
      const id = pass._id?.toLowerCase() || '';
      if (!name.includes(q) && !email.includes(q) && !phone.includes(q) && !id.includes(q)) {
        return false;
      }
    }
    if (sportFilter) {
      const sportName = pass.sportId?.name?.toLowerCase() || '';
      if (sportName !== sportFilter.toLowerCase()) {
        return false;
      }
    }
    if (paymentStatus !== 'All') {
      const payStatus = pass.paymentId?.status?.toLowerCase() || '';
      if (payStatus !== paymentStatus.toLowerCase()) {
        return false;
      }
    }
    if (bookingStatus !== 'All') {
      const accStatus = pass.accessStatus?.toLowerCase() || '';
      if (accStatus !== bookingStatus.toLowerCase()) {
        return false;
      }
    }
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (new Date(pass.purchasedAt) < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(pass.purchasedAt) > end) return false;
    }
    return true;
  });

  const passesTotal = filteredPasses.length;
  const passesTotalPages = Math.max(1, Math.ceil(passesTotal / limit));
  const passesFrom = passesTotal === 0 ? 0 : (page - 1) * limit + 1;
  const passesTo = Math.min(page * limit, passesTotal);
  const paginatedPasses = filteredPasses.slice((page - 1) * limit, page * limit);

  const displayTotal = activeTab === 'bookings' ? total : passesTotal;
  const displayTotalPages = activeTab === 'bookings' ? totalPages : passesTotalPages;
  const displayFrom = activeTab === 'bookings' ? from : passesFrom;
  const displayTo = activeTab === 'bookings' ? to : passesTo;
  const showLoading = activeTab === 'bookings' ? isLoading : isPassesLoading;
  const showError = activeTab === 'bookings' ? isError : isPassesError;

  const bookingsHeaders = [
    'Booking ID',
    'Type',
    'Player Name',
    'Phone',
    'Sport',
    'Duration',
    'Amount',
    'Check In',
    'Check Out',
    'Date',
  ];

  const passesHeaders = [
    'Pass ID',
    'Customer Name',
    'Sport',
    'Purchased At',
    'Expiry Date',
    'Status / Details',
    'Late Amount',
    'Payment Status',
  ];

  const currentBookingStatusOptions =
    activeTab === 'bookings'
      ? bookingStatusOptions
      : ['All', 'Unused', 'Active', 'Completed', 'Expired', 'Cancelled'];

  function handleTabChange(tab) {
    setActiveTab(tab);
    setPage(1);
    setBookingStatus('All');
    setPaymentStatus('All');
  }

  function handleSelectPass(pass) {
    const user = pass.userId || {};
    const sport = pass.sportId || {};
    const payment = pass.paymentId || {};
    const attendance = pass.attendanceId || {};
    
    const totalAmount = payment.amountPaid || (pass.hourlyRateSnapshot * (pass.allowedDurationMinutes / 60));
    const baseAmount = totalAmount / 1.18;
    const gstAmount = totalAmount - baseAmount;
    
    const normalized = {
      _id: pass._id,
      bookingId: pass._id?.slice(-8).toUpperCase(),
      type: 'prepaid',
      status: pass.accessStatus,
      paymentStatus: payment.status || 'pending',
      playerName: user.name || 'Walk-in User',
      playerPhone: user.phone || '—',
      sport: sport.name || '—',
      duration: attendance.actualDurationMinutes || attendance.duration || pass.allowedDurationMinutes,
      ratePerHour: pass.hourlyRateSnapshot,
      amount: baseAmount,
      gstAmount: gstAmount,
      totalAmount: totalAmount,
      date: pass.purchasedAt,
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      notes: `Prepaid Pass Details:\n- Expiry: ${new Date(pass.expiresAt).toLocaleString('en-IN')}\n- Late fee rate: ₹${pass.lateFeePerMinuteSnapshot}/min\n- Late Amount accrued: ₹${attendance.lateAmount || 0}`,
    };
    setSelectedEntry(normalized);
  }

  /* reset page when filters change */
  function updateFilter(setter) {
    return (val) => {
      setter(val);
      setPage(1);
    };
  }

  const hasActiveFilters =
    sportFilter || paymentStatus !== 'All' || bookingStatus !== 'All' || startDate || endDate;

  function clearFilters() {
    setSportFilter('');
    setPaymentStatus('All');
    setBookingStatus('All');
    setStartDate('');
    setEndDate('');
    setPage(1);
  }

  /* ─── render ─── */
  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8 mt-2">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#666666] uppercase mb-2">
            [RED BALL ACADEMY]
          </p>
          <h1 className="text-5xl serif-heading text-[#111111] uppercase tracking-tight">
            One-Time Entries.
          </h1>
          <p className="text-sm text-[#666666] mt-3">
            All walk-in and online one-time play bookings
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#EAEAEA] mb-6">
        <button
          onClick={() => handleTabChange('bookings')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'bookings'
              ? 'border-black text-black'
              : 'border-transparent text-[#666666] hover:text-black'
          }`}
        >
          Legacy Bookings
        </button>
        <button
          onClick={() => handleTabChange('passes')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-all ${
            activeTab === 'passes'
              ? 'border-black text-black'
              : 'border-transparent text-[#666666] hover:text-black'
          }`}
        >
          One-Time Flexible Access
        </button>
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
      >
        {/* Top row: search + toggle filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]"
            />
            <input
              type="text"
              placeholder={
                activeTab === 'bookings'
                  ? "Search by name, phone, or booking ID..."
                  : "Search by customer name, phone, email, pass ID..."
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input-field pl-9"
            />
          </div>

          <button
            onClick={() => setShowFilters((p) => !p)}
            className={`btn-ghost whitespace-nowrap ${
              hasActiveFilters ? 'border-[#111111] bg-[#FAFAFA]' : ''
            }`}
          >
            <Filter size={14} />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-5 h-5 rounded-full bg-[#111111] text-white text-[10px] flex items-center justify-center">
                {[
                  sportFilter,
                  paymentStatus !== 'All' ? paymentStatus : '',
                  bookingStatus !== 'All' ? bookingStatus : '',
                  startDate,
                  endDate,
                ].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Expandable filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-[#EAEAEA]">
                {/* Sport */}
                <div>
                  <label className="block text-xs text-[#666] mb-1">Sport</label>
                  <select
                    className="input-field bg-white"
                    value={sportFilter}
                    onChange={(e) => updateFilter(setSportFilter)(e.target.value)}
                  >
                    <option value="">All Sports</option>
                    {Array.isArray(sports) &&
                      sports.map((s) => (
                        <option key={s._id || s.name} value={s.name || s}>
                          {(s.name || s).charAt(0).toUpperCase() +
                            (s.name || s).slice(1)}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-xs text-[#666] mb-1">
                    Payment Status
                  </label>
                  <select
                    className="input-field bg-white"
                    value={paymentStatus}
                    onChange={(e) =>
                      updateFilter(setPaymentStatus)(e.target.value)
                    }
                  >
                    {paymentStatusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Booking Status */}
                <div>
                  <label className="block text-xs text-[#666] mb-1">
                    {activeTab === 'bookings' ? 'Booking Status' : 'Pass Status'}
                  </label>
                  <select
                    className="input-field bg-white"
                    value={bookingStatus}
                    onChange={(e) =>
                      updateFilter(setBookingStatus)(e.target.value)
                    }
                  >
                    {currentBookingStatusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs text-[#666] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={startDate}
                    onChange={(e) =>
                      updateFilter(setStartDate)(e.target.value)
                    }
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs text-[#666] mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={endDate}
                    onChange={(e) =>
                      updateFilter(setEndDate)(e.target.value)
                    }
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-xs text-[#888] hover:text-[#111] transition-colors underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-0 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EAEAEA]">
                {(activeTab === 'bookings' ? bookingsHeaders : passesHeaders).map((h) => (
                  <th
                    key={h}
                    className="text-left text-[10px] font-semibold tracking-wider text-[#888888] uppercase px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeTab === 'bookings' ? (
                showLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={10} />)
                ) : showError ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16 text-[#888]">
                      <p className="text-base font-medium text-[#111]">
                        Something went wrong
                      </p>
                      <p className="text-sm mt-1">
                        Failed to load entries. Please try again.
                      </p>
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-16">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="w-16 h-16 rounded-full bg-[#F7F7F7] flex items-center justify-center mx-auto mb-4">
                          <Ticket size={28} className="text-[#CCCCCC]" />
                        </div>
                        <p className="text-base font-medium text-[#111]">
                          {search || hasActiveFilters
                            ? 'No entries match your filters'
                            : 'No one-time play entries yet'}
                        </p>
                        <p className="text-sm text-[#888] mt-1 max-w-sm mx-auto">
                          {search || hasActiveFilters
                            ? "Try adjusting your search or filter criteria to find what you're looking for."
                            : "When players make walk-in or online one-time bookings, they'll appear here."}
                        </p>
                        {hasActiveFilters && (
                          <button
                            onClick={clearFilters}
                            className="btn-ghost text-xs mt-4"
                          >
                            Clear filters
                          </button>
                        )}
                      </motion.div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => (
                    <motion.tr
                      key={entry._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelectedEntry(entry)}
                      className="border-b border-[#F0F0F0] table-row cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#666]">
                        {entry.bookingId || entry._id?.slice(-8)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`badge ${
                            entry.type === 'walk-in'
                              ? 'badge-success'
                              : 'badge-info'
                          }`}
                        >
                          {entry.type === 'walk-in' ? 'Walk-in' : 'Online'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#111]">
                        {entry.playerName}
                      </td>
                      <td className="px-4 py-3 text-[#666]">
                        {entry.playerPhone || '—'}
                      </td>
                      <td className="px-4 py-3 text-[#111] capitalize">
                        {entry.sport}
                      </td>
                      <td className="px-4 py-3 text-[#666]">
                        {formatDuration(entry.duration)}
                      </td>

                      <td className="px-4 py-3 font-medium text-[#111]">
                        {formatCurrency(entry.totalAmount ?? entry.amount)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#666]">
                        {formatTime(entry.checkInTime)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#666]">
                        {formatTime(entry.checkOutTime)}
                      </td>
                      <td className="px-4 py-3 text-[#666] whitespace-nowrap">
                        {formatDate(entry.date)}
                      </td>
                    </motion.tr>
                  ))
                )
              ) : (
                showLoading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                ) : showError ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-[#888]">
                      <p className="text-base font-medium text-[#111]">
                        Something went wrong
                      </p>
                      <p className="text-sm mt-1">
                        Failed to load prepaid passes. Please try again.
                      </p>
                    </td>
                  </tr>
                ) : paginatedPasses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <div className="w-16 h-16 rounded-full bg-[#F7F7F7] flex items-center justify-center mx-auto mb-4">
                          <Ticket size={28} className="text-[#CCCCCC]" />
                        </div>
                        <p className="text-base font-medium text-[#111]">
                          {search || hasActiveFilters
                            ? 'No passes match your filters'
                            : 'No prepaid passes yet'}
                        </p>
                        <p className="text-sm text-[#888] mt-1 max-w-sm mx-auto">
                          {search || hasActiveFilters
                            ? "Try adjusting your search or filter criteria to find what you're looking for."
                            : "When customers purchase flexible passes, they'll appear here."}
                        </p>
                        {hasActiveFilters && (
                          <button
                            onClick={clearFilters}
                            className="btn-ghost text-xs mt-4"
                          >
                            Clear filters
                          </button>
                        )}
                      </motion.div>
                    </td>
                  </tr>
                ) : (
                  paginatedPasses.map((pass, idx) => {
                    const user = pass.userId || {};
                    const sport = pass.sportId || {};
                    const payment = pass.paymentId || {};
                    const attendance = pass.attendanceId || {};
                    
                    return (
                      <motion.tr
                        key={pass._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => handleSelectPass(pass)}
                        className="border-b border-[#F0F0F0] table-row cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-[#666]">
                          {pass._id?.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#111]">{user.name || 'Walk-in User'}</p>
                          <p className="text-xs text-[#666]">{user.phone || 'No phone'}</p>
                        </td>
                        <td className="px-4 py-3 text-[#111] capitalize font-medium">
                          {sport.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-[#666] whitespace-nowrap text-xs">
                          {formatDateTime(pass.purchasedAt)}
                        </td>
                        <td className="px-4 py-3 text-[#666] whitespace-nowrap text-xs">
                          {formatDateTime(pass.expiresAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${getStatusBadge(pass.accessStatus)} mr-2 capitalize`}>
                            {pass.accessStatus}
                          </span>
                          {pass.accessStatus === 'active' && attendance.checkInTime && (
                            <span className="text-xs text-[#666]">
                              Checked in: {formatTime(attendance.checkInTime)}
                            </span>
                          )}
                          {pass.accessStatus === 'completed' && attendance.checkInTime && (
                            <span className="text-xs text-[#666]">
                              {formatTime(attendance.checkInTime)} - {formatTime(attendance.checkOutTime)} ({attendance.actualDurationMinutes || attendance.duration || 60}m)
                            </span>
                          )}
                          {pass.accessStatus === 'unused' && (
                            <span className="text-xs text-[#888]">
                              Expires {formatDate(pass.expiresAt)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold">
                          {attendance.lateAmount > 0 ? (
                            <span className="text-red-600">{formatCurrency(attendance.lateAmount)}</span>
                          ) : (
                            <span className="text-[#666]">₹0</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge ${payment.status === 'paid' ? 'badge-success' : 'badge-warning'} capitalize`}>
                            {payment.status || 'pending'}
                          </span>
                          <span className="text-xs text-[#666] ml-2 font-mono">
                            ({payment.paymentMode || 'cash'})
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {displayTotal > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#EAEAEA]">
            <p className="text-xs text-[#888]">
              Showing{' '}
              <span className="font-medium text-[#111]">{displayFrom}</span>–
              <span className="font-medium text-[#111]">{displayTo}</span> of{' '}
              <span className="font-medium text-[#111]">{displayTotal}</span> results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg hover:bg-[#F0F0F0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: displayTotalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (displayTotalPages <= 5) return true;
                  if (p === 1 || p === displayTotalPages) return true;
                  return Math.abs(p - page) <= 1;
                })
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 text-xs text-[#888]"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        page === p
                          ? 'bg-[#111] text-white'
                          : 'hover:bg-[#F0F0F0] text-[#666]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(displayTotalPages, p + 1))}
                disabled={page >= displayTotalPages}
                className="p-2 rounded-lg hover:bg-[#F0F0F0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Details Drawer */}
      <AnimatePresence>
        {selectedEntry && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEntry(null)}
              className="fixed inset-0 bg-black/30 z-40"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
            >
              {/* Drawer header */}
              <div className="sticky top-0 bg-white border-b border-[#EAEAEA] px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.15em] text-[#888] uppercase">
                    Booking Details
                  </p>
                  <h2 className="text-lg font-bold text-[#111] mt-0.5">
                    {selectedEntry.bookingId ||
                      `#${selectedEntry._id?.slice(-8)}`}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 rounded-lg hover:bg-[#F0F0F0] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer content */}
              <div className="p-6 space-y-6">
                {/* Type & Status */}
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${
                      selectedEntry.type === 'walk-in'
                        ? 'badge-success'
                        : 'badge-info'
                    }`}
                  >
                    {selectedEntry.type === 'walk-in' ? 'Walk-in' : 'Online'}
                  </span>
                  <span
                    className={`badge ${getStatusColor(
                      selectedEntry.status?.toLowerCase()
                    )}`}
                  >
                    {selectedEntry.status}
                  </span>
                  <span
                    className={`badge ${getStatusColor(
                      selectedEntry.paymentStatus?.toLowerCase()
                    )}`}
                  >
                    {selectedEntry.paymentStatus}
                  </span>
                </div>

                {/* Player Info */}
                <div className="rounded-xl border border-[#EAEAEA] bg-[#F7F7F7] p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#111] text-white flex items-center justify-center text-sm font-semibold">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111]">
                        {selectedEntry.playerName}
                      </p>
                      <p className="text-xs text-[#666]">
                        {selectedEntry.playerPhone || 'No phone'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sport & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-[#EAEAEA] p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Ticket size={14} className="text-[#888]" />
                      <span className="text-xs text-[#888]">Sport</span>
                    </div>
                    <p className="text-sm font-semibold text-[#111] capitalize">
                      {selectedEntry.sport}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#EAEAEA] p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock size={14} className="text-[#888]" />
                      <span className="text-xs text-[#888]">Duration</span>
                    </div>
                    <p className="text-sm font-semibold text-[#111]">
                      {formatDuration(selectedEntry.duration)}
                    </p>
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="rounded-xl border border-[#EAEAEA] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={14} className="text-[#888]" />
                    <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">
                      Pricing Breakdown
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selectedEntry.ratePerHour != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666]">Rate per hour</span>
                        <span className="text-[#111]">
                          {formatCurrency(selectedEntry.ratePerHour)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-[#666]">Base amount</span>
                      <span className="text-[#111]">
                        {formatCurrency(selectedEntry.amount)}
                      </span>
                    </div>
                    {selectedEntry.gstAmount != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666]">GST (18%)</span>
                        <span className="text-[#111]">
                          {formatCurrency(selectedEntry.gstAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold border-t border-[#EAEAEA] pt-2">
                      <span className="text-[#111]">Total</span>
                      <span className="text-[#111]">
                        {formatCurrency(
                          selectedEntry.totalAmount ?? selectedEntry.amount
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="rounded-xl border border-[#EAEAEA] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={14} className="text-[#888]" />
                    <span className="text-xs font-semibold text-[#888] uppercase tracking-wider">
                      Timestamps
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#666]">Date</span>
                      <span className="text-[#111]">
                        {formatDate(selectedEntry.date)}
                      </span>
                    </div>
                    {selectedEntry.startTime && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666]">Start time</span>
                        <span className="text-[#111]">
                          {selectedEntry.startTime}
                        </span>
                      </div>
                    )}
                    {selectedEntry.endTime && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666]">End time</span>
                        <span className="text-[#111]">
                          {selectedEntry.endTime}
                        </span>
                      </div>
                    )}
                    {selectedEntry.checkInTime && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666]">Check-in</span>
                        <span className="text-[#111] font-mono text-xs">
                          {formatTime(selectedEntry.checkInTime)}
                        </span>
                      </div>
                    )}
                    {selectedEntry.checkOutTime && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#666]">Check-out</span>
                        <span className="text-[#111] font-mono text-xs">
                          {formatTime(selectedEntry.checkOutTime)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedEntry.notes && (
                  <div className="rounded-xl border border-[#EAEAEA] p-4">
                    <p className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">
                      Notes
                    </p>
                    <p className="text-sm text-[#444] leading-relaxed">
                      {selectedEntry.notes}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
