import React, { useEffect, useState } from 'react';
import { Heart, Star, MapPin, Gauge, Settings2, Fuel, Users, SlidersHorizontal, Zap, Tag, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import DualRangeSlider from '../../components/ui/DualRangeSlider';
import { serviceService } from '../services/serviceService';

const CarRentals = () => {
  // Filter States
  const [capacity, setCapacity] = useState(4);
  const [selectedColor, setSelectedColor] = useState('White');
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [allCars, setAllCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCars = async () => {
      try {
        const vehicles = await serviceService.getByCategory('car');
        const mappedCars = vehicles.map((car) => ({
          ...car,
          name: car.title,
          location: car.pickupLocation || 'Bicol Region',
          color: car.color || 'White',
          plateNumber: car.plateNumber || 'N/A',
          vehicleType: car.vehicleType || 'Car',
          seats: Number(String(car.capacity || '4').match(/\d+/)?.[0] || 4),
          priceNum: Number(car.price || 0),
          price: String(car.price || 0),
        }));
        setAllCars(mappedCars);
      } catch {
        setAllCars([]);
      } finally {
        setLoading(false);
      }
    };

    loadCars();
  }, []);

  const cars = allCars.filter((car) => {
    const seatCount = Number(car.seats || 4);
    const colorMatch = !selectedColor || car.color === selectedColor;
    return seatCount === capacity && colorMatch && car.priceNum >= priceRange[0] && car.priceNum <= priceRange[1];
  });

  return (
    <div className="bg-white min-h-screen pt-8 pb-24 font-sans text-black">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Sidebar Filters */}
          <div className="w-full lg:w-[260px] flex-shrink-0">
            <h3 className="font-extrabold text-[15px] text-black mb-8 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-black" /> Search Filters
            </h3>
            
            <div className="border-t border-slate-100 pt-6 mb-8">
              <h4 className="text-xs font-extrabold text-black mb-6">Price range</h4>
              <DualRangeSlider 
                min={0} 
                max={3000} 
                step={100} 
                value={priceRange} 
                onChange={setPriceRange} 
              />
            </div>
            
            {/* Siting Capacity */}
            <div className="border-t border-slate-100 pt-6 mb-8">
              <h4 className="text-xs font-extrabold text-black mb-5">Siting Capacity</h4>
              <div className="flex gap-2">
                {[2, 4, 6, 8].map(cap => (
                  <button 
                    key={cap}
                    onClick={() => setCapacity(cap)}
                    className={`flex-1 py-2 rounded-full border text-[11px] font-semibold transition-all ${
                      capacity === cap 
                      ? 'border-yellow-250 bg-yellow-50 text-yellow-750 shadow-[0_1px_2px_rgba(0,0,0,0.02)]' 
                      : 'border-slate-150 hover:border-slate-300 text-slate-700'
                    }`}>
                    {cap}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Colors */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex justify-between items-center mb-5">
                <h4 className="text-xs font-extrabold text-black">Colors</h4>
                <span className="text-[9px] font-bold text-black cursor-pointer hover:text-black transition-colors">See All</span>
              </div>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setSelectedColor('White')}>
                  <div className={`w-4 h-4 rounded-full border ${selectedColor === 'White' ? 'border-yellow-350 bg-yellow-100' : 'border-slate-200 bg-white group-hover:border-slate-300'} transition-colors`}></div>
                  <span className="text-[11px] font-medium text-black">White</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setSelectedColor('Gray')}>
                  <div className={`w-4 h-4 rounded-full ring-2 ${selectedColor === 'Gray' ? 'ring-yellow-300 bg-slate-400' : 'bg-slate-300 ring-transparent group-hover:ring-slate-200'} transition-all`}></div>
                  <span className="text-[11px] font-medium text-black">Gray</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setSelectedColor('Black')}>
                  <div className={`w-4 h-4 rounded-full ring-2 ${selectedColor === 'Black' ? 'ring-yellow-300 bg-black' : 'bg-black ring-transparent group-hover:ring-slate-200'} transition-all`}></div>
                  <span className="text-[11px] font-medium text-black">Black</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-3xl">
                <h3 className="text-black font-bold mb-2">Loading available cars...</h3>
              </div>
            ) : cars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {cars.map((car, idx) => (
                  <div key={car.id} className="bg-white rounded-3xl border border-gray-300 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.06)] transition-shadow overflow-hidden flex flex-col relative group">

                    {/* Image Area - Clean White Background */}
                    <div className="h-[220px] bg-white relative flex items-center justify-center p-4">
                      <img 
                        src={car.image} 
                        alt={car.name} 
                        className="max-h-full max-w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                    
                    {/* Card Content */}
                    <div className="px-6 pb-6 pt-2 flex-1 flex flex-col border-t border-slate-50">

                      <h3 className="font-extrabold text-black text-base mb-1.5 leading-tight">{car.name}</h3>
                      {idx > 2 && (
                        <p className="text-[11px] font-medium text-black flex items-center gap-1.5 mb-6">
                          <MapPin className="w-3 h-3" /> {car.location}
                        </p>
                      )}
                      
                      {/* Specs Grid */}
                      <div className={`grid grid-cols-2 gap-y-3.5 gap-x-2 text-[11px] font-bold text-black mb-6 mt-auto pt-5 ${idx > 2 ? 'border-t border-slate-100' : ''}`}>
                        <div className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> <span className="font-medium">{car.vehicleType || car.fuel}</span></div>
                        <div className="flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> <span className="font-medium">{car.plateNumber || 'N/A'}</span></div>
                        <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-black" /> {car.seats} seats</div>
                        <div className="flex items-center gap-2"><Square className="w-3.5 h-3.5" /> <span className="font-medium">{car.color}</span></div>
                      </div>
                      
                      {/* Price & Action */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] text-black font-medium">
                          from <span className="text-lg font-black text-black ml-0.5">₱{car.price}</span>
                        </div>
                        <Link 
                          to={`/car-rentals/${car.id}`}
                          className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-250 font-bold text-[11px] px-6 py-2.5 rounded-full transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] inline-block"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-3xl">
                <h3 className="text-black font-bold mb-2">No cars match your filters</h3>
                <p className="text-black text-sm">Try changing the capacity or color.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CarRentals;
