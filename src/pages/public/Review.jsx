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
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-black font-sans pb-24 pt-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Bookings
        </button>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-b border-yellow-200 px-8 sm:px-10 py-10">
            <h1 className="text-3xl font-black text-black mb-2">Share Your Experience</h1>
            <p className="text-[15px] text-gray-600 font-medium leading-relaxed">
              Help us improve by sharing your honest feedback about your trip to <span className="font-bold text-black">{booking?.packageName}</span>
            </p>
          </div>

          {/* Trip Summary Card */}
          <div className="px-8 sm:px-10 py-6 bg-slate-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">Your Trip</p>
                <p className="text-sm font-bold text-black">{booking?.packageName}</p>
                <p className="text-xs text-gray-500">
                  {new Date(booking?.tourDate).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase">Duration</p>
                <p className="text-sm font-bold text-black">{booking?.guestsCount} {booking?.guestsCount > 1 ? 'guests' : 'guest'}</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 sm:p-10">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                <div className="h-20 w-20 bg-yellow-50 border border-yellow-100 rounded-full flex items-center justify-center mb-2 shadow-sm">
                  <Star className="h-10 w-10 text-yellow-400 fill-yellow-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-black mb-2">Review Submitted!</h3>
                  <p className="text-[15px] font-medium text-gray-500">Thank you for sharing your feedback.</p>
                </div>
              </div>
            ) : submitting ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="h-12 w-12 animate-spin rounded-full border-3 border-yellow-300 border-t-yellow-500"></div>
                <h3 className="text-[15px] font-bold text-gray-700">Submitting your review...</h3>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-10">
                
                {/* Rating Section */}
                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                  <div>
                    <label className="text-base font-bold text-black mb-1 block">How would you rate this trip?</label>
                    <p className="text-xs text-gray-500 mb-4">Your rating helps us maintain quality and improve our services</p>
                    <div className="flex items-center gap-4 justify-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="focus:outline-none transition-all hover:scale-125 active:scale-90"
                        >
                          <Star 
                            className={`h-14 w-14 ${
                              (hoverRating || rating) >= star 
                                ? 'fill-yellow-400 text-yellow-400 drop-shadow-md' 
                                : 'fill-gray-100 text-gray-200'
                            } transition-all`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  {rating > 0 && (
                    <p className="text-base font-bold text-gray-700 h-6">
                      {rating === 1 && "😞 Not satisfied"}
                      {rating === 2 && "😕 Below expectations"}
                      {rating === 3 && "😐 Meets expectations"}
                      {rating === 4 && "😊 Very satisfied"}
                      {rating === 5 && "😍 Absolutely excellent!"}
                    </p>
                  )}
                </div>

                {/* Comment Section */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700">
                    Tell us what you think <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <p className="text-xs text-gray-500">
                    Share what you loved, what could be improved, and any highlights from your journey. Your detailed feedback is invaluable!
                  </p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={6}
                    placeholder="Example: The tour guide was amazing and very knowledgeable. The accommodations were comfortable. One thing to improve would be the pacing of the itinerary..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-[15px] text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400/70 focus:border-yellow-400 focus:bg-white transition-all resize-none placeholder:text-gray-300 placeholder:font-normal"
                  />
                  <p className="text-xs text-gray-400 text-right">{comment.length}/500 characters</p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="flex-1 py-3.5 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-[15px] transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 px-6 bg-black hover:bg-slate-900 text-white font-bold rounded-2xl text-[15px] active:scale-95 transition-all shadow-sm"
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
