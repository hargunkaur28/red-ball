import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Search, Filter, MessageSquare, Star, Trash2, Edit2, EyeOff, Archive, CheckCircle, Mail, Eye, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const fetchReviews = async (filters) => {
  const { data } = await api.get('/super-admin/communication/reviews', { params: filters });
  return data;
};

const fetchMessages = async (filters) => {
  const { data } = await api.get('/super-admin/communication/messages', { params: filters });
  return data;
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'approved': return 'bg-green-50 text-green-600 border-green-200';
    case 'hidden': return 'bg-gray-50 text-gray-600 border-gray-200';
    default: return 'bg-orange-50 text-orange-600 border-orange-200';
  }
};

export default function Communication() {
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'messages'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Review Filters
  const [reviewFilter, setReviewFilter] = useState('Latest');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('All');
  const [showDeletedReviews, setShowDeletedReviews] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  // Message Filters
  const [showArchived, setShowArchived] = useState(false);
  const [messageReadFilter, setMessageReadFilter] = useState('All');

  const qc = useQueryClient();

  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['admin-reviews', reviewFilter, showDeletedReviews, reviewStatusFilter],
    queryFn: () => {
      const params = { isDeleted: showDeletedReviews };
      if (reviewStatusFilter !== 'All') params.status = reviewStatusFilter.toLowerCase();
      // Further sorting could be done in frontend for simplicity since we get all
      return fetchReviews(params);
    }
  });

  const { data: messages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['admin-messages', showArchived],
    queryFn: () => fetchMessages({ isArchived: showArchived })
  });

  const editReviewMut = useMutation({
    mutationFn: ({ id, data }) => api.put(`/super-admin/communication/reviews/${id}`, data),
    onSuccess: () => {
      toast.success('Review updated successfully');
      setEditingReview(null);
      qc.invalidateQueries(['admin-reviews']);
    }
  });

  const deleteReviewMut = useMutation({
    mutationFn: (id) => api.delete(`/super-admin/communication/reviews/${id}`),
    onSuccess: () => {
      toast.success('Review soft deleted');
      qc.invalidateQueries(['admin-reviews']);
    }
  });

  const hideReviewMut = useMutation({
    mutationFn: (id) => api.put(`/super-admin/communication/reviews/${id}`, { status: 'hidden' }),
    onSuccess: () => {
      toast.success('Review hidden');
      qc.invalidateQueries(['admin-reviews']);
    }
  });

  const markReadMut = useMutation({
    mutationFn: ({ id, isRead }) => api.patch(`/super-admin/communication/messages/${id}/read`, { isRead }),
    onSuccess: () => {
      qc.invalidateQueries(['admin-messages']);
    }
  });

  const archiveMessageMut = useMutation({
    mutationFn: ({ id, isArchived }) => api.patch(`/super-admin/communication/messages/${id}/archive`, { isArchived }),
    onSuccess: (data, variables) => {
      toast.success(variables.isArchived ? 'Message archived' : 'Message unarchived');
      qc.invalidateQueries(['admin-messages']);
    }
  });

  const deleteMessageMut = useMutation({
    mutationFn: (id) => api.delete(`/super-admin/communication/messages/${id}`),
    onSuccess: () => {
      toast.success('Message deleted');
      qc.invalidateQueries(['admin-messages']);
    }
  });

  // Filter and Sort Reviews locally
  const filteredReviews = reviews.filter(r => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!r.name?.toLowerCase().includes(q) && !r.comment?.toLowerCase().includes(q) && !r.category?.toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    if (reviewFilter === 'Highest Rated') return b.rating - a.rating;
    if (reviewFilter === 'Lowest Rated') return a.rating - b.rating;
    return new Date(b.createdAt) - new Date(a.createdAt); // Latest default
  });

  // Filter Messages locally
  const filteredMessages = messages.filter(m => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!m.name?.toLowerCase().includes(q) && !m.email?.toLowerCase().includes(q) && !m.subject?.toLowerCase().includes(q)) return false;
    }
    if (messageReadFilter === 'Read' && !m.isRead) return false;
    if (messageReadFilter === 'Unread' && m.isRead) return false;
    return true;
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111111]" style={{ fontFamily: "'Inter', sans-serif" }}>Communication Hub</h1>
          <p className="text-sm text-[#666666] mt-1">Manage reviews and user inquiries seamlessly.</p>
        </div>

        {/* Global Search */}
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999]" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#EAEAEA] rounded-xl text-sm focus:outline-none focus:border-[#C8102E] transition-colors"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[#EAEAEA]">
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 px-4 text-sm font-medium transition-all ${activeTab === 'reviews' ? 'text-[#C8102E] border-b-2 border-[#C8102E]' : 'text-[#666666] hover:text-[#111111]'}`}
        >
          Reviews
        </button>
        <button 
          onClick={() => setActiveTab('messages')}
          className={`pb-3 px-4 text-sm font-medium transition-all ${activeTab === 'messages' ? 'text-[#C8102E] border-b-2 border-[#C8102E]' : 'text-[#666666] hover:text-[#111111]'}`}
        >
          Contact Messages
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'reviews' ? (
          <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <select 
                value={reviewStatusFilter} 
                onChange={e => setReviewStatusFilter(e.target.value)}
                className="bg-white border border-[#EAEAEA] rounded-lg px-3 py-1.5 text-sm outline-none text-[#111]"
              >
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="hidden">Hidden</option>
              </select>
              <select 
                value={reviewFilter} 
                onChange={e => setReviewFilter(e.target.value)}
                className="bg-white border border-[#EAEAEA] rounded-lg px-3 py-1.5 text-sm outline-none text-[#111]"
              >
                <option>Latest</option>
                <option>Highest Rated</option>
                <option>Lowest Rated</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-[#666]">
                <input type="checkbox" checked={showDeletedReviews} onChange={e => setShowDeletedReviews(e.target.checked)} />
                Show Deleted
              </label>
            </div>

            {isLoadingReviews ? (
              <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin"/></div>
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-16 bg-white border border-[#EAEAEA] rounded-2xl">
                <Star size={40} className="mx-auto text-[#CCCCCC] mb-3" />
                <p className="text-[#666666] font-medium">No reviews found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReviews.map(review => (
                  <div key={review._id} className={`bg-white p-5 rounded-2xl border ${review.isDeleted ? 'border-red-200 bg-red-50/50' : 'border-[#EAEAEA]'} shadow-sm relative group`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        {review.userId?.avatar ? (
                          <img src={review.userId.avatar} alt={review.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center font-bold text-[#666] text-sm">
                            {review.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-sm text-[#111]">{review.name}</p>
                          <p className="text-xs text-[#999] capitalize">{review.category}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1 bg-[#FFF9ED] text-[#F5A623] px-2 py-0.5 rounded-full text-xs font-bold">
                          <Star size={12} fill="currentColor" /> {review.rating}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {review.isFeatured && (
                            <span className="text-[10px] px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-600 uppercase tracking-wider font-bold">
                              Featured
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${getStatusBadge(review.status)}`}>
                            {review.status || 'pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-[#444] mb-4 line-clamp-3 leading-relaxed">{review.comment}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[11px] text-[#999]">{format(new Date(review.createdAt), 'MMM d, yyyy')}</span>
                      
                      {!review.isDeleted && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingReview(review)} className="p-1.5 text-[#666] hover:bg-[#F5F5F5] rounded-md transition-colors" title="Edit Review">
                            <Edit2 size={16} />
                          </button>
                          {review.status !== 'hidden' && (
                            <button onClick={() => hideReviewMut.mutate(review._id)} className="p-1.5 text-[#666] hover:bg-[#F5F5F5] rounded-md transition-colors" title="Hide Review">
                              <EyeOff size={16} />
                            </button>
                          )}
                          <button onClick={() => deleteReviewMut.mutate(review._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Soft Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                      {review.isDeleted && <span className="text-xs text-red-500 font-medium">Deleted</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex items-center gap-3 mb-4">
              <select 
                value={messageReadFilter} 
                onChange={e => setMessageReadFilter(e.target.value)}
                className="bg-white border border-[#EAEAEA] rounded-lg px-3 py-1.5 text-sm outline-none text-[#111]"
              >
                <option value="All">All Messages</option>
                <option value="Read">Read</option>
                <option value="Unread">Unread</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-[#666]">
                <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                Show Archived
              </label>
            </div>

            {isLoadingMessages ? (
              <div className="flex justify-center p-8"><div className="w-8 h-8 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin"/></div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-16 bg-white border border-[#EAEAEA] rounded-2xl">
                <MessageSquare size={40} className="mx-auto text-[#CCCCCC] mb-3" />
                <p className="text-[#666666] font-medium">No contact submissions yet.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#EAEAEA] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F9F9F9] border-b border-[#EAEAEA] text-xs uppercase text-[#666] font-semibold tracking-wider">
                        <th className="px-5 py-4">Sender</th>
                        <th className="px-5 py-4">Subject & Message</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMessages.map(msg => (
                        <tr key={msg._id} className={`border-b border-[#EAEAEA] last:border-0 hover:bg-[#FDFDFD] transition-colors ${!msg.isRead ? 'bg-[#FFF0F2]/30' : ''}`}>
                          <td className="px-5 py-4 align-top">
                            <p className="text-sm font-semibold text-[#111]">{msg.name}</p>
                            <p className="text-xs text-[#666] mt-0.5">{msg.email}</p>
                            {msg.phone && <p className="text-xs text-[#999] mt-0.5">{msg.phone}</p>}
                          </td>
                          <td className="px-5 py-4">
                            {msg.subject && <p className="text-sm font-medium text-[#111] mb-1">{msg.subject}</p>}
                            <p className="text-sm text-[#555] line-clamp-2">{msg.message}</p>
                          </td>
                          <td className="px-5 py-4 align-top whitespace-nowrap">
                            <span className="text-xs text-[#666]">{format(new Date(msg.createdAt), 'MMM d, h:mm a')}</span>
                          </td>
                          <td className="px-5 py-4 align-top text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!msg.isRead ? (
                                <button onClick={() => markReadMut.mutate({ id: msg._id, isRead: true })} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors" title="Mark as Read">
                                  <CheckCircle size={16} />
                                </button>
                              ) : (
                                <button onClick={() => markReadMut.mutate({ id: msg._id, isRead: false })} className="p-1.5 text-[#999] hover:bg-[#F5F5F5] rounded-md transition-colors" title="Mark as Unread">
                                  <Eye size={16} />
                                </button>
                              )}
                              <a href={`mailto:${msg.email}`} className="p-1.5 text-[#111] hover:bg-[#F5F5F5] rounded-md transition-colors" title="Reply">
                                <Mail size={16} />
                              </a>
                              {!msg.isArchived ? (
                                <button onClick={() => archiveMessageMut.mutate({ id: msg._id, isArchived: true })} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-md transition-colors" title="Archive">
                                  <Archive size={16} />
                                </button>
                              ) : (
                                <button onClick={() => archiveMessageMut.mutate({ id: msg._id, isArchived: false })} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors" title="Unarchive">
                                  <Archive size={16} />
                                </button>
                              )}
                              <button onClick={() => deleteMessageMut.mutate(msg._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Review Modal */}
      <AnimatePresence>
        {editingReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-[#111] mb-4">Edit Review</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-1">Status</label>
                  <select 
                    className="w-full border border-[#EAEAEA] rounded-lg p-2 text-sm outline-none"
                    value={editingReview.status}
                    onChange={e => setEditingReview({...editingReview, status: e.target.value})}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-1">Rating</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="5"
                    className="w-full border border-[#EAEAEA] rounded-lg p-2 text-sm outline-none"
                    value={editingReview.rating}
                    onChange={e => setEditingReview({...editingReview, rating: Number(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#666] mb-1">Comment</label>
                  <textarea 
                    rows={4}
                    className="w-full border border-[#EAEAEA] rounded-lg p-2 text-sm outline-none resize-none"
                    value={editingReview.comment}
                    onChange={e => setEditingReview({...editingReview, comment: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#EAEAEA]">
                  <input 
                    type="checkbox" 
                    id="featuredToggle"
                    className="w-4 h-4 text-[#C8102E] rounded focus:ring-[#C8102E] cursor-pointer"
                    checked={editingReview.isFeatured || false}
                    onChange={e => setEditingReview({...editingReview, isFeatured: e.target.checked})}
                  />
                  <label htmlFor="featuredToggle" className="text-sm font-medium text-[#111] cursor-pointer">
                    Show on Home Page (Featured)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setEditingReview(null)}
                  className="flex-1 px-4 py-2 bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#111] rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => editReviewMut.mutate({ id: editingReview._id, data: { status: editingReview.status, rating: editingReview.rating, comment: editingReview.comment, isFeatured: editingReview.isFeatured } })}
                  disabled={editReviewMut.isPending}
                  className="flex-1 px-4 py-2 bg-[#C8102E] hover:bg-[#A00D25] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {editReviewMut.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
