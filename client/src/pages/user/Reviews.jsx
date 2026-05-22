import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { toast } from 'sonner';
import { Star, MessageSquare, Utensils, Shield } from 'lucide-react';

const categoryButton = (active) =>
  `flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition ${
    active ? 'border-[#df1526] bg-[#df1526] text-white' : 'border-white/10 bg-white/[0.04] text-white/58 hover:bg-white/[0.07]'
  }`;

export default function UserReviews() {
  const qc = useQueryClient();
  const [category, setCategory] = useState('food');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => api.get('/reviews/my-reviews').then(r => r.data),
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
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error('Please add a comment');
    mutation.mutate({ category, rating, comment });
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#df1526]">Red Ball Academy</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl tracking-tight text-white">Reviews</h1>
        <p className="mt-2 text-sm text-white/50">Share your experience with our food and services</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="space-y-5 rounded-[28px] border border-[#222A2A] bg-[#111515] p-6 shadow-2xl shadow-black/25">
            <h3 className="text-lg font-black text-white">Write a Review</h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-white/38">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setCategory('food')} className={categoryButton(category === 'food')}>
                    <Utensils size={18} />
                    <span className="text-xs font-bold">Food</span>
                  </button>
                  <button type="button" onClick={() => setCategory('sports')} className={categoryButton(category === 'sports')}>
                    <Shield size={18} />
                    <span className="text-xs font-bold">Services</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-white/38">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`rounded-lg p-1.5 transition-colors ${rating >= star ? 'text-[#F5A623]' : 'text-white/20 hover:text-[#F5A623]'}`}
                    >
                      <Star size={24} fill={rating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-white/38">Comment</label>
                <textarea
                  className="min-h-[130px] w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#df1526] focus:bg-white/[0.06]"
                  placeholder="Tell us what you liked or how we can improve..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex w-full items-center justify-center rounded-full bg-[#df1526] py-3 font-black text-white transition hover:brightness-110 disabled:opacity-50"
              >
                {mutation.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-[28px] border border-[#222A2A] bg-[#111515] p-6 shadow-2xl shadow-black/25">
            <h3 className="mb-5 text-lg font-black text-white">My Past Reviews</h3>

            {!data?.reviews || data.reviews.length === 0 ? (
              <div className="py-12 text-center text-sm text-white/45">
                <MessageSquare size={34} className="mx-auto mb-3 text-white/20" />
                No reviews submitted yet.
              </div>
            ) : (
              <div className="space-y-4">
                {data.reviews.map((review) => (
                  <div key={review._id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                          review.category === 'food' ? 'bg-amber-500/12 text-amber-300' : 'bg-sky-500/12 text-sky-300'
                        }`}>
                          {review.category === 'sports' ? 'Services' : review.category}
                        </span>
                        <div className="mt-2 flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={14} fill={review.rating >= star ? '#F5A623' : 'none'} className={review.rating >= star ? 'text-[#F5A623]' : 'text-white/18'} />
                          ))}
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                        review.status === 'approved' ? 'bg-emerald-500/12 text-emerald-300' :
                          review.status === 'pending' ? 'bg-amber-500/12 text-amber-300' : 'bg-red-500/12 text-red-300'
                      }`}>
                        {review.status}
                      </span>
                    </div>
                    <p className="text-sm text-white/68">{review.comment}</p>
                    <span className="mt-3 block text-[10px] text-white/34">{new Date(review.createdAt).toLocaleDateString()}</span>
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
