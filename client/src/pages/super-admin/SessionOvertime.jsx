import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, IndianRupee, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';
import { formatCurrency } from '../../lib/utils';

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusClass(status) {
  if (status === 'Paid') return 'bg-green-100 text-green-700';
  if (status === 'Waived') return 'bg-blue-100 text-blue-700';
  if (status === 'Pending Collection') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-700';
}

export default function SessionOvertime() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [collectionStatus, setCollectionStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimer = useMemo(() => {
    return (value) => {
      const id = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 350);
      return () => clearTimeout(id);
    };
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['super-admin-overtime-sessions', debouncedSearch, collectionStatus, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (collectionStatus) params.set('collectionStatus', collectionStatus);
      params.set('page', page);
      params.set('limit', limit);
      const res = await api.get(`/super-admin/overtime-sessions?${params.toString()}`);
      return res.data;
    },
  });

  const feeMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/attendance/${id}/fee-collection`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin-overtime-sessions'] });
      toast.success('Collection status updated.');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update collection status'),
  });

  const sessions = data?.sessions || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const summary = data?.summary || {};

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    searchTimer(value);
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCollectionStatus('');
    setPage(1);
  };

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111] font-[Inter]">Session Overtime</h1>
        <p className="text-sm text-text-muted mt-1">Track allowed time, actual duration, overtime fees, and collection status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs text-[#888] font-semibold uppercase">Overtime Sessions</p>
            <p className="text-2xl font-bold text-[#111]">{summary.overtimeSessions || 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <IndianRupee size={20} />
          </div>
          <div>
            <p className="text-xs text-[#888] font-semibold uppercase">Pending Collection</p>
            <p className="text-2xl font-bold text-[#111]">{formatCurrency(summary.pendingAmount || 0)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-[#888] font-semibold uppercase">Collection Queue</p>
            <p className="text-2xl font-bold text-[#111]">{summary.pendingCollections || 0}</p>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by player name, phone, or email..."
              value={search}
              onChange={handleSearchChange}
              className="input-field pl-9"
            />
          </div>
          <select
            value={collectionStatus}
            onChange={(event) => {
              setCollectionStatus(event.target.value);
              setPage(1);
            }}
            className="input-field w-auto min-w-[190px]"
          >
            <option value="">All Collection Statuses</option>
            <option value="Pending Collection">Pending Collection</option>
            <option value="Paid">Paid</option>
            <option value="Waived">Waived</option>
            <option value="Not Applicable">Not Applicable</option>
          </select>
          {(search || collectionStatus) && (
            <button onClick={clearFilters} className="btn-ghost text-xs gap-1 shrink-0">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EAEAEA] bg-[#FAFAFA]">
                {['Player', 'Phone', 'Sport', 'In Time', 'Out Time', 'Allowed', 'Actual', 'Overtime', 'Late Amount', 'Collection'].map((heading) => (
                  <th key={heading} className="text-left px-4 py-3 font-medium text-[#666] text-xs uppercase tracking-wider">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b border-[#F0F0F0]">
                    {Array.from({ length: 10 }).map((__, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-4">
                        <div className="skeleton h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-red-600">Failed to load session records.</td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-[#888]">No completed sessions found.</td>
                </tr>
              ) : (
                sessions.map((session, index) => (
                  <motion.tr
                    key={session._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-[#F0F0F0] table-row"
                  >
                    <td className="px-4 py-3 font-medium text-[#111]">{session.userId?.name || 'Walk-in Player'}</td>
                    <td className="px-4 py-3 text-[#444]">{session.userId?.phone || '-'}</td>
                    <td className="px-4 py-3 text-[#111]">
                      <div className="capitalize font-medium">{session.sport || '-'}</div>
                      {session.relatedBookingType === 'one-time-play' || session.entitlementType === 'one-time-play' ? (
                        <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">One-Timer</div>
                      ) : session.membershipPlanSnapshot ? (
                        <div className="text-[10px] font-bold text-[#888] uppercase tracking-wider mt-0.5">{session.membershipPlanSnapshot}</div>
                      ) : session.entitlementType ? (
                        <div className="text-[10px] font-bold text-[#888] uppercase tracking-wider mt-0.5">{session.entitlementType.replace('-', ' ')}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-[#444] text-xs whitespace-nowrap">{formatDateTime(session.checkInTime)}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {session.checkOutTime ? (
                        <span className="text-[#444]">{formatDateTime(session.checkOutTime)}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#444] whitespace-nowrap">{session.allowedDurationMinutes || 75} min</td>
                    <td className="px-4 py-3 text-[#111] font-medium whitespace-nowrap">{session.actualDurationMinutes || session.duration || 0} min</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(session.overtimeMinutes || 0) > 0 ? (
                        <span className="text-red-700 font-semibold">{session.overtimeMinutes} min</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(session.lateAmount || 0) > 0 ? (
                        <span className="text-red-700 font-semibold">{formatCurrency(session.lateAmount)}</span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusClass(session.feeCollectionStatus)}`}>
                          {session.feeCollectionStatus || 'Not Applicable'}
                        </span>
                        {session.feeCollectionStatus === 'Pending Collection' && (
                          <>
                            <button
                              onClick={() => feeMutation.mutate({ id: session._id, status: 'Paid' })}
                              className="text-[10px] font-bold text-green-700 hover:underline"
                            >
                              Paid
                            </button>
                            <button
                              onClick={() => feeMutation.mutate({ id: session._id, status: 'Waived' })}
                              className="text-[10px] font-bold text-blue-700 hover:underline"
                            >
                              Waive
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#EAEAEA]">
            <p className="text-xs text-text-muted">
              Showing <span className="font-medium text-[#111]">{from}-{to}</span> of <span className="font-medium text-[#111]">{total}</span> results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="w-8 h-8 rounded-lg bg-[#111] text-white text-xs font-medium flex items-center justify-center">{page}</span>
              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-[#F5F5F5] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
