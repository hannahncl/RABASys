import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import GCashModal from '../../components/payment/GCashModal';
import { bookingService } from '../../services/bookingService';
import { Compass, Sparkles, MapPin, Hotel, Calendar, Users, Calculator, ShieldCheck } from 'lucide-react';

const DESTINATION_PRICES = {
  'Palawan (El Nido/Coron)': { base: 4500, activities: [
    { id: 'act_1', name: 'Island Hopping Tour A & C', price: 2500 },
    { id: 'act_2', name: 'Scuba Diving Session', price: 3000 },
    { id: 'act_3', name: 'Canopy Walk & Cliff Climb', price: 1200 }
  ]},
  'Boracay Island': { base: 3500, activities: [
    { id: 'act_4', name: 'Sunset Paraw Sailing', price: 1500 },
    { id: 'act_5', name: 'Helmet Diving Experience', price: 2000 },
    { id: 'act_6', name: 'Parasailing Adventure', price: 2500 }
  ]},
  'Siargao Island': { base: 4000, activities: [
    { id: 'act_7', name: 'Cloud 9 Surfing Lesson', price: 1200 },
    { id: 'act_8', name: 'Sugba Lagoon & Rock Pool Tour', price: 1800 },
    { id: 'act_9', name: 'Three Islands Island Hopping', price: 1500 }
  ]},
  'Batanes Province': { base: 7500, activities: [
    { id: 'act_10', name: 'Sabtang Island Faluwa Crossing', price: 2000 },
    { id: 'act_11', name: 'Ivatan Heritage Tour & Vakul Rental', price: 1500 },
    { id: 'act_12', name: 'Marlboro Hills Sunset Picnic', price: 1200 }
  ]},
  'Cebu & Bohol': { base: 5000, activities: [
    { id: 'act_13', name: 'Oslob Whale Shark Swimming', price: 2500 },
    { id: 'act_14', name: 'Kawasan Falls Canyoning', price: 2000 },
    { id: 'act_15', name: 'Chocolate Hills & Tarsier Sanctuary', price: 1800 }
  ]}
};

const HOTEL_TIERS = [
  { id: 'hostel', name: 'Backpacker Hostel / Guesthouse', pricePerNight: 1200 },
  { id: 'standard', name: 'Standard Comfort Hotel', pricePerNight: 3000 },
  { id: 'luxury', name: 'Premium 5-Star Beachfront Resort', pricePerNight: 8500 }
];

const CustomPlanner = () => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  // Form selections
  const [destination, setDestination] = useState(Object.keys(DESTINATION_PRICES)[0]);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [hotelTier, setHotelTier] = useState(HOTEL_TIERS[0]);
  const [durationNights, setDurationNights] = useState(3);
  const [guests, setGuests] = useState(2);

  // Customer credentials for booking
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [tourDate, setTourDate] = useState('');

  // Payment states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset selected activities when destination changes
  useEffect(() => {
    setSelectedActivities([]);
  }, [destination]);

  const currentDestinationData = DESTINATION_PRICES[destination];
  
  // Real-time price calculation logic
  const baseCostPerPerson = currentDestinationData.base;
  const activitiesCostPerPerson = selectedActivities.reduce((sum, actId) => {
    const act = currentDestinationData.activities.find(a => a.id === actId);
    return sum + (act ? act.price : 0);
  }, 0);

  const accommodationCostTotal = hotelTier.pricePerNight * durationNights;

  // Real-time updates formula
  const subtotalPerPerson = baseCostPerPerson + activitiesCostPerPerson;
  const totalCost = (subtotalPerPerson * guests) + accommodationCostTotal;

  const handleActivityToggle = (actId) => {
    setSelectedActivities((prev) => 
      prev.includes(actId) ? prev.filter(id => id !== actId) : [...prev, actId]
    );
  };

  const handleOpenPayment = (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerEmail || !tourDate) {
      showNotification('Please fill in all contact & date fields.', 'warning');
      return;
    }
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (referenceNumber, gcashNumber) => {
    setPaymentModalOpen(false);
    setSubmitting(true);
    try {
      const selectedActNames = selectedActivities.map(actId => 
        currentDestinationData.activities.find(a => a.id === actId)?.name
      ).filter(Boolean);

      const customBooking = {
        packageId: 'custom-package',
        packageName: `Customized Tour: ${destination} (${durationNights} Nights)`,
        customerName,
        customerEmail,
        customerPhone,
        tourDate,
        guestsCount: Number(guests),
        totalPrice: totalCost,
        paymentMethod: 'GCash',
        paymentRef: referenceNumber,
        gcashNumber,
        customizedDetails: {
          destination,
          hotel: hotelTier.name,
          duration: `${durationNights} Nights`,
          activities: selectedActNames
        }
      };

      await bookingService.create(customBooking);
      showNotification('Custom trip successfully booked! Confirmation email dispatched.', 'success');
      navigate('/');
    } catch (e) {
      showNotification('Error registering custom trip booking.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          Interactive Trip Planner
        </div>
        <h1 className="text-4xl font-extrabold font-display text-slate-100">Customize Your Dream Trip</h1>
        <p className="text-slate-400 text-sm mt-1">Design a personalized vacation. Choose your destination, hotels, and activities with real-time price updates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Form Controls - Left 2 Columns */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-6 md:p-8 rounded-2xl border-slate-800 space-y-6">
            
            {/* Step 1: Destination */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-200 font-display flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-400" />
                1. Select Destination
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(DESTINATION_PRICES).map((dest) => (
                  <div
                    key={dest}
                    onClick={() => setDestination(dest)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      destination === dest
                        ? 'border-cyan-400 bg-cyan-500/5 text-slate-100 shadow-[0_0_15px_rgba(245,208,97,0.1)]'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-bold text-sm block">{dest}</span>
                    <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Base Cost: PHP {DESTINATION_PRICES[dest].base.toLocaleString()} / guest</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Hotel accommodations */}
            <div className="space-y-3 pt-4 border-t border-slate-900">
              <h3 className="text-base font-bold text-slate-200 font-display flex items-center gap-2">
                <Hotel className="h-5 w-5 text-cyan-400" />
                2. Select Accommodation Tier
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {HOTEL_TIERS.map((tier) => (
                  <div
                    key={tier.id}
                    onClick={() => setHotelTier(tier)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                      hotelTier.id === tier.id
                        ? 'border-cyan-400 bg-cyan-500/5 text-slate-100 shadow-[0_0_15px_rgba(245,208,97,0.1)]'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-sm block">{tier.name}</span>
                      <span className="text-[10px] text-slate-500">Premium lodging partner selection</span>
                    </div>
                    <span className="font-bold text-sm text-cyan-400 font-display">
                      PHP {tier.pricePerNight.toLocaleString()} / night
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Local activities */}
            <div className="space-y-3 pt-4 border-t border-slate-900">
              <h3 className="text-base font-bold text-slate-200 font-display flex items-center gap-2">
                <Compass className="h-5 w-5 text-cyan-400" />
                3. Choose Custom Activities
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {currentDestinationData.activities.map((act) => (
                  <div
                    key={act.id}
                    onClick={() => handleActivityToggle(act.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                      selectedActivities.includes(act.id)
                        ? 'border-cyan-400 bg-cyan-500/5 text-slate-100 shadow-[0_0_15px_rgba(245,208,97,0.1)]'
                        : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold">{act.name}</span>
                    <span className="text-xs font-bold text-cyan-400 font-display">+ PHP {act.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 4: Duration and headcount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-900">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-cyan-500" /> Number of Nights
                </label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={durationNights}
                  onChange={(e) => setDurationNights(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Users className="h-4 w-4 text-cyan-500" /> Number of Guests
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={guests}
                  onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-3 px-4 text-slate-100 text-sm focus:outline-none"
                />
              </div>
            </div>

            {/* Contact Details required for submitting custom booking */}
            <div className="space-y-4 pt-6 border-t border-slate-900">
              <h4 className="text-sm font-bold text-slate-200 font-display">Tourist Contact Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-2.5 px-4 text-slate-100 text-xs focus:outline-none"
                />
                <input
                  type="email"
                  required
                  placeholder="Email Address"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-2.5 px-4 text-slate-100 text-xs focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Contact Mobile Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-2.5 px-4 text-slate-100 text-xs focus:outline-none"
                />
                <input
                  type="date"
                  required
                  value={tourDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTourDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-2.5 px-4 text-slate-100 text-xs focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Real-time Tally Calculator Card - Right 1 Column */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <div className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6 shadow-2xl">
            <h3 className="font-bold text-slate-200 font-display flex items-center gap-2 border-b border-slate-900 pb-3">
              <Calculator className="h-5 w-5 text-cyan-400" />
              Real-Time Estimate
            </h3>

            {/* Calculations items */}
            <div className="space-y-3.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Destination Base:</span>
                <span className="font-semibold text-slate-200">PHP {baseCostPerPerson.toLocaleString()} x{guests}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Selected Activities:</span>
                <span className="font-semibold text-slate-200">PHP {activitiesCostPerPerson.toLocaleString()} x{guests}</span>
              </div>

              <div className="flex justify-between">
                <span>Accommodation ({durationNights} nights):</span>
                <span className="font-semibold text-slate-200">PHP {accommodationCostTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between border-t border-slate-900 pt-3 text-base">
                <span className="font-bold text-slate-200 font-display">Estimated Total</span>
                <span className="font-extrabold text-cyan-400 font-display">PHP {totalCost.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleOpenPayment}
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold font-display rounded-xl text-center shadow-lg active:scale-[0.98] transition-all cursor-pointer block disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Book Custom Trip'}
            </button>

            <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-xl flex gap-2.5 text-[10px] text-slate-400">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
              <p>Customize itinerary options. Changes register instantly in our pricing engine for transparency.</p>
            </div>
          </div>
        </div>

      </div>

      {/* GCash Simulator Overlay */}
      <GCashModal
        isOpen={paymentModalOpen}
        amount={totalCost}
        onClose={() => setPaymentModalOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default CustomPlanner;
