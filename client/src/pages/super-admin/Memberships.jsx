import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import { formatCurrency, formatDate, getStatusColor, getInitials } from '../../lib/utils';
import {
  Search, Filter, ChevronLeft, ChevronRight, X,
  CreditCard, Calendar, Clock, User, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── helpers ──────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(dateStr);
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Skeleton rows ────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-[#F0F0F0]">
      {[...Array(9)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className={`skeleton h-4 ${i === 0 ? 'w-32' : i === 4 ? 'w-16' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  );
}

// ─── Status options ───────────────────────────────────────
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PLAN_TYPE_OPTIONS = [
  { value: '', label: 'All Plan Types' },
  { value: 'all-services', label: 'All-Services Tier' },
  { value: 'sport-specific', label: 'Sport-Specific' },
];

// ═══════════════════════════════════════════════════════════
export default function Memberships() {
  // ── filter state ──────────────────────────────────────
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [planType, setPlanType] = useState('');
  const [sport, setSport] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const limit = 10;

  // debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimer = useMemo(() => {
    return (val) => {
      const id = setTimeout(() => {
        setDebouncedSearch(val);
        setPage(1);
      }, 400);
      return () => clearTimeout(id);
    };
  }, []);

  // ── sports query (for filter dropdown) ────────────────
  const { data: sportsData } = useQuery({
    queryKey: ['sports-list'],
    queryFn: () => api.get('/sports').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const sports = sportsData?.sports || sportsData || [];

  // ── memberships query ─────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['super-admin-memberships', debouncedSearch, status, planType, sport, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (status) params.set('status', status);
      if (planType) params.set('planType', planType);
      if (sport) params.set('sport', sport);
      params.set('page', page);
      params.set('limit', limit);
      const res = await api.get(`/super-admin/memberships?${params.toString()}`);
      return res.data;
    },
    keepPreviousData: true,
    onError: () => toast.error('Failed to load memberships'),
  });

  const memberships = data?.memberships || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Compile check-ins and memberships, sorting by check-in date/time descending (latest on top)
  const displayRows = useMemo(() => {
    if (!memberships || memberships.length === 0) return [];
    const rows = [];
    memberships.forEach((m) => {
      const student = m.studentId || {};
      const plan = m.planId || {};
      const sportsIncluded = plan.sportsIncluded || [];
      const checkins = m.checkins || [];

      if (checkins.length > 0) {
        checkins.forEach((c, idx) => {
          rows.push({
            ...c,
            _rowKey: `${m._id}-${c._id || idx}`,
            isFirst: idx === 0,
            membership: m,
            student,
            plan,
            sportsIncluded,
          });
        });
      } else {
        rows.push({
          _rowKey: `${m._id}-empty`,
          isFirst: true,
          checkInTime: null,
          checkOutTime: null,
          sessionStatus: null,
          membership: m,
          student,
          plan,
          sportsIncluded,
        });
      }
    });

    // Sort by check-in date/time wise (latest first)
    return rows.sort((a, b) => {
      const timeA = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
      const timeB = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      const createdA = a.membership?.createdAt ? new Date(a.membership.createdAt).getTime() : 0;
      const createdB = b.membership?.createdAt ? new Date(b.membership.createdAt).getTime() : 0;
      return createdB - createdA;
    });
  }, [memberships]);

  // ── search handler ────────────────────────────────────
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    searchTimer(val);
  };

  const handleFilterReset = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus('');
    setPlanType('');
    setSport('');
    setPage(1);
  };

  const hasActiveFilters = debouncedSearch || status || planType || sport;

  // ═════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen">
      {/* ── Page header ─────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111] font-[Inter]">Memberships</h1>
        <p className="text-sm text-text-muted mt-1">View and track all membership records across academies</p>
      </div>

      {/* ── Filter bar ──────────────────────────────────── */}
      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by name, phone, or email…"
              value={search}
              onChange={handleSearchChange}
              className="input-field pl-9"
            />
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="input-field w-auto min-w-[150px]"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Plan Type */}
          <select
            value={planType}
            onChange={(e) => { setPlanType(e.target.value); setPage(1); }}
            className="input-field w-auto min-w-[160px]"
          >
            {PLAN_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Sport */}
          <select
            value={sport}
            onChange={(e) => { setSport(e.target.value); setPage(1); }}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="">All Sports</option>
            {(Array.isArray(sports) ? sports : []).map(s => (
              <option key={s._id} value={s.slug}>{s.name}</option>
            ))}
          </select>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={handleFilterReset}
              className="btn-ghost text-xs gap-1 shrink-0"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EAEAEA] bg-[#FAFAFA]">
                <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">Member</th>
                <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">Sport(s)</th>
                <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">Membership Status</th>
                <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">Start</th>
                <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">End</th>
                <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">In Time</th>
                <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">Out Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : memberships.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                        <CreditCard size={28} className="text-text-muted" />
                      </div>
                      <p className="text-[#111] font-medium">
                        {hasActiveFilters ? 'No memberships match your filters' : 'No memberships found'}
                      </p>
                      <p className="text-xs text-text-muted max-w-xs">
                        {hasActiveFilters
                          ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                          : 'Memberships will appear here once students enroll in plans.'}
                      </p>
                      {hasActiveFilters && (
                        <button onClick={handleFilterReset} className="btn-ghost text-xs mt-1">
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayRows.map((row) => {
                  const m = row.membership;
                  const student = row.student;
                  const plan = row.plan;
                  const sportsIncluded = row.sportsIncluded;
                  return (
                    <motion.tr
                      key={row._rowKey}
                      onClick={() => setSelectedMembership(m)}
                      className={`border-b border-[#F0F0F0] table-row cursor-pointer transition-colors ${
                        row.sessionStatus === 'Active' ? 'bg-green-50/40' : ''
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Member */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                            {getInitials(student.name)}
                          </div>
                          <span className="font-medium text-[#111] truncate max-w-[160px]">
                            {student.name || 'Unknown'}
                          </span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-[#444]">{student.phone || '—'}</td>

                      {/* Plan */}
                      <td className="px-4 py-3 font-medium text-[#111]">{plan.name || '—'}</td>

                      {/* Sports */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {sportsIncluded.length > 0
                            ? sportsIncluded.map((sp, idx) => (
                                <span key={idx} className="text-xs bg-[#F5F5F5] text-[#444] px-2 py-0.5 rounded">
                                  {typeof sp === 'string' ? sp : sp.name || '—'}
                                </span>
                              ))
                            : <span className="text-text-muted">—</span>
                          }
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`badge ${getStatusColor(m.status)}`}>
                          {m.status}
                        </span>
                      </td>

                      {/* Start Date */}
                      <td className="px-4 py-3 text-[#444]">{formatDate(m.startDate)}</td>

                      {/* End Date */}
                      <td className="px-4 py-3 text-[#444]">{formatDate(m.endDate)}</td>

                      {/* Check-in Time */}
                      <td className="px-4 py-3 text-[#444] text-xs leading-5 whitespace-nowrap">
                        {formatDateTime(row.checkInTime)}
                      </td>

                      {/* Check-out Time */}
                      <td className="px-4 py-3 text-xs leading-5 whitespace-nowrap">
                        {row.checkOutTime ? (
                          <span className="text-[#444]">{formatDateTime(row.checkOutTime)}</span>
                        ) : row.checkInTime ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="text-[#444]">—</span>
                        )}
                      </td>

                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────── */}
        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#EAEAEA]">
            <p className="text-xs text-text-muted">
              Showing <span className="font-medium text-[#111]">{from}–{to}</span> of{' '}
              <span className="font-medium text-[#111]">{total}</span> results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="px-1 text-text-muted text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                        page === p
                          ? 'bg-[#111] text-white'
                          : 'hover:bg-[#F5F5F5] text-[#444]'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Error state ─────────────────────────────────── */}
      {isError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
          Something went wrong while loading memberships. Please try again.
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          Detail Drawer
         ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedMembership && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => setSelectedMembership(null)}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <DrawerContent
                membership={selectedMembership}
                onClose={() => setSelectedMembership(null)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Drawer content (extracted for readability)
// ═══════════════════════════════════════════════════════════
function DrawerContent({ membership: m, onClose }) {
  const student = m.studentId || {};
  const plan = m.planId || {};
  const sportsIncluded = plan.sportsIncluded || [];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAEAEA]">
        <h2 className="text-lg font-semibold text-[#111] font-[Inter]">Membership Details</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* ── Member info ──────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#111] text-white flex items-center justify-center text-sm font-bold">
              {getInitials(student.name)}
            </div>
            <div>
              <p className="font-semibold text-[#111] text-base">{student.name || 'Unknown'}</p>
              <p className="text-xs text-text-muted">{student.email || '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard icon={<User size={14} />} label="Phone" value={student.phone || '—'} />
            <InfoCard icon={<CreditCard size={14} />} label="Email" value={student.email || '—'} />
          </div>
        </section>

        {/* ── Plan details ─────────────────────────────── */}
        <section>
          <h3 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">Plan Details</h3>
          <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl p-4 space-y-2.5">
            <DetailRow label="Plan Name" value={plan.name || '—'} />
            <DetailRow label="Duration" value={plan.duration ? `${plan.duration} days` : '—'} />
            <DetailRow label="Price" value={plan.price ? formatCurrency(plan.price) : '—'} />
            <DetailRow
              label="Sport(s)"
              value={
                sportsIncluded.length > 0
                  ? sportsIncluded.map(sp => (typeof sp === 'string' ? sp : sp.name)).join(', ')
                  : '—'
              }
            />
          </div>
        </section>

        {/* ── Membership dates ─────────────────────────── */}
        <section>
          <h3 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">Membership Period</h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard icon={<Calendar size={14} />} label="Start Date" value={formatDate(m.startDate)} />
            <InfoCard icon={<Calendar size={14} />} label="End Date" value={formatDate(m.endDate)} />
          </div>
          <div className="mt-3">
            <span className={`badge ${getStatusColor(m.status)}`}>{m.status}</span>
          </div>
        </section>

        {/* ── Check-in stats ───────────────────────────── */}
        <section>
          <h3 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">Attendance</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Last Check-in" value={formatDateTime(m.lastCheckIn)} small />
            <StatCard label="Last Check-out" value={formatDateTime(m.lastCheckOut)} small />
          </div>
        </section>

        {/* ── Renewal history ──────────────────────────── */}
        {m.renewalHistory && m.renewalHistory.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">Renewal History</h3>
            <div className="space-y-2">
              {m.renewalHistory.map((r, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-[#FAFAFA] border border-[#F0F0F0] rounded-lg px-4 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-text-muted" />
                    <span className="text-[#444]">{formatDate(r.renewedAt || r.date)}</span>
                  </div>
                  <span className="font-medium text-[#111]">
                    {r.amountPaid ? formatCurrency(r.amountPaid) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

// ─── Tiny reusable pieces ─────────────────────────────────
function InfoCard({ icon, label, value }) {
  return (
    <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1 text-text-muted">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-sm font-medium text-[#111] truncate">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#888]">{label}</span>
      <span className="font-medium text-[#111] text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

function StatCard({ label, value, small }) {
  return (
    <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl px-3 py-3 text-center">
      <p className={`font-bold text-[#111] ${small ? 'text-xs' : 'text-xl'}`}>{value}</p>
      <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
