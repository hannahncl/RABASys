import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../hooks/useAuth';
import { serviceService } from '../services/serviceService';
import { bookingService } from '../services/bookingService';
import { Loader, ArrowLeft, Calendar, ShieldCheck } from 'lucide-react';

const CarBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [gcashRef, setGcashRef] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    if (!user) {
      showNotification('Please log in to book a car', 'error');
      navigate('/login');
      return;
    }

    const fetchCar = async () => {
      try {
        const data = await serviceService.getById(id);
        if (!data || data.category !== 'car') throw new Error('Not found');
        setCar(data);
      } catch (error) {
        showNotification('Car not found', 'error');
        navigate('/car-rentals');
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [id, user, navigate, showNotification]);

  const handleBookCar = async (e) => {
    e.preventDefault();
    if (!pickupDate || !returnDate || !pickupLocation) {
      showNotification('Please fill in all booking details', 'error');
      return;
    }

    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    if (end <= start) {
      showNotification('Return date must be after pickup date', 'error');
      return;
    }

    if (paymentMethod === 'gcash') {
      if (!gcashRef.trim()) {
        showNotification('Please enter your GCash reference number.', 'warning');
        return;
      }
    } else if (!cardNumber || !expiryDate || !cvv) {
      showNotification('Please fill in the card details.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const referenceNumber = paymentMethod === 'gcash'
        ? gcashRef.trim()
        : `CARD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      await bookingService.createRental({
        vehicleId: id,
        pickupDate,
        returnDate,
        pickupLocation,
        paymentMethod: paymentMethod === 'gcash' ? 'GCash' : 'Credit Card',
        paymentRef: referenceNumber,
      });
      showNotification('Car booking submitted successfully and is pending admin approval.', 'success');
      navigate('/history');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to book car', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDaysAndPrice = () => {
    if (!pickupDate || !returnDate || !car) return { days: 0, total: 0 };
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    if (end <= start) return { days: 0, total: 0 };
    const diffTime = Math.abs(end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { days, total: days * car.price };
  };

  const { days, total } = calculateDaysAndPrice();

  if (loading) {
    return (
      <div className="bg-white min-h-screen flex justify-center items-center">
        <Loader className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (!car) return null;

  return (
    <div className="bg-white min-h-screen pt-12 pb-24 font-sans text-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <Link to="/car-rentals" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Car Rentals
          </Link>

          <div className="border-b border-slate-100 pb-8">
            <h1 className="text-2xl text-slate-400 tracking-widest uppercase mb-1">Book Your Car</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">

          {/* Left Column - Car Details Card */}
          <div>
            <h2 className="text-[17px] font-extrabold text-black mb-6">Car Details</h2>
            <div className="border border-slate-150 rounded-xl p-8 flex flex-col items-center shadow-[0_1px_3px_rgba(0,0,0,0.03)] bg-white">
              <div className="h-[280px] w-full flex items-center justify-center mb-10 overflow-hidden bg-slate-50 rounded-lg">
                <img
                  src={car.image || 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600'}
                  alt={car.vehicleName}
                  className="max-h-full max-w-full object-cover"
                />
              </div>

              <div className="w-full max-w-xs space-y-4 text-[13px] font-medium">
                <div className="grid grid-cols-2">
                  <span className="text-black font-extrabold">Vehicle Name:</span>
                  <span className="text-black">{car.vehicleName}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-black font-extrabold">Vehicle Type:</span>
                  <span className="text-black">{car.vehicleType}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-black font-extrabold">Plate Number:</span>
                  <span className="text-black">{car.plateNumber}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-black font-extrabold">Seating Capacity:</span>
                  <span className="text-black">{car.capacity}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-black font-extrabold">Daily Rate:</span>
                  <span className="text-black">₱{Number(car.price).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Forms */}
          <div className="pt-2">
            <h2 className="text-[17px] font-extrabold text-black mb-6">Rental Information</h2>
            <form onSubmit={handleBookCar} className="space-y-10">

              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Pickup Date</label>
                    <input
                      type="date"
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none focus:border-yellow-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Return Date</label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      required
                      min={pickupDate || new Date().toISOString().split('T')[0]}
                      className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none focus:border-yellow-500 transition-all"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Pickup Location</label>
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="Where do you want to pick up the car?"
                    required
                    className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none focus:border-yellow-500 transition-all"
                  />
                </div>
              </div>

              {/* Price Summary */}
              {days > 0 && (
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-gray-600 mb-4">Summary</h3>
                  <div className="flex justify-between text-sm font-medium mb-2 text-gray-600">
                    <span>₱{Number(car.price).toLocaleString()} × {days} day{days !== 1 && 's'}</span>
                    <span>₱{total.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between text-base font-extrabold text-black">
                    <span>Total Estimated Amount</span>
                    <span>₱{total.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <div className="bg-[#F8F9FA] rounded-xl p-6 space-y-5">
                <h3 className="text-sm font-semibold text-gray-600">Payment</h3>
                <label className="flex items-center gap-4 cursor-pointer py-2">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${paymentMethod === 'gcash' ? 'border-yellow-400' : 'border-slate-300'}`}>
                    {paymentMethod === 'gcash' && <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>}
                  </div>
                  <span className="text-sm font-semibold text-black">GCash</span>
                  <input type="radio" className="hidden" checked={paymentMethod === 'gcash'} onChange={() => setPaymentMethod('gcash')} />
                </label>

                {paymentMethod === 'gcash' && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Please send your payment via GCash and enter the reference number below. Our admin will verify your payment.
                    </p>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">GCash Reference Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 1234 5678 9012"
                        value={gcashRef}
                        onChange={(e) => setGcashRef(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="h-px bg-slate-100 my-4 w-full"></div>

                <label className="flex items-center justify-between cursor-pointer py-2">
                  <div className="flex items-center gap-4">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${paymentMethod === 'card' ? 'border-yellow-400' : 'border-slate-300'}`}>
                      {paymentMethod === 'card' && <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>}
                    </div>
                    <span className="text-sm font-semibold text-black">Credit/ Debit Card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-[#1A1F71] font-bold italic text-sm">VISA</div>
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-[#EB001B] relative left-1 z-10"></div>
                      <div className="w-3 h-3 rounded-full bg-[#F79E1B] relative right-1"></div>
                    </div>
                  </div>
                  <input type="radio" className="hidden" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                </label>

                {paymentMethod === 'card' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">Card number</label>
                      <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-[260px] bg-white border border-gray-200 rounded-lg py-3 px-4 text-gray-900 text-[15px] focus:outline-none transition-all" />
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Expiration date</label>
                        <input type="text" placeholder="MM/YYYY" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-[180px] bg-white border border-gray-200 rounded-lg py-3 px-4 text-gray-900 text-[15px] focus:outline-none transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Security Code</label>
                        <input type="text" value={cvv} onChange={(e) => setCvv(e.target.value)} className="w-[180px] bg-white border border-gray-200 rounded-lg py-3 px-4 text-gray-900 text-[15px] focus:outline-none transition-all" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-250 font-bold text-[13px] px-16 py-3.5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CarBooking;

