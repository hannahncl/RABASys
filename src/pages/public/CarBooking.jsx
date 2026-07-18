import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import { AuthContext } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const CarBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const { user } = useContext(AuthContext);
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCar = async () => {
      try {
        const vehicle = await api(`/vehicles/${id}`);
        setCar({
          id: String(vehicle.vehicle_id),
          name: vehicle.vehicle_name,
          type: vehicle.vehicle_type,
          plate: vehicle.plate_number,
          capacity: vehicle.capacity,
          color: vehicle.color || 'N/A',
          rate: `PHP ${Number(vehicle.daily_rate || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          image: vehicle.image || 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=600',
          vehicle_id: vehicle.vehicle_id,
          price: Number(vehicle.daily_rate || 0),
        });
      } catch {
        showNotification('Unable to load this car right now.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadCar();
  }, [id, showNotification]);

  const handleBookCar = async (e) => {
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

    if (!user) {
      showNotification('Please log in before booking a car rental.', 'error');
      navigate('/login', { state: { from: location } });
      return;
    }

    try {
      await api('/rentalBookings', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_id: car.vehicle_id,
          booking_reference: `CR-${Date.now()}`,
          pickup_date: new Date().toISOString(),
          return_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          pickup_location: 'Rabas Travel Office',
          total_amount: Number(car.price || 0),
          booking_status: 'Pending',
          driver_name: `${firstName} ${lastName}`,
          driver_age: age,
          driver_phone: phone,
          driver_email: email,
          license_number: licenseNumber,
          issuing_country: issuingCountry,
          expiration_date: expirationDate,
        }),
      });
      showNotification('Car rental booking was saved successfully.', 'success');
      navigate('/profile');
    } catch (error) {
      showNotification(error.message || 'Unable to save your car rental booking.', 'error');
    }
  };

  if (loading || !car) {
    return <div className="bg-white min-h-screen pt-12 pb-24 flex items-center justify-center text-black">Loading car details...</div>;
  }

  return (
    <div className="bg-white min-h-screen pt-12 pb-24 font-sans text-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-black mb-2">Car Rentals</h1>
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
