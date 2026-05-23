import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame } from 'lucide-react';
import api from '../../lib/axios';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function FeaturedMenu() {
  const { data: menuData, isLoading } = useQuery({
    queryKey: ['public-menu-featured'],
    queryFn: () => api.get('/menu').then((r) => r.data),
  });

  const featuredItems = (menuData?.items || []).filter(item => item.featured).slice(0, 6);

  if (isLoading || featuredItems.length === 0) return null;

  return (
    <section className="relative pt-10 md:pt-16 pb-20 md:pb-32 bg-white overflow-hidden" data-theme="light">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#C8102E]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#F5A623]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center mb-16"
        >
          <p className="uppercase tracking-[5px] text-[13px] text-[#C8102E] mb-3 font-body font-semibold flex items-center gap-2">
            <Flame size={16} /> SIGNATURE DISHES
          </p>
          <h2 className="text-3xl md:text-5xl font-heading text-black tracking-wide mb-4">
            Featured Items
          </h2>
          <p className="text-black/60 max-w-xl font-body text-base md:text-lg">
            Handpicked favorites from the Red Ball Kitchen, designed for ultimate taste and performance.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-3 gap-3 md:gap-6 lg:gap-8"
        >
          {featuredItems.map((item) => (
            <motion.div
              key={item._id}
              variants={itemVariants}
              className="bg-white border border-black/5 shadow-sm rounded-xl md:rounded-[24px] overflow-hidden group hover:border-black/10 hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col"
            >
              <div className="relative h-32 sm:h-40 md:h-56 overflow-hidden">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-white/90 backdrop-blur-md px-2 py-1 md:px-3 md:py-1 rounded-full border border-black/10 shadow-sm">
                  <p className="text-[#C8102E] font-bold text-[10px] md:text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>₹{item.price || item.sizes?.[0]?.price}</p>
                </div>
              </div>
              
              <div className="p-3 md:p-6 flex-1 flex flex-col bg-white">
                <div className="flex items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                  <div className={`w-2.5 h-2.5 md:w-3 md:h-3 shrink-0 rounded-sm shadow-sm ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                  <p className="text-[9px] md:text-[10px] text-black/50 uppercase tracking-widest font-bold line-clamp-1">
                    {item.categoryId?.name || item.category || 'Category'}
                  </p>
                </div>
                <h3 className="text-base md:text-xl font-bold text-[#0D0D0D] mb-2 leading-tight group-hover:text-[#C8102E] transition-colors line-clamp-2">
                  {item.name}
                </h3>
                <p className="hidden md:block text-[#6B7280] text-sm line-clamp-2 mb-5 flex-1">
                  {item.description}
                </p>
                
                <div className="hidden md:flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-[9px] md:text-xs font-bold text-black/40 mt-auto">
                  <span>{item.calories} CAL</span>
                  <span className="hidden md:block w-1 h-1 rounded-full bg-black/20" />
                  <span>{item.protein}G PRO</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <Link
            to="/table-portal"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-black/20 text-black font-body font-bold text-sm hover:bg-black hover:text-white transition-all duration-300"
          >
            View Full Menu <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
