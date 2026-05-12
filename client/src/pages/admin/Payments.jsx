import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import SkeletonTable from '../../components/shared/SkeletonTable';
import FeeBadge from '../../components/shared/FeeBadge';
import { formatCurrency } from '../../lib/utils';
import { Printer } from 'lucide-react';

const openInvoice = (paymentId) => {
  const token = localStorage.getItem('accessToken');
  window.open(`/api/payments/${paymentId}/invoice/print?token=${token}`, '_blank');
};

export default function Payments() {
  const [tab, setTab] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['payments', tab],
    queryFn: () => api.get(`/payments?status=${tab}`).then(r => r.data),
  });

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice', sortable: true, render: r => <span className="font-mono text-black">{r.invoiceNumber}</span> },
    { key: 'student', label: 'Student', render: r => <span className="text-[#111111]">{r.studentId?.name || 'N/A'}</span> },
    { key: 'type', label: 'Type', render: r => <span className="badge badge-info">{r.type}</span> },
    { key: 'amount', label: 'Amount', sortable: true, render: r => formatCurrency(r.amount) },
    { key: 'gst', label: 'GST', render: r => formatCurrency(r.gstAmount) },
    { key: 'total', label: 'Total', render: r => <span className="font-semibold text-[#111111]">{formatCurrency(r.totalAmount)}</span> },
    { key: 'status', label: 'Status', render: r => <FeeBadge status={r.status} /> },
    { key: 'mode', label: 'Mode', render: r => <span className="text-[#666666] text-xs">{r.paymentMode || '-'}</span> },
    { key: 'actions', label: '', render: r => (
      <button onClick={() => openInvoice(r._id)} className="btn-ghost text-xs gap-1.5" title="Print Invoice">
        <Printer size={14} /> Invoice
      </button>
    )},
  ];

  const tabs = [
    { value: '', label: 'All Payments' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'refunded', label: 'Refunded' },
  ];

  return (
    <div>
      <PageHeader title="Payments & GST" subtitle="Track all payments and GST" />
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${tab === t.value ? 'bg-black text-white' : 'btn-ghost'}`}>{t.label}</button>
        ))}
      </div>
      {isLoading ? <SkeletonTable cols={8} /> : <DataTable columns={columns} data={data?.payments || []} />}
    </div>
  );
}
