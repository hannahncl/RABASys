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
    const formData = new FormData(e.target);
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const age = formData.get('age');
    const licenseNumber = formData.get('licenseNumber');
    const issuingCountry = formData.get('issuingCountry');
    const expirationDate = formData.get('expirationDate');

    const numericPrice = parseFloat(car.rate.replace(/[^0-9.-]+/g, ""));

    const carPkg = {
      id: `car-rental-${car.id}`,
      title: `Car Rental: ${car.name}`,
      destination: `Plate: ${car.plate}`,
      duration: '1 Day',
      price: numericPrice,
      image: car.image,
      customizedDetails: { 
        type: car.type, 
        color: car.color, 
        capacity: car.capacity,
        driverInfo: `${firstName} ${lastName} (Age: ${age})`,
        license: `${licenseNumber} (${issuingCountry}) Exp: ${expirationDate}`
      }
    };

    navigate('/booking/custom', {
      state: {
        customPackage: carPkg,
        firstName,
        lastName,
        email,
        phone,
        tourDate: new Date().toISOString().split('T')[0],
        adultsCount: 1,
        childrenCount: 0,
        startStep: 2
      }
    });
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
            <div className="border border-slate-150 rounded-xl p-8 flex flex-col items-center shadow-[0_1px_3px_rgba(0,0,0,0.03)] bg-white">
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
                <h3 className="text-sm font-semibold text-gray-600 mb-4">Driver's Information</h3>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Driver's First Name</label>
                    <input type="text" name="firstName" required className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all capitalize" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Driver's Last Name</label>
                    <input type="text" name="lastName" required className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all capitalize" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Driver's Age</label>
                    <input type="text" name="age" required className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Contact Number</label>
                    <input type="text" name="phone" required className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all" />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Email Address</label>
                  <input type="email" name="email" required className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all" />
                </div>
              </div>

              {/* Driver's License */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-4">Driver's License</h3>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">License Number</label>
                  <input type="text" name="licenseNumber" required className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Issuing Country</label>
                    <input type="text" name="issuingCountry" required className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all capitalize" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Expiration Date</label>
                    <input type="text" name="expirationDate" required placeholder="MM/YYYY" className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-2">
                <button type="submit" className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-250 font-bold text-[13px] px-16 py-3.5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors cursor-pointer">
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
