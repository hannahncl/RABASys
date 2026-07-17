import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { bookingService } from '../../services/bookingService';
import { api } from '../../services/api';
import { Star, ArrowLeft, Send } from 'lucide-react';

const Review = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const showNotification = useNotification();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const data = await bookingService.getAll();
        const found = data.find(b => b.id === id);
        if (found) {
          setBooking(found);
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
      showNotification('Thank you for your review!', 'success');
      navigate('/profile');
    } catch (err) {
      showNotification('Failed to submit review. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-slate-500 hover:text-yellow-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Bookings
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-yellow-50 px-6 py-8 text-center border-b border-yellow-100">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Review Your Trip</h1>
            <p className="text-sm text-slate-600">
              How was your experience with <span className="font-semibold text-yellow-700">{booking.packageName}</span>?
            </p>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Rating */}
              <div className="flex flex-col items-center justify-center space-y-3">
                <label className="text-sm font-medium text-slate-700">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`h-10 w-10 ${
                          (hoverRating || rating) >= star 
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'fill-slate-100 text-slate-200'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 h-4">
                  {rating === 1 && "Terrible"}
                  {rating === 2 && "Poor"}
                  {rating === 3 && "Average"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent!"}
                </p>
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Share your experience <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  placeholder="What did you like or dislike? How was the tour guide?"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-yellow-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-yellow-500 transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-yellow-500/20"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Submit Review
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Review;
