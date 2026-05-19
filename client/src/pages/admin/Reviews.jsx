import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeOff, Star } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/axios';
import PageHeader from '../../components/shared/PageHeader';

export default function Reviews() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => api.get('/reviews').then(r => r.data),
  });

  const moderate = useMutation({
    mutationFn: ({ id, payload }) => api.put(`/reviews/${id}/moderate`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review updated.');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not update review'),
  });

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate and feature customer testimonials" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="card text-[#888]">Loading reviews...</div>
        ) : (data?.reviews || []).map(review => (
          <div key={review._id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-[#111]">{review.name}</span>
                  <span className="badge badge-info text-[10px] capitalize">{review.category}</span>
                  <span className="badge text-[10px] capitalize">{review.status}</span>
                </div>
                <div className="flex text-[#F5A623] mb-2">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < review.rating ? 'currentColor' : 'none'} />)}
                </div>
                <p className="text-sm text-[#666]">{review.comment}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button onClick={() => moderate.mutate({ id: review._id, payload: { status: 'approved', isFeatured: review.isFeatured } })} className="btn-ghost text-xs">Approve</button>
              <button onClick={() => moderate.mutate({ id: review._id, payload: { status: review.status, isFeatured: !review.isFeatured } })} className="btn-ghost text-xs">
                <Star size={13} /> {review.isFeatured ? 'Unfeature' : 'Feature'}
              </button>
              <button onClick={() => moderate.mutate({ id: review._id, payload: { status: 'hidden', isFeatured: false } })} className="btn-ghost text-xs text-red-600">
                <EyeOff size={13} /> Hide
              </button>
            </div>
          </div>
        ))}
        {!isLoading && (!data?.reviews || data.reviews.length === 0) && (
          <div className="card text-center py-12 text-[#888]">No reviews submitted yet.</div>
        )}
      </div>
    </div>
  );
}
