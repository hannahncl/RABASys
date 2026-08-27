import React, { useState, useEffect } from 'react';
import { MapPin, Users, SlidersHorizontal, Zap, Tag, Square, Loader } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { serviceService } from '../services/serviceService';
import { filterCars } from './carRentalsFilters';

const CarRentals = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [capacity, setCapacity] = useState(4);
  const [priceRange, setPriceRange] = useState([0, 100000]);
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

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSearchParams(value ? { search: value } : {});
  };

  const cars = filterCars(allCars, { capacity, priceRange, searchQuery });

  return (
    <div className="min-h-screen pt-10 pb-28" style={{ background: '#ffffffff', fontFamily: "'Inter', 'Georgia', serif" }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">


        <div className="flex flex-col lg:flex-row gap-12">

          {/* Sidebar Filters */}
          <div className="w-full lg:w-[250px] flex-shrink-0">
            <h3
              className="text-[11px] font-semibold mb-8 flex items-center gap-2.5 pb-3"
              style={{
                color: '#3d3a34',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                borderBottom: '1px solid #d6cfc2',
              }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" style={{ color: '#4a453b' }} /> Search Filters
            </h3>

            {/* Keyword Search */}
            <div className="mb-8">
              <h4
                className="text-[10px] font-semibold mb-3"
                style={{
                  color: '#4a453b',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                Keyword Search
              </h4>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search cars..."
                className="w-full py-3 px-4 text-[13px] font-medium transition-all"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid #d6cfc2',
                  borderRadius: '4px',
                  color: '#1a1a1a',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#b0a68e';
                  e.target.style.boxShadow = '0 0 0 3px rgba(176,166,142,0.1)';
                  e.target.style.background = '#ffffff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d6cfc2';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = 'rgba(255,255,255,0.7)';
                }}
              />
            </div>

            <div className="mb-8">
              <h4
                className="text-[10px] font-semibold mb-4"
                style={{
                  color: '#4a453b',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                Price range (PHP)
              </h4>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'All Prices', min: 0, max: 100000 },
                  { label: 'Under ₱3,000', min: 0, max: 3000 },
                  { label: '₱3,000 - ₱6,000', min: 3000, max: 6000 },
                  { label: '₱6,000 - ₱10,000', min: 6000, max: 10000 },
                  { label: '₱10,000+', min: 10000, max: 100000 },
                ].map((option) => {
                  const isSelected = priceRange[0] === option.min && priceRange[1] === option.max;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setPriceRange([option.min, option.max])}
                      className="w-full text-left px-4 py-2.5 text-[12px] font-medium transition-all"
                      style={{
                        borderRadius: '4px',
                        border: isSelected ? '1px solid #b0a68e' : '1px solid #e0dbd0',
                        background: isSelected ? 'rgba(196,185,154,0.12)' : 'rgba(255,255,255,0.5)',
                        color: isSelected ? '#3d3a34' : '#45403a',
                        letterSpacing: '0.02em',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.target.style.borderColor = '#c4b99a';
                          e.target.style.background = 'rgba(255,255,255,0.8)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.target.style.borderColor = '#e0dbd0';
                          e.target.style.background = 'rgba(255,255,255,0.5)';
                        }
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Siting Capacity */}
            <div className="mb-8">
              <h4
                className="text-[10px] font-semibold mb-4"
                style={{
                  color: '#4a453b',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                Minimum Seating Capacity
              </h4>
              <div className="flex gap-2">
                {[2, 4, 6, 8, 12, 15].map(cap => {
                  const isSelected = capacity === cap;
                  return (
                    <button
                      key={cap}
                      onClick={() => setCapacity(cap)}
                      className="flex-1 py-2 text-[11px] font-semibold transition-all"
                      style={{
                        borderRadius: '4px',
                        border: isSelected ? '1px solid #b0a68e' : '1px solid #e0dbd0',
                        background: isSelected ? 'rgba(196,185,154,0.12)' : 'rgba(255,255,255,0.5)',
                        color: isSelected ? '#3d3a34' : '#45403a',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.target.style.borderColor = '#c4b99a';
                          e.target.style.background = 'rgba(255,255,255,0.8)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.target.style.borderColor = '#e0dbd0';
                          e.target.style.background = 'rgba(255,255,255,0.5)';
                        }
                      }}
                    >
                      {cap}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-7">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-96 animate-pulse"
                    style={{ background: '#ebe7df', borderRadius: '6px' }}
                  />
                ))}
              </div>
            ) : cars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-7">
                {cars.map((car) => (
                  <div
                    key={car.id}
                    className="overflow-hidden flex flex-col relative group transition-all duration-500"
                    style={{
                      background: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #e0dbd0',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.07)';
                      e.currentTarget.style.transform = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.03)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >

                    {/* Image Area - Clean White Background */}
                    <div className="h-[240px] relative flex items-center justify-center p-0 overflow-hidden" style={{ background: '#fcfbf9' }}>
                      <img
                        src={car.image || 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=600'}
                        alt={car.vehicleName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {/* Subtle gradient overlay at the bottom of image */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.06), transparent)',
                        }}
                      />
                    </div>

                    {/* Card Content */}
                    <div className="px-5 pb-5 pt-5 flex-1 flex flex-col">

                      <h3
                        className="text-[15px] font-semibold mb-2 leading-tight"
                        style={{
                          color: '#1a1a1a',
                          fontFamily: "'Outfit', Georgia, serif",
                          letterSpacing: '0.03em',
                        }}
                      >
                        {car.vehicleName}
                      </h3>

                      {/* Specs Grid */}
                      <div
                        className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-[11px] font-medium mb-5 mt-auto pt-4"
                        style={{ color: '#4a453b', borderTop: '1px solid #eae5db' }}
                      >
                        <div className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" style={{ color: '#6b6255' }} /> <span>{car.vehicleType || 'Car'}</span></div>
                        <div className="flex items-center gap-2"><Tag className="w-3.5 h-3.5" style={{ color: '#6b6255' }} /> <span>{car.plateNumber || 'N/A'}</span></div>
                        <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" style={{ color: '#6b6255' }} /> {car.capacity || 4} seats</div>
                      </div>

                      {/* Divider */}
                      <div className="mb-4" style={{ height: '1px', background: '#eae5db' }} />

                      {/* Price & Action */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span
                            className="text-xl font-bold ml-1.5 mr-1"
                            style={{
                              color: '#1a1a1a',
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          >
                            ₱{Number(car.price).toLocaleString()}
                          </span>
                          <span
                            className="text-[10px] font-medium"
                            style={{
                              color: '#5c564b',
                              letterSpacing: '0.04em',
                            }}
                          >
                            / day
                          </span>
                        </div>
                        <Link
                          to={`/car-rentals/${car.id}`}
                          className="px-5 py-2 text-[10px] font-semibold transition-all duration-300"
                          style={{
                            border: '1px solid #2d2a24',
                            borderRadius: '2px',
                            color: '#2d2a24',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            background: 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = '#2d2a24';
                            e.target.style.color = '#f7f4ef';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = '#2d2a24';
                          }}
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="h-64 flex flex-col items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.6)',
                  border: '1px solid #e0dbd0',
                  borderRadius: '6px',
                }}
              >
                <h3
                  className="font-semibold mb-2 text-[14px]"
                  style={{
                    color: '#3d3a34',
                    fontFamily: "'Outfit', Georgia, serif",
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  No cars match your filters
                </h3>
                <p className="text-[13px]" style={{ color: '#4a453b' }}>
                  Try changing the capacity or price range.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CarRentals;
