import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { packageService } from '../services/packageService';
import { Compass, Search, Star, Heart, Clock, Users, SlidersHorizontal } from 'lucide-react';

const Packages = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTag, setSelectedTag] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 100000]);

  // Mock data for the bars in the price range chart
  const priceBars = [
    3, 5, 4, 7, 5, 8, 12, 10, 15, 20, 16, 25, 22, 18, 14, 10, 16, 12, 8, 6, 4, 3, 5, 4, 2, 3, 2, 1
  ];

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true);
      const allPkgs = await packageService.getAll();
      setPackages(allPkgs);
      setLoading(false);
    };
    loadPackages();
  }, []);

  // Update searchQuery state if url params change
  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSearchParams(value ? { search: value } : {});
  };

  // Perform filtering
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = selectedTag === 'All' || pkg.tags.includes(selectedTag);
    const matchesPrice = pkg.price >= priceRange[0] && pkg.price <= priceRange[1];

    return matchesSearch && matchesTag && matchesPrice;
  });

  const allTags = ['All', 'Beach', 'Adventure', 'Cultural', 'Nature'];

  // Badges to rotate across cards
  const badges = ['Top Rated', 'Best Sale', '25% Off'];

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
            <div className="mb-10">
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
                placeholder="Search..."
                className="w-full py-3 px-4 text-[14px] focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  border: '1px solid #d6cfc2',
                  borderRadius: '4px',
                  color: '#2d2a24',
                  fontFamily: "'Inter', sans-serif",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#b0a68e';
                  e.target.style.boxShadow = '0 0 0 3px rgba(176,166,142,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d6cfc2';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>


            {/* Price Range */}
            <div className="mb-8">
              <h4
                className="text-[10px] font-semibold mb-4"
                style={{
                  color: '#4a453b',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                Price range
              </h4>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'All Packages', min: 0, max: 100000 },
                  { label: 'Under ₱5,000', min: 0, max: 5000 },
                  { label: '₱5,000 - ₱10,000', min: 5000, max: 10000 },
                  { label: '₱10,000 - ₱20,000', min: 10000, max: 20000 },
                  { label: '₱20,000+', min: 20000, max: 100000 },
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
          </div>

          {/* Main Content Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-96 animate-pulse"
                    style={{ background: '#ebe7df', borderRadius: '6px' }}
                  />
                ))}
              </div>
            ) : filteredPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
                {filteredPackages.map((pkg, index) => (
                  <div
                    key={pkg.id}
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

                    {/* Image Area */}
                    <div className="h-[260px] w-full overflow-hidden relative">
                      <img
                        src={pkg.image || '/CAGSAWA.jpg'}
                        alt={pkg.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = '/CAGSAWA.jpg';
                        }}
                      />
                      {/* Subtle gradient overlay at the bottom of image */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.06), transparent)',
                        }}
                      />

                      {/* Rating badge removed per request */}
                    </div>

                    {/* Card Content */}
                    <div className="px-5 pb-5 pt-5 flex-1 flex flex-col">
                      <h3
                        className="text-[15px] font-semibold mb-3 leading-tight"
                        style={{
                          color: '#1a1a1a',
                          fontFamily: "'Outfit', Georgia, serif",
                          letterSpacing: '0.03em',
                        }}
                      >
                        {pkg.title}
                      </h3>

                      <div className="flex items-center gap-5 text-[11px] font-medium mb-5"
                        style={{ color: '#4a453b' }}
                      >
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" style={{ color: '#6b6255' }} /> {pkg.duration}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3 h-3" style={{ color: '#6b6255' }} /> 4-6 guest
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="mb-4" style={{ height: '1px', background: '#eae5db' }} />

                      {/* Price & Action */}
                      <div className="flex items-center justify-between mt-auto">
                        <div>
                          <span
                            className="text-xl font-bold"
                            style={{
                              color: '#1a1a1a',
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          >
                            ₱{pkg.price.toLocaleString()}
                          </span>
                          <span
                            className="text-[10px] font-medium ml-1.5"
                            style={{
                              color: '#5c564b',
                              letterSpacing: '0.04em',
                            }}
                          >
                            / person
                          </span>
                        </div>
                        <Link
                          to={`/packages/${pkg.id}`}
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
                <Compass
                  className="h-10 w-10 mx-auto mb-4 animate-spin"
                  style={{ color: '#6b6255' }}
                />
                <h3
                  className="font-semibold mb-2 text-[14px]"
                  style={{
                    color: '#3d3a34',
                    fontFamily: "'Outfit', Georgia, serif",
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  No Packages Found
                </h3>
                <p className="text-[13px]" style={{ color: '#4a453b' }}>
                  Try changing your search or filters.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Packages;
