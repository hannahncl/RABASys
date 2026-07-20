import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { bookingService } from '../../services/bookingService';
import { api } from '../../services/api';
import { Star, ArrowLeft } from 'lucide-react';

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
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (err) {
      showNotification('Failed to submit review. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-white text-black font-sans pb-24 pt-12">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        {!submitting && !isSuccess && (
          <button 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Bookings
          </button>
        )}

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden p-8 sm:p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-extrabold text-black mb-3">Review Your Trip</h1>
            <p className="text-[15px] text-gray-500 font-medium leading-relaxed">
              How was your experience with <span className="font-bold text-black">{booking.packageName}</span>?
            </p>
          </div>

          {/* Form Content */}
          <div className="w-full">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="h-20 w-20 bg-yellow-50 border border-yellow-100 rounded-full flex items-center justify-center mb-2 shadow-sm">
                  <Star className="h-10 w-10 text-yellow-400 fill-yellow-400" />
                </div>
                <h3 className="text-xl font-extrabold text-black">Review Submitted!</h3>
                <p className="text-[15px] font-medium text-gray-500">Redirecting to your profile...</p>
              </div>
            ) : submitting ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-5">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent"></div>
                <h3 className="text-[15px] font-bold text-gray-700">Submitting your review...</h3>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Rating */}
                <div className="flex flex-col items-center justify-center space-y-5">
                  <label className="text-[15px] font-bold text-black">Overall Rating</label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star 
                          className={`h-12 w-12 ${
                            (hoverRating || rating) >= star 
                              ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' 
                              : 'fill-gray-100 text-gray-200'
                          } transition-all`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm font-bold text-gray-400 h-5">
                    {rating === 1 && "Terrible"}
                    {rating === 2 && "Poor"}
                    {rating === 3 && "Average"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent!"}
                  </p>
                </div>

                {/* Comment */}
                <div className="space-y-3 pt-2">
                  <label className="block text-sm font-semibold text-gray-600">
                    Share your experience <span className="text-gray-400 font-medium">(Optional)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="What did you like or dislike?"
                    className="w-full bg-[#F8F9FA] border border-gray-200 rounded-xl py-4 px-5 text-[15px] text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all resize-none placeholder:text-gray-400 placeholder:font-normal"
                  />
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-8 bg-black hover:bg-slate-900 text-white font-bold rounded-2xl text-[15px] active:scale-[0.98] transition-all shadow-sm"
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
