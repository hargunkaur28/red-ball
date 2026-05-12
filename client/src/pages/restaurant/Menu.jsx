import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency } from '../../lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function Menu() {
  const { data } = useQuery({ queryKey: ['menu'], queryFn: () => api.get('/menu').then(r => r.data) });
  return (
    <div>
      <PageHeader title="Menu Management" subtitle="Manage food items and categories" action={<button className="btn-primary">+ Add Item</button>} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data?.items || []).map((item, i) => (
          <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[#111111] font-medium">{item.name}</h3>
              <span className={`w-3 h-3 rounded-full ${item.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            <p className="text-xs text-[#888888] mb-3">{item.description || 'No description'}</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.sizes?.map(s => <span key={s.label} className="badge badge-info text-[10px]">{s.label}: {formatCurrency(s.price)}</span>)}
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1 text-xs">Edit</button>
              <button className="btn-ghost text-xs">{item.isAvailable ? <CheckCircle2 size={16} className='text-green-600 inline' /> : <XCircle size={16} className='text-red-600 inline' />}</button>
            </div>
          </motion.div>
        ))}
        {(!data?.items || data.items.length === 0) && <div className="col-span-3 card text-center py-12 text-[#888888]">No menu items yet. Add your first item!</div>}
      </div>
    </div>
  );
}
