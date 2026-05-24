import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';
import { formatCurrency, formatDate, getStatusColor, getInitials } from '../../lib/utils';
import {
  Search, ChevronLeft, ChevronRight, X,
  CreditCard, User, Loader2, Users, CheckCircle, AlertCircle, Clock,
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
  const [activeTab, setActiveTab] = useState('memberships');

  // ── filter state ──────────────────────────────────────
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [planType, setPlanType] = useState('');
  const [sport, setSport] = useState('');
  const [page, setPage] = useState(1);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const limit = 10;

  // ── users tab state ───────────────────────────────────
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userMembershipFilter, setUserMembershipFilter] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const userSearchTimer = useMemo(() => (val) => {
    const id = setTimeout(() => { setDebouncedUserSearch(val); setUserPage(1); }, 400);
    return () => clearTimeout(id);
  }, []);

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

  // ── users query ───────────────────────────────────────
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['super-admin-users', debouncedUserSearch, userPage, userMembershipFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: userPage, limit: 20 });
      if (debouncedUserSearch) params.set('search', debouncedUserSearch);
      if (userMembershipFilter) params.set('membershipStatus', userMembershipFilter);
      const res = await api.get(`/super-admin/users?${params}`);
      return res.data;
    },
    enabled: activeTab === 'users',
    staleTime: 60 * 1000,
  });
  const users = usersData?.users || [];
  const userTotal = usersData?.total || 0;
  const userTotalPages = usersData?.totalPages || 1;

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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#111] font-[Inter]">Memberships</h1>
        <p className="text-sm text-text-muted mt-1">View and track all membership records and registered users</p>
      </div>

      {/* ── Tabs ────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-dark-border mb-6">
        <button
          onClick={() => setActiveTab('memberships')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
            activeTab === 'memberships'
              ? 'text-primary border-primary'
              : 'text-[#666] border-transparent hover:text-[#111]'
          }`}
        >
          <CreditCard size={15} /> Memberships
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
            activeTab === 'users'
              ? 'text-primary border-primary'
              : 'text-[#666] border-transparent hover:text-[#111]'
          }`}
        >
          <Users size={15} /> Users
        </button>
      </div>

      {/* ── Filter bar ──────────────────────────────────── */}
      {activeTab === 'memberships' && (<>
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
                          {row.sport ? (
                            <span className="text-xs bg-[#e0f2fe] text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-100 capitalize">
                              {row.sport}
                            </span>
                          ) : sportsIncluded.length > 0 ? (
                            sportsIncluded.map((sp, idx) => (
                              <span key={idx} className="text-xs bg-[#F5F5F5] text-[#444] px-2 py-0.5 rounded">
                                {typeof sp === 'string' ? sp : sp.name || '—'}
                              </span>
                            ))
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
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
      </>)}

      {/* ══════════════════════════════════════════════════
          Users Tab
         ══════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div>
          {/* Search + Filter */}
          <div className="card mb-6">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 min-w-60">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone…"
                  value={userSearch}
                  onChange={e => { setUserSearch(e.target.value); userSearchTimer(e.target.value); }}
                  className="input-field pl-9"
                />
              </div>
              <select
                value={userMembershipFilter}
                onChange={e => { setUserMembershipFilter(e.target.value); setUserPage(1); }}
                className="input-field w-auto min-w-45"
              >
                <option value="">All Users</option>
                <option value="active">Active Membership</option>
                <option value="expired">Expired Membership</option>
                <option value="pending">Pending Membership</option>
                <option value="frozen">Frozen Membership</option>
                <option value="cancelled">Cancelled Membership</option>
                <option value="none">No Membership</option>
              </select>
              {(userSearch || userMembershipFilter) && (
                <button
                  onClick={() => { setUserSearch(''); setDebouncedUserSearch(''); setUserMembershipFilter(''); setUserPage(1); }}
                  className="btn-ghost text-xs gap-1 shrink-0"
                >
                  <X size={14} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-border bg-[#FAFAFA]">
                    <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">Phone</th>
                    <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">Membership Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">Expires</th>
                    <th className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i} className="border-b border-dark-hover">
                        {[...Array(7)].map((__, j) => (
                          <td key={j} className="px-4 py-4"><div className="skeleton h-4 w-24" /></td>
                        ))}
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                            <Users size={28} className="text-text-muted" />
                          </div>
                          <p className="text-[#111] font-medium">No users found</p>
                          <p className="text-xs text-text-muted">Users will appear here once they register.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map(u => {
                      const mList = u.memberships || [];
                      const isMultiple = mList.length > 1;
                      const primaryM = mList.find(m => m.status === 'active') || mList[0] || null;
                      const isExpanded = expandedUser === u._id;

                      const statusColors = {
                        active: 'bg-green-50 text-green-700 border-green-200',
                        expired: 'bg-red-50 text-red-600 border-red-200',
                        pending: 'bg-amber-50 text-amber-700 border-amber-200',
                        frozen: 'bg-blue-50 text-blue-700 border-blue-200',
                        cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
                      };

                      const StatusBadge = ({ m }) => m ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors[m.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                          {m.status === 'active' ? <CheckCircle size={11} /> : m.status === 'expired' ? <AlertCircle size={11} /> : <Clock size={11} />}
                          {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        </span>
                      ) : <span className="text-xs text-text-muted">—</span>;

                      return (
                        <>
                          <motion.tr
                            key={u._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                            onClick={() => isMultiple && setExpandedUser(isExpanded ? null : u._id)}
                            className={`border-b border-dark-hover transition-colors ${isMultiple ? 'cursor-pointer hover:bg-blue-50/40' : 'hover:bg-[#FAFAFA]'}`}
                          >
                            {/* User */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {u.photo ? (
                                  <img src={u.photo} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center text-xs font-semibold shrink-0">
                                    {getInitials(u.name)}
                                  </div>
                                )}
                                <span className="font-medium text-[#111] truncate max-w-35">{u.name || '—'}</span>
                              </div>
                            </td>
                            {/* Email */}
                            <td className="px-4 py-3 text-[#444] text-xs">{u.email || '—'}</td>
                            {/* Phone */}
                            <td className="px-4 py-3 text-[#444]">{u.phone || <span className="text-text-muted italic text-xs">Not set</span>}</td>
                            {/* Plan */}
                            <td className="px-4 py-3">
                              {isMultiple ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold cursor-pointer">
                                  <Users size={11} /> {mList.length} Memberships {isExpanded ? '▲' : '▼'}
                                </span>
                              ) : primaryM ? (
                                <span className="font-medium text-[#111]">{primaryM.planId?.name || '—'}</span>
                              ) : (
                                <span className="text-text-muted text-xs">No membership</span>
                              )}
                            </td>
                            {/* Status */}
                            <td className="px-4 py-3">
                              {isMultiple ? (
                                <span className="text-xs text-text-muted">—</span>
                              ) : (
                                <StatusBadge m={primaryM} />
                              )}
                            </td>
                            {/* Expires */}
                            <td className="px-4 py-3 text-[#444] text-xs">
                              {isMultiple ? '—' : (primaryM?.endDate ? formatDate(primaryM.endDate) : '—')}
                            </td>
                            {/* Joined */}
                            <td className="px-4 py-3 text-[#444] text-xs">{formatDate(u.createdAt)}</td>
                          </motion.tr>

                          {/* Expanded memberships row */}
                          {isMultiple && isExpanded && (
                            <tr key={`${u._id}-expanded`} className="border-b border-dark-hover bg-blue-50/20">
                              <td colSpan={7} className="px-6 py-3">
                                <div className="space-y-2">
                                  {mList.map((m, idx) => (
                                    <div key={idx} className="flex items-center gap-4 bg-white border border-dark-border rounded-lg px-4 py-2.5 text-sm">
                                      <span className="font-medium text-[#111] flex-1">{m.planId?.name || '—'}</span>
                                      <StatusBadge m={m} />
                                      <span className="text-xs text-text-muted whitespace-nowrap">
                                        {formatDate(m.startDate)} → {formatDate(m.endDate)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!usersLoading && userTotal > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-dark-border">
                <p className="text-xs text-text-muted">
                  Showing <span className="font-medium text-[#111]">{Math.min((userPage - 1) * 20 + 1, userTotal)}–{Math.min(userPage * 20, userTotal)}</span> of{' '}
                  <span className="font-medium text-[#111]">{userTotal}</span> users
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                    disabled={userPage <= 1}
                    className="p-1.5 rounded-lg hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setUserPage(p => Math.min(userTotalPages, p + 1))}
                    disabled={userPage >= userTotalPages}
                    className="p-1.5 rounded-lg hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
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
          <div className="bg-[#FAFAFA] border border-dark-hover rounded-xl p-4 space-y-2.5">
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
                  className="flex items-center justify-between bg-[#FAFAFA] border border-dark-hover rounded-lg px-4 py-2.5 text-sm"
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
    <div className="bg-[#FAFAFA] border border-dark-hover rounded-xl px-3 py-2.5">
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
    <div className="bg-[#FAFAFA] border border-dark-hover rounded-xl px-3 py-3 text-center">
      <p className={`font-bold text-[#111] ${small ? 'text-xs' : 'text-xl'}`}>{value}</p>
      <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}
