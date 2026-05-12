import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import DataTable from '../../components/shared/DataTable';
import FeeBadge from '../../components/shared/FeeBadge';
import { formatCurrency } from '../../lib/utils';

export default function OrderHistory() {
  const { data } = useQuery({ queryKey: ['my-orders'], queryFn: () => api.get('/orders/my-orders').then(r => r.data) });
  const columns = [
    { key: 'orderNumber', label: 'Order', render: r => <span className="font-mono text-black">{r.orderNumber}</span> },
    { key: 'items', label: 'Items', render: r => <span className="text-[#666666]">{r.items?.map(i => i.name).join(', ')}</span> },
    { key: 'total', label: 'Total', render: r => <span className="text-[#111111] font-medium">{formatCurrency(r.totalAmount)}</span> },
    { key: 'status', label: 'Status', render: r => <FeeBadge status={r.status} /> },
  ];
  return (<div><PageHeader title="Order History" subtitle="Your past food orders" /><DataTable columns={columns} data={data?.orders || []} /></div>);
}
