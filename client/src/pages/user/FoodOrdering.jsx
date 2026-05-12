import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../../lib/axios';
import useCartStore from '../../store/cartStore';
import PageHeader from '../../components/shared/PageHeader';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

export default function FoodOrdering() {
  const { data } = useQuery({ queryKey: ['menu'], queryFn: () => api.get('/menu').then(r => r.data) });
  const { items, addItem, getItemCount, getSubtotal } = useCartStore();

  const handleAddItem = (item, size) => {
    addItem({ menuItemId: item._id, name: item.name, size: size.label, price: size.price });
    toast.success(`${item.name} added to cart`);
  };

  return (
    <div>
      <PageHeader title="Order Food" subtitle="Browse our restaurant menu"
        action={getItemCount() > 0 && (
          <a href="/user/orders" className="btn-primary">{getItemCount()} items · {formatCurrency(getSubtotal())}</a>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data?.items || []).filter(i => i.isAvailable).map((item, idx) => (
          <motion.div key={item._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
            className="card hover:border-[#EAEAEA] transition-all">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-3 h-3 rounded-sm border-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                    <span className={`block w-1.5 h-1.5 rounded-full m-[1px] ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                  </span>
                  <h3 className="text-[#111111] font-semibold">{item.name}</h3>
                </div>
                <p className="text-xs text-[#888888] line-clamp-2">{item.description}</p>
              </div>
              {item.image && <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />}
            </div>
            <div className="flex flex-wrap gap-2">
              {item.sizes?.map(size => (
                <button key={size.label} onClick={() => handleAddItem(item, size)}
                  className="btn-ghost text-xs flex items-center gap-1 hover:border-black/20">
                  {size.label} · {formatCurrency(size.price)} <span className="text-black">+</span>
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      {(!data?.items || data.items.length === 0) && (
        <div className="card text-center py-12 text-[#888888]">Menu items will appear here</div>
      )}
    </div>
  );
}
