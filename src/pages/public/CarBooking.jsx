import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';

const CarBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // Mock car details based on the ID for presentation
  const car = {
    id,
    name: 'Audi e-tron GT',
    type: 'Electrified',
    plate: 'ARI 3435',
    capacity: 4,
    color: 'White',
    rate: 'PHP 2,500.00',
    image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=600'
  };

  const handleBookCar = (e) => {
    e.preventDefault();
    showNotification('Car booking submitted successfully!', 'success');
    navigate('/car-rentals');
  };

  return (
    <div className="bg-white min-h-screen pt-12 pb-24 font-sans text-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-black mb-2">Experience the road like never before! Book a car with Rabas!</h1>
          <p className="text-sm font-medium text-black">Your Journey, Your Car, Your Way.</p>
        </div>

        <h2 className="text-[17px] font-extrabold text-black mb-6">Car Details</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Left Column - Car Details Card */}
          <div>
            <div className="border border-slate-300 rounded-xl p-8 flex flex-col items-center">
              <div className="h-[280px] w-full flex items-center justify-center mb-10">
                <img 
                  src={car.image} 
                  alt={car.name} 
                  className="max-h-full max-w-full object-contain mix-blend-multiply" 
                />
              </div>
              
              <div className="w-full max-w-xs space-y-4 text-[13px] font-medium">
                <div className="grid grid-cols-2">
                  <span className="text-black font-extrabold">Vehicle Name:</span>
                  <span className="text-black">{car.name}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-black font-extrabold">Vehicle Type:</span>
                  <span className="text-black">{car.type}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-black font-extrabold">Plate Number:</span>
                  <span className="text-black">{car.plate}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-black font-extrabold">Seating Capacity:</span>
                  <span className="text-black">{car.capacity}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-black font-extrabold">Vehicle Color:</span>
                  <span className="text-black">{car.color}</span>
                </div>
                <div className="grid grid-cols-2">
                  <span className="text-black font-extrabold">Daily Rate:</span>
                  <span className="text-black">{car.rate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Forms */}
          <div className="pt-2">
            <form onSubmit={handleBookCar} className="space-y-10">
              
              {/* Driver's Information */}
              <div>
                <h3 className="text-[17px] font-extrabold text-black mb-5">Driver's Information</h3>
                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-[11px] font-extrabold text-black mb-2">Driver's First Name</label>
                    <input type="text" required className="w-full border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:border-yellow-400 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-black mb-2">Driver's Last Name</label>
                    <input type="text" required className="w-full border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:border-yellow-400 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-[11px] font-extrabold text-black mb-2">Driver's Age</label>
                    <input type="text" required className="w-full border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:border-yellow-400 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-black mb-2">Contact Number</label>
                    <input type="text" required className="w-full border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:border-yellow-400 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-black mb-2">Email Address</label>
                  <input type="email" required className="w-full border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:border-yellow-400 text-sm" />
                </div>
              </div>

              {/* Driver's License */}
              <div>
                <h3 className="text-[17px] font-extrabold text-black mb-5">Driver's License</h3>
                <div className="mb-5">
                  <label className="block text-[11px] font-extrabold text-black mb-2">License Number</label>
                  <input type="text" required className="w-full border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:border-yellow-400 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-extrabold text-black mb-2">Issuing Country</label>
                    <input type="text" required className="w-full border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:border-yellow-400 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-black mb-2">Expiration Date</label>
                    <input type="text" required placeholder="MM/YYYY" className="w-full border border-slate-300 rounded-lg py-2.5 px-3 focus:outline-none focus:border-yellow-400 text-sm" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-2">
                <button type="submit" className="bg-[#E6D41A] hover:bg-[#D4C318] text-white font-bold text-[13px] px-16 py-3.5 rounded-lg shadow-sm transition-colors">
                  Book Car
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
