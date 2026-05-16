import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Power, PowerOff, IndianRupee, Users, MapPin, Image as ImageIcon, Search, X, Loader2 } from 'lucide-react';
import api from '../../lib/axios';
import { toast } from 'sonner';
import PageHeader from '../../components/shared/PageHeader';

export default function ManageServices() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then(res => res.data.services),
  });

  const createMutation = useMutation({
    mutationFn: (newService) => api.post('/services', newService),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service created successfully');
      setIsModalOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create service'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/services/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service updated successfully');
      setIsModalOpen(false);
      setEditingService(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update service'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/services/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service deleted');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => api.patch(`/services/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  const filteredServices = data?.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const serviceData = Object.fromEntries(formData);
    
    if (editingService) {
      updateMutation.mutate({ id: editingService._id, data: serviceData });
    } else {
      createMutation.mutate(serviceData);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="animate-spin text-gray-400" /></div>;

  return (
    <div className="pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <PageHeader 
          title="Manage Services" 
          subtitle="Configure sports, pricing, and capacity for the academy" 
        />
        <button 
          onClick={() => { setEditingService(null); setIsModalOpen(true); }}
          className="btn-primary w-full sm:w-auto gap-2 h-11"
        >
          <Plus size={20} /> Add New Service
        </button>
      </div>

      <div className="mb-6 relative">
        <input 
          type="text" 
          placeholder="Search services..." 
          className="input-field pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices?.map((service) => (
          <motion.div 
            key={service._id}
            layout
            className="card overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
          >
            <div className="aspect-video bg-gray-100 relative group">
              {service.image ? (
                <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ImageIcon size={48} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button 
                  onClick={() => { setEditingService(service); setIsModalOpen(true); }}
                  className="p-2 bg-white rounded-full text-gray-700 hover:text-black shadow-lg"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => { if(confirm('Delete service?')) deleteMutation.mutate(service._id); }}
                  className="p-2 bg-white rounded-full text-red-500 hover:text-red-600 shadow-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
                <button 
                  onClick={() => toggleMutation.mutate(service._id)}
                  className={`p-1.5 rounded-lg transition-colors ${service.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                >
                  {service.isActive ? <Power size={18} /> : <PowerOff size={18} />}
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <IndianRupee size={16} className="text-gray-400" />
                  <span className="font-semibold text-gray-900">₹{service.hourlyPrice}</span> / hr
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} className="text-gray-400" />
                  Max <span className="font-semibold text-gray-900">{service.playerCapacity}</span> players
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{service.arenaAssignment || 'Unassigned'}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 line-clamp-2 italic">
                {service.description || 'No description provided.'}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden z-10"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingService ? 'Edit Service' : 'Add New Service'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                  <input name="name" defaultValue={editingService?.name} required className="input-field" placeholder="e.g., Cricket Turf" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (per hr)</label>
                    <input name="hourlyPrice" type="number" defaultValue={editingService?.hourlyPrice} required className="input-field" placeholder="₹" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Players</label>
                    <input name="playerCapacity" type="number" defaultValue={editingService?.playerCapacity} required className="input-field" placeholder="e.g., 10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arena Assignment</label>
                  <input name="arenaAssignment" defaultValue={editingService?.arenaAssignment} className="input-field" placeholder="e.g., Court 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea name="description" defaultValue={editingService?.description} className="input-field min-h-[100px]" placeholder="Service details..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input name="image" defaultValue={editingService?.image} className="input-field" placeholder="https://..." />
                </div>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary w-full h-12 gap-2 mt-4"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin" /> : (editingService ? 'Update Service' : 'Create Service')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
