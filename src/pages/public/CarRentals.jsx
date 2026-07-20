import React, { useState, useEffect } from 'react';
import { MapPin, Users, SlidersHorizontal, Zap, Tag, Square, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import DualRangeSlider from '../../components/ui/DualRangeSlider';
import { serviceService } from '../services/serviceService';
import { filterCars } from './carRentalsFilters';

const CarRentals = () => {
  // Filter States
  const [capacity, setCapacity] = useState(4);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [allCars, setAllCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const data = await serviceService.getByCategory('car');
        setAllCars(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch cars:', error);
        setAllCars([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, []);

  const cars = filterCars(allCars, { capacity, priceRange });

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
              <h4 className="text-xs font-extrabold text-black mb-6">Price range (PHP)</h4>
              <DualRangeSlider 
                min={0} 
                max={15000} 
                step={500} 
                value={priceRange} 
                onChange={setPriceRange} 
              />
            </div>
            
            {/* Siting Capacity */}
            <div className="border-t border-slate-100 pt-6 mb-8">
              <h4 className="text-xs font-extrabold text-black mb-5">Minimum Seating Capacity</h4>
              <div className="flex gap-2">
                {[2, 4, 6, 8, 12, 15].map(cap => (
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
          </div>
          
          {/* Main Content Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader className="w-8 h-8 animate-spin text-yellow-500" />
              </div>
            ) : cars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {cars.map((car) => (
                  <div key={car.id} className="bg-white rounded-3xl border border-gray-300 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.06)] transition-shadow overflow-hidden flex flex-col relative group">

                    {/* Image Area - Clean White Background */}
                    <div className="h-[220px] bg-slate-50 relative flex items-center justify-center p-0 overflow-hidden">
                      <img 
                        src={car.image || 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600'} 
                        alt={car.vehicleName} 
                        className="min-h-full min-w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                    
                    {/* Card Content */}
                    <div className="px-6 pb-6 pt-4 flex-1 flex flex-col border-t border-slate-50">

                      <h3 className="font-extrabold text-black text-base mb-1.5 leading-tight">{car.vehicleName}</h3>
                      <p className="text-[11px] font-medium text-black flex items-center gap-1.5 mb-6">
                        <MapPin className="w-3 h-3" /> Bicol Region
                      </p>
                      
                      {/* Specs Grid */}
                      <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-[11px] font-bold text-black mb-6 mt-auto pt-5 border-t border-slate-100">
                        <div className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> <span className="font-medium">{car.vehicleType || 'Car'}</span></div>
                        <div className="flex items-center gap-2"><Tag className="w-3.5 h-3.5" /> <span className="font-medium">{car.plateNumber || 'N/A'}</span></div>
                        <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-black" /> {car.capacity || 4} seats</div>
                        <div className="flex items-center gap-2"><Square className="w-3.5 h-3.5" /> <span className="font-medium">Standard</span></div>
                      </div>
                      
                      {/* Price & Action */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] text-black font-medium">
                          from <span className="text-lg font-black text-black ml-0.5">₱{Number(car.price).toLocaleString()}</span> / day
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
                <p className="text-black text-sm">Try changing the capacity or price range.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CarRentals;
