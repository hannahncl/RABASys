import React, { useState } from 'react';
import { Heart, Star, MapPin, Gauge, Settings2, Fuel, Users, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

const CarRentals = () => {
  // Filter States
  const [capacity, setCapacity] = useState(4);
  const [selectedColor, setSelectedColor] = useState('White');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(3000);

  // Mock data for the bars in the price range chart
  const priceBars = [
    3, 5, 4, 7, 5, 8, 12, 10, 15, 20, 16, 25, 22, 18, 14, 10, 16, 12, 8, 6, 4, 3, 5, 4, 2, 3, 2, 1
  ];

  const allCars = [
    {
      id: 1,
      name: 'Audi e-tron GT',
      location: 'Manchester, England',
      image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=600',
      rating: 4.96,
      reviews: 672,
      miles: '25,100',
      transmission: 'Automatic',
      fuel: 'Electric',
      seats: 4,
      color: 'White',
      price: '1,000',
      priceNum: 1000
    },
    {
      id: 2,
      name: 'Lexus RX 350',
      location: 'London, England',
      image: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?auto=format&fit=crop&q=80&w=600',
      rating: 4.96,
      reviews: 672,
      miles: '25,100',
      transmission: 'Automatic',
      fuel: 'Petrol',
      seats: 4,
      color: 'White',
      price: '1,500',
      priceNum: 1500
    },
    {
      id: 3,
      name: 'Chevrolet Corvette',
      location: 'Birmingham, England',
      image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600',
      rating: 4.96,
      reviews: 672,
      miles: '25,100',
      transmission: 'Automatic',
      fuel: 'Petrol',
      seats: 2,
      color: 'Gray',
      price: '1,800',
      priceNum: 1800
    },
    {
      id: 4,
      name: 'BMW M4 Competition',
      location: 'Manchester, England',
      image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=600',
      rating: 4.96,
      reviews: 672,
      miles: '25,100',
      transmission: 'Automatic',
      fuel: 'Petrol',
      seats: 4,
      color: 'White',
      price: '1,200',
      priceNum: 1200
    },
    {
      id: 5,
      name: 'Audi A7 Sportback',
      location: 'Liverpool, England',
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=600',
      rating: 4.96,
      reviews: 672,
      miles: '25,100',
      transmission: 'Automatic',
      fuel: 'Hybrid',
      seats: 4,
      color: 'Gray',
      price: '1,600',
      priceNum: 1600
    },
    {
      id: 6,
      name: 'Porsche 911 Carrera',
      location: 'Leeds, England',
      image: 'https://images.unsplash.com/photo-1503376712341-ea78262f3a61?auto=format&fit=crop&q=80&w=600',
      rating: 4.96,
      reviews: 672,
      miles: '25,100',
      transmission: 'Automatic',
      fuel: 'Petrol',
      seats: 2,
      color: 'Black',
      price: '1,400',
      priceNum: 1400
    },
    {
      id: 7,
      name: 'Range Rover Velar',
      location: 'Bristol, England',
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600',
      rating: 4.96,
      reviews: 672,
      miles: '25,100',
      transmission: 'Automatic',
      fuel: 'Diesel',
      seats: 6,
      color: 'Black',
      price: '2,000',
      priceNum: 2000
    }
  ];

  const cars = allCars.filter(car => car.seats === capacity && car.color === selectedColor && car.priceNum <= maxPrice);

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
              
              {/* Chart Mockup */}
              <div className="relative h-16 flex items-end justify-between gap-[2px] mb-2 px-3">
                {priceBars.map((h, i) => (
                  <div key={i} className={`${i / priceBars.length <= maxPrice / 3000 ? 'bg-yellow-200' : 'bg-slate-200'} w-full rounded-t-sm transition-colors`} style={{ height: `${h * 2}px` }}></div>
                ))}
              </div>
              
              {/* Range Input */}
              <input 
                type="range" 
                min="0" 
                max="3000" 
                step="100"
                value={maxPrice} 
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-yellow-400 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2"
              />
              
              {/* Sliders Input Mockup */}
              <div className="flex justify-between text-[10px] text-black font-medium mt-6">
                <div className="flex flex-col items-center">
                  <span className="block mb-1.5">Minimum</span>
                  <div className="border border-slate-150 rounded-full px-5 py-2 text-slate-700 font-bold">₱0</div>
                </div>
                <div className="flex flex-col items-center">
                  <span className="block mb-1.5">Maximum</span>
                  <div className="border border-slate-150 rounded-full px-5 py-2 text-slate-700 font-bold">₱{maxPrice.toLocaleString()}</div>
                </div>
              </div>
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
                    }`}
                  >
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
            {cars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {cars.map((car) => (
                  <div key={car.id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.06)] transition-shadow overflow-hidden flex flex-col relative group">
                    {/* Favorite Button */}
                    <button className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-sm border border-slate-100 z-10 hover:bg-slate-50 transition-colors">
                      <Heart className="w-3.5 h-3.5 text-black" />
                    </button>
                    
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
                      {/* Floating Rating Badge */}
                      <div className="flex justify-center -mt-8 relative z-10 mb-5">
                        <div className="bg-white border border-slate-100 rounded-full px-3 py-1 shadow-sm text-[10px] font-bold flex items-center gap-1 text-black">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" /> 
                          {car.rating} <span className="text-black font-medium ml-0.5">({car.reviews} reviews)</span>
                        </div>
                      </div>
                      
                      <h3 className="font-extrabold text-black text-base mb-1.5 leading-tight">{car.name}</h3>
                      <p className="text-[11px] font-medium text-black flex items-center gap-1.5 mb-6">
                        <MapPin className="w-3 h-3" /> {car.location}
                      </p>
                      
                      {/* Specs Grid */}
                      <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-[11px] font-bold text-black mb-6 mt-auto pt-5 border-t border-slate-100">
                        <div className="flex items-center gap-2"><Gauge className="w-3.5 h-3.5 text-black" /> {car.miles} miles</div>
                        <div className="flex items-center gap-2"><Settings2 className="w-3.5 h-3.5 text-black" /> {car.transmission}</div>
                        <div className="flex items-center gap-2"><Fuel className="w-3.5 h-3.5 text-black" /> {car.fuel}</div>
                        <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-black" /> {car.seats} seats</div>
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
