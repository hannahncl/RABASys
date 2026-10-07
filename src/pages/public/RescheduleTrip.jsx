import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { bookingService } from '../../services/bookingService';
import { 
  Calendar, ArrowLeft, RefreshCw, CheckCircle2, 
  AlertCircle, Clock, MapPin, User, ShieldAlert, Sparkles
} from 'lucide-react';

const RescheduleTrip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      try {
        const all = await bookingService.getAll();
        const found = all.find((b) => String(b.id) === String(id));
        if (found) {
          if (found.status === 'Completed') {
            showNotification('Completed bookings cannot be rescheduled.', 'info');
            navigate('/profile');
            return;
          }
          setBooking(found);
          setNewDate(found.tourDate || '');
        } else {
          showNotification('Booking record not found.', 'error');
          navigate('/profile');
        }
      } catch (err) {
        showNotification('Failed to load booking details.', 'error');
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [id, navigate, showNotification]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!booking || !newDate) return;

    if (newDate === booking.tourDate) {
      setErrorMsg('Please select a different date from your current schedule.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await bookingService.reschedule(booking.id, newDate, booking.type);
      setIsSuccess(true);
      showNotification('Trip schedule updated successfully!', 'success');
    } catch (err) {
      setErrorMsg(err.message || 'The selected date is unavailable. Please choose another date.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-24 pt-10 font-sans text-[#1a1a1a]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate('/profile')}
          className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6b6255] transition-colors hover:text-[#1a1a1a] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Account
        </button>

        {isSuccess ? (
          /* Success Card */
          <div className="rounded-xl border border-[#e0dbd0] bg-white p-8 text-center shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-50 border border-yellow-200">
              <CheckCircle2 className="h-7 w-7 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-[#1a1a1a]">Trip Rescheduled!</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#6b6255]">
              Your booking for <span className="font-semibold text-[#1a1a1a]">{booking.packageName}</span> has been updated to{' '}
              <strong className="text-yellow-700">
                {new Date(newDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </strong>.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/profile"
                className="rounded-md bg-[#1a1a1a] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#333333] transition-colors"
              >
                Return to My Bookings
              </Link>
            </div>
          </div>
        ) : (
          /* Reschedule Form Container */
          <div className="space-y-6">
            
            {/* Header Title Bar */}
            <div className="rounded-xl border border-[#e0dbd0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-yellow-700">
                <RefreshCw className="h-3.5 w-3.5" />
                Reschedule Booking
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1a1a1a]">
                Select a New Schedule Date
              </h1>
              <p className="mt-1.5 text-xs text-[#6b6255] leading-relaxed">
                Cancellation is not available for confirmed bookings. You can choose a new available travel date below.
              </p>
            </div>

            {/* Current Booking Overview */}
            <div className="rounded-xl border border-[#e0dbd0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6b6255]">
                Current Booking Details
              </h3>

              <div className="rounded-lg border border-[#eae5db] bg-[#faf9f6] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-mono text-[10px] font-bold text-yellow-700 uppercase">
                    {booking.id}
                  </span>
                  <h4 className="mt-0.5 text-base font-semibold text-[#1a1a1a]">
                    {booking.packageName}
                  </h4>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-[#6b6255]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#8a8275]" />
                      Current Date:{' '}
                      <strong className="text-[#1a1a1a]">
                        {booking.tourDate
                          ? new Date(booking.tourDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Not set'}
                      </strong>
                    </span>
                    {booking.guestsCount && (
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-[#8a8275]" />
                        {booking.guestsCount} {booking.guestsCount > 1 ? 'guests' : 'guest'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-[#eae5db] sm:pl-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Paid</span>
                  <span className="text-base font-bold text-[#1a1a1a]">
                    PHP {Number(booking.totalPrice || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Reschedule Date Selection Form */}
            <form onSubmit={handleSubmit} className="rounded-xl border border-[#e0dbd0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6b6255]">
                New {booking.type === 'Car Rental' ? 'Pickup' : 'Travel'} Date
              </h3>

              <div>
                <label 
                  htmlFor="reschedule-date" 
                  className="block text-xs font-medium text-[#1a1a1a] mb-1.5"
                >
                  Choose an available date
                </label>
                <input
                  id="reschedule-date"
                  type="date"
                  min={todayStr}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full rounded-md border border-[#d6cfc2] bg-white px-3.5 py-2.5 text-sm text-[#1a1a1a] outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all cursor-pointer"
                  required
                />
                <p className="mt-1.5 text-[11px] text-[#8a8275]">
                  Select any date on or after today. The request is submitted immediately to our system.
                </p>
              </div>

              {/* Policy note */}
              <div className="flex items-start gap-2.5 rounded-lg border border-yellow-200 bg-yellow-50/60 p-3.5 text-xs text-yellow-900">
                <ShieldAlert className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Reschedule Policy</span>
                  <span className="text-[11px] text-yellow-800 leading-relaxed">
                    Rescheduled dates are subject to slot availability and guide or vehicle dispatch verification. You will receive an updated confirmation once verified.
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  disabled={submitting}
                  className="w-full sm:w-auto rounded-md border border-[#d6cfc2] bg-white px-5 py-2.5 text-xs font-semibold text-[#4a453b] hover:bg-[#faf9f6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newDate}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md bg-[#1a1a1a] hover:bg-[#333333] px-6 py-2.5 text-xs font-semibold text-white disabled:opacity-40 transition-colors cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Updating Schedule...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Confirm Reschedule
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        )}

      </div>
    </div>
  );
};

export default RescheduleTrip;
