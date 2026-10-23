import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { Car, Compass, Loader, MessageSquare, Search, Star, Trash2 } from 'lucide-react';

const Reviews = () => {
  const { showNotification } = useNotification();
  const { confirm } = useConfirmation();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const loadReviews = async () => {
      setLoading(true);
      try {
        setReviews(await api('/reviews'));
      } catch (error) {
        showNotification(error.message || 'Failed to load reviews', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...reviews]
      .filter((review) => ratingFilter === 'all' || String(review.rating) === ratingFilter)
      .filter((review) => serviceFilter === 'all' || review.service_type === serviceFilter)
      .filter((review) => {
        if (!term) return true;
        return [review.customer_name, review.customer_email, review.service_name, review.comment]
          .some((value) => String(value || '').toLowerCase().includes(term));
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return Number(b.rating || 0) - Number(a.rating || 0);
        if (sortBy === 'lowest') return Number(a.rating || 0) - Number(b.rating || 0);
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [reviews, ratingFilter, serviceFilter, sortBy, search]);

  const handleDelete = async (reviewId) => {
    if (!(await confirm('Are you sure you want to delete this review?'))) return;
    setDeletingId(reviewId);
    try {
      await api(`/reviews/${reviewId}`, { method: 'DELETE' });
      setReviews((current) => current.filter((review) => review.review_id !== reviewId));
      showNotification('Review deleted successfully', 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to delete review', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6" style={{ fontFamily: "'Inter', 'Georgia', serif" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a1a]">Customer Reviews</h1>
          <p className="text-xs text-slate-400 mt-1">View and manage feedback from tour and rental customers.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#6b6255]">
          <Star className="h-4 w-4" style={{ fill: '#f59e0b', color: '#f59e0b' }} />
          {reviews.length} total reviews
        </div>
      </div>

      <div className="bg-white border border-[#e0dbd0] p-4 rounded-md shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <label className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stars</span>
              <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="bg-white border border-[#d6cfc2] hover:border-[#b0a68e] focus:border-[#1a1a1a] rounded-sm text-xs text-[#1a1a1a] px-2.5 py-1.5 outline-none cursor-pointer">
                <option value="all">All ratings</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service</span>
              <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className="bg-white border border-[#d6cfc2] hover:border-[#b0a68e] focus:border-[#1a1a1a] rounded-sm text-xs text-[#1a1a1a] px-2.5 py-1.5 outline-none cursor-pointer">
                <option value="all">All services</option>
                <option value="Tour Package">Tour Packages</option>
                <option value="Car Rental">Car Rentals</option>
              </select>
            </label>

            <label className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-white border border-[#d6cfc2] hover:border-[#b0a68e] focus:border-[#1a1a1a] rounded-sm text-xs text-[#1a1a1a] px-2.5 py-1.5 outline-none cursor-pointer">
                <option value="newest">Newest first</option>
                <option value="highest">Highest rating</option>
                <option value="lowest">Lowest rating</option>
              </select>
            </label>
          </div>

          <div className="relative w-full lg:w-64">
            <Search className="h-3.5 w-3.5 text-[#8a8275] absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer, service, review..." className="w-full bg-white border border-[#d6cfc2] focus:border-[#1a1a1a] rounded-sm pl-8 pr-3 py-1.5 text-xs text-[#1a1a1a] placeholder:text-[#8a8275] outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e0dbd0] rounded-md overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {loading ? (
          <div className="py-20 text-center"><Loader className="h-6 w-6 mx-auto animate-spin text-yellow-600" /></div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <MessageSquare className="h-9 w-9 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-[#1a1a1a]">No reviews found.</p>
            <p className="text-xs mt-1">Try changing the rating, service, or search filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#eae5db]">
            {filteredReviews.map((review) => {
              const isRental = review.service_type === 'Car Rental';
              return (
                <div key={review.review_id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-[#faf9f6]/70 transition-colors">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${isRental ? 'bg-amber-100 text-amber-900 border border-amber-300/60' : 'bg-yellow-100 text-yellow-900 border border-yellow-300/60'}`}>
                        {isRental ? <Car className="h-3 w-3" /> : <Compass className="h-3 w-3" />}
                        {review.service_type}
                      </span>
                      <span className="text-sm font-semibold text-[#1a1a1a]">{review.service_name || 'Service'}</span>
                    </div>
                    <p className="text-xs text-[#4a453b] leading-relaxed">{review.comment || 'No written comment provided.'}</p>
                    {review.image_url && <img src={review.image_url} alt="Customer review" className="h-24 w-24 rounded object-cover" />}
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">{review.customer_name || 'Anonymous Customer'}</span>
                      <span>•</span>
                      <span>{review.created_at ? new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2 bg-[#faf9f6] px-2.5 py-1.5 rounded-md border border-[#eae5db]">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className="h-3.5 w-3.5"
                            style={{
                              fill: star <= Number(review.rating) ? '#f59e0b' : '#e0dbd0',
                              color: star <= Number(review.rating) ? '#f59e0b' : '#d6cfc2'
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-[#1a1a1a]">{review.rating}/5</span>
                    </div>
                    <button onClick={() => handleDelete(review.review_id)} disabled={deletingId === review.review_id} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50" title="Delete review">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
