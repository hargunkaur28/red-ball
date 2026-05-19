import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';
import { toast } from 'sonner';
import { Star, MessageSquare, Utensils, Shield } from 'lucide-react';

export default function UserReviews() {
  const qc = useQueryClient();
  const [category, setCategory] = useState('food');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data } = useQuery({ 
    queryKey: ['my-reviews'], 
    queryFn: () => api.get('/reviews/my-reviews').then(r => r.data) 
  });

  const mutation = useMutation({
    mutationFn: (newReview) => api.post('/reviews', newReview),
    onSuccess: () => {
      qc.invalidateQueries(['my-reviews']);
      toast.success('Review submitted for moderation!');
      setComment('');
      setRating(5);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Could not submit review');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error('Please add a comment');
    mutation.mutate({ category, rating, comment });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" subtitle="Share your experience with our food and services" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-[#EAEAEA] shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-[#111111]">Write a Review</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('food')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      category === 'food' ? 'bg-black text-white border-black' : 'bg-white text-[#666666] border-[#EAEAEA] hover:bg-[#F9F9F9]'
                    }`}
                  >
                    <Utensils size={18} />
                    <span className="text-xs font-medium">Food</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('sports')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      category === 'sports' ? 'bg-black text-white border-black' : 'bg-white text-[#666666] border-[#EAEAEA] hover:bg-[#F9F9F9]'
                    }`}
                  >
                    <Shield size={18} />
                    <span className="text-xs font-medium">Services</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1.5 transition-colors ${rating >= star ? 'text-[#F5A623]' : 'text-gray-300 hover:text-[#F5A623]'}`}
                    >
                      <Star size={24} fill={rating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Comment</label>
                <textarea
                  className="w-full bg-[#F9F9F9] border border-[#EAEAEA] rounded-xl px-4 py-3 text-sm text-[#111111] placeholder-[#999999] outline-none focus:border-black min-h-[120px]"
                  placeholder="Tell us what you liked or how we can improve..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-black hover:bg-[#222222] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {mutation.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-[#EAEAEA] shadow-sm">
            <h3 className="font-bold text-lg text-[#111111] mb-4">My Past Reviews</h3>

            {!data?.reviews || data.reviews.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                No reviews submitted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {data.reviews.map((review) => (
                  <div key={review._id} className="p-4 bg-[#F9F9F9] rounded-xl border border-[#EAEAEA]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          review.category === 'food' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {review.category === 'sports' ? 'Services' : review.category}
                        </span>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={14} fill={review.rating >= star ? '#F5A623' : 'none'} className={review.rating >= star ? 'text-[#F5A623]' : 'text-gray-300'} />
                          ))}
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        review.status === 'approved' ? 'bg-green-100 text-green-700' :
                        review.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {review.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#333333]">{review.comment}</p>
                    <span className="text-[10px] text-gray-500 block mt-2">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
