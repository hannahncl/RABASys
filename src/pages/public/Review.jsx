import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
<<<<<<< HEAD
import { bookingService } from '../services/bookingService';
=======
import { bookingService } from '../../services/bookingService';
import { api } from '../../services/api';
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> ad862ad748519c2d2ee7f9516014e8fcffc906e6
import { Star, ArrowLeft, Send } from 'lucide-react';
=======
import { Star, ArrowLeft } from 'lucide-react';
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a
=======
import { Star, ArrowLeft } from 'lucide-react';
>>>>>>> 44ad24f098897339e6f1ec785ced06dfa05fa61a

const Review = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const data = await bookingService.getAll();
        const found = data.find(b => b.id === id);
        if (found) {
          if (found.hasReviewed) {
            showNotification('You have already reviewed this booking.', 'info');
            navigate('/profile');
          } else {
            setBooking(found);
          }
        } else {
          showNotification('Booking not found.', 'error');
          navigate('/profile');
        }
      } catch (err) {
        showNotification('Failed to load booking details.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id, navigate, showNotification]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      showNotification('Please select a rating.', 'warning');
      return;
    }
    
    setSubmitting(true);
    try {
      await api('/reviews', {
        method: 'POST',
        body: JSON.stringify({ booking_id: Number(booking.id), rating, comment }),
      });
      setIsSuccess(true);
      showNotification('Thank you for your review!', 'success');
    } catch (err) {
      showNotification('Failed to submit review. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c4b99a] border-t-transparent"></div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-white pb-24 pt-10 font-sans text-[#1a1a1a]">
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <button 
          onClick={() => navigate('/profile')}
          className="mb-6 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6b6255] transition-colors hover:text-[#2d2a24]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to My Bookings
        </button>

        <div className="overflow-hidden rounded-md border border-[#e0dbd0] bg-white shadow-[0_2px_14px_rgba(0,0,0,0.04)]">
          <div className="border-b border-[#eae5db] px-5 py-5 sm:px-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b0a68e]">Review</p>
            <h1 className="text-xl font-bold tracking-[0.02em] text-[#1a1a1a]">Share Your Experience</h1>
            <p className="mt-2 text-xs font-medium leading-relaxed text-[#6b6255]">
              Feedback for <span className="font-semibold text-[#2d2a24]">{booking?.packageName}</span>
            </p>
          </div>

          <div className="border-b border-[#eae5db] bg-[#fcfbf9] px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6255]">Your Trip</p>
                <p className="text-sm font-semibold text-[#1a1a1a]">{booking?.packageName}</p>
                <p className="text-[11px] text-[#6b6255]">
                  {new Date(booking?.tourDate).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>
              <div className="space-y-1 text-left sm:text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b6255]">Guests</p>
                <p className="text-sm font-semibold text-[#1a1a1a]">{booking?.guestsCount} {booking?.guestsCount > 1 ? 'guests' : 'guest'}</p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#e0dbd0] bg-[#fcfbf9]">
                  <Star className="h-7 w-7 fill-[#c4b99a] text-[#c4b99a]" />
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-bold text-[#1a1a1a]">Review Submitted</h3>
                  <p className="text-xs font-medium text-[#6b6255]">Thank you for sharing your feedback.</p>
                </div>
              </div>
            ) : submitting ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-10 text-center">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#d6cfc2] border-t-[#b0a68e]"></div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6b6255]">Submitting review...</h3>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.12em] text-[#4a453b]">Trip Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="transition-transform hover:scale-110 focus:outline-none active:scale-95"
                          title={`${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star 
                            className={`h-8 w-8 ${
                              (hoverRating || rating) >= star 
                                ? 'fill-[#c4b99a] text-[#c4b99a]' 
                                : 'fill-[#f5f2ee] text-[#d6cfc2]'
                            } transition-all`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  {rating > 0 && (
                    <p className="h-4 text-xs font-semibold text-[#4a453b]">
                      {rating === 1 && "Not satisfied"}
                      {rating === 2 && "Below expectations"}
                      {rating === 3 && "Meets expectations"}
                      {rating === 4 && "Very satisfied"}
                      {rating === 5 && "Excellent"}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#4a453b]">
                    Comment <span className="font-medium normal-case tracking-normal text-[#8f8576]">(Optional)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="w-full resize-none rounded border border-[#d6cfc2] bg-white px-3 py-2.5 text-sm font-medium text-[#1a1a1a] outline-none transition-all placeholder:text-[#b0a68e] focus:border-[#b0a68e] focus:ring-2 focus:ring-[#b0a68e]/15"
                    placeholder="Share a short note..."
                  />
                  <p className="text-right text-[11px] text-[#8f8576]">{comment.length}/500</p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="flex-1 rounded border border-[#e0dbd0] bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#4a453b] transition-colors hover:bg-[#fcfbf9]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded border border-[#2d2a24] bg-[#2d2a24] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#f7f4ef] transition-colors hover:bg-transparent hover:text-[#2d2a24]"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Review;
