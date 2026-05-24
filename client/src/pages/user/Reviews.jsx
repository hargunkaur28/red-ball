import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { toast } from 'sonner';
import { Star, MessageSquare, Utensils, Dumbbell } from 'lucide-react';

const SERVICE_SUBCATEGORIES = [
  { value: 'box-cricket',  label: 'Box Cricket',           emoji: '🏏' },
  { value: 'badminton',    label: 'Badminton',              emoji: '🏸' },
  { value: 'pickleball',   label: 'Pickleball',             emoji: '🎾' },
  { value: 'swimming',     label: 'Swimming',               emoji: '🏊' },
  { value: 'gym',          label: 'Gym & Fitness',          emoji: '💪' },
  { value: 'membership',   label: 'Membership / Plan',      emoji: '🎫' },
  { value: 'one-time',     label: 'One-Time Pass',          emoji: '🎟️' },
  { value: 'coaching',     label: 'Coaching',               emoji: '🎯' },
  { value: 'other',        label: 'Other',                  emoji: '✨' },
];

const FOOD_SUBCATEGORIES = [
  { value: 'beverages',    label: 'Beverages',              emoji: '☕' },
  { value: 'snacks',       label: 'Snacks',                 emoji: '🍿' },
  { value: 'meals',        label: 'Meals',                  emoji: '🍱' },
  { value: 'desserts',     label: 'Desserts',               emoji: '🍰' },
  { value: 'other',        label: 'Other',                  emoji: '🍽️' },
];

const CATEGORY_COLORS = {
  food: 'bg-amber-500/12 text-amber-300',
  sports: 'bg-sky-500/12 text-sky-300',
  membership: 'bg-violet-500/12 text-violet-300',
  'one-time': 'bg-emerald-500/12 text-emerald-300',
  coaching: 'bg-sky-500/12 text-sky-300',
  facilities: 'bg-sky-500/12 text-sky-300',
};

function categoryLabel(review) {
  if (review.subCategory) {
    const pool = review.category === 'food' ? FOOD_SUBCATEGORIES : SERVICE_SUBCATEGORIES;
    const found = pool.find(s => s.value === review.subCategory);
    if (found) return `${found.emoji} ${found.label}`;
  }
  if (review.category === 'sports') return '🏅 Services';
  return review.category.charAt(0).toUpperCase() + review.category.slice(1);
}

export default function UserReviews() {
  const qc = useQueryClient();
  const [group, setGroup] = useState('services'); // 'food' | 'services'
  const [subCategory, setSubCategory] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => api.get('/reviews/my-reviews').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (payload) => api.post('/reviews', payload),
    onSuccess: () => {
      qc.invalidateQueries(['my-reviews']);
      toast.success('Review submitted for moderation!');
      setComment('');
      setRating(5);
      setSubCategory('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not submit review'),
  });

  const handleGroupChange = (g) => {
    setGroup(g);
    setSubCategory('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error('Please add a comment');
    if (!subCategory) return toast.error('Please select a specific category');

    // Map group + subCategory → top-level category for the model
    let category = group === 'food' ? 'food' : 'sports';
    if (subCategory === 'membership') category = 'membership';
    if (subCategory === 'one-time') category = 'one-time';
    if (subCategory === 'coaching') category = 'coaching';

    mutation.mutate({ category, subCategory, rating, comment });
  };

  const subOptions = group === 'food' ? FOOD_SUBCATEGORIES : SERVICE_SUBCATEGORIES;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#df1526]">Red Ball Academy</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl tracking-tight text-white">Reviews</h1>
        <p className="mt-2 text-sm text-white/50">Share your experience with our food and services</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="space-y-5 rounded-[28px] border border-[#222A2A] bg-[#111515] p-6 shadow-2xl shadow-black/25">
            <h3 className="text-lg font-black text-white">Write a Review</h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Step 1 — Group */}
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-white/38">What are you reviewing?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleGroupChange('services')}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition ${
                      group === 'services'
                        ? 'border-[#df1526] bg-[#df1526] text-white'
                        : 'border-white/10 bg-white/4 text-white/58 hover:bg-white/[0.07]'
                    }`}
                  >
                    <Dumbbell size={18} />
                    <span className="text-xs font-bold">Services</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGroupChange('food')}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition ${
                      group === 'food'
                        ? 'border-[#df1526] bg-[#df1526] text-white'
                        : 'border-white/10 bg-white/4 text-white/58 hover:bg-white/[0.07]'
                    }`}
                  >
                    <Utensils size={18} />
                    <span className="text-xs font-bold">Food</span>
                  </button>
                </div>
              </div>

              {/* Step 2 — Sub-category */}
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-white/38">
                  {group === 'food' ? 'Food Category' : 'Service Type'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {subOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSubCategory(opt.value)}
                      className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-1 py-2.5 transition ${
                        subCategory === opt.value
                          ? 'border-[#df1526] bg-[#df1526]/15 text-white'
                          : 'border-white/8 bg-white/3 text-white/50 hover:bg-white/[0.07] hover:text-white/80'
                      }`}
                    >
                      <span className="text-base leading-none">{opt.emoji}</span>
                      <span className="text-[10px] font-bold leading-tight text-center">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
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

              {/* Comment */}
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-white/38">Comment</label>
                <textarea
                  className="min-h-27.5 w-full rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#df1526] focus:bg-white/6"
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

        {/* Past reviews */}
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
                  <div key={review._id} className="rounded-2xl border border-white/10 bg-white/4 p-4">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${CATEGORY_COLORS[review.category] || 'bg-sky-500/12 text-sky-300'}`}>
                          {categoryLabel(review)}
                        </span>
                        <div className="mt-2 flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={14} fill={review.rating >= star ? '#F5A623' : 'none'} className={review.rating >= star ? 'text-[#F5A623]' : 'text-white/18'} />
                          ))}
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                        review.status === 'approved' ? 'bg-emerald-500/12 text-emerald-300' :
                        review.status === 'pending'  ? 'bg-amber-500/12 text-amber-300'   : 'bg-red-500/12 text-red-300'
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
