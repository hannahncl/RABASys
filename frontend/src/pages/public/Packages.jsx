import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { api } from '../../services/api';
import { Compass, Clock, SlidersHorizontal, Tags, Users, CalendarDays, Star, ChevronDown } from 'lucide-react';
import FavoriteButton from '../../components/ui/FavoriteButton';

const packageCategories = [
  {
    key: 'all',
    label: 'All Tour Packages',
    shortLabel: 'All Packages',
  },
  {
    key: 'exclusive',
    label: 'Exclusive Tour Package',
    shortLabel: 'Exclusive Tours',
  },
  {
    key: 'tuktrip',
    label: 'Tuktrip',
    shortLabel: 'Tuktrip Package',
  },
  {
    key: 'joiner',
    label: 'Joiner Tour Package',
    shortLabel: 'Joiner Tours',
  },
];

const packagePriceRanges = [
  { label: 'All Packages', min: 0, max: 100000 },
  { label: 'Under ₱5,000', min: 0, max: 5000 },
  { label: '₱5,000 - ₱10,000', min: 5000, max: 10000 },
  { label: '₱10,000 - ₱20,000', min: 10000, max: 20000 },
  { label: '₱20,000+', min: 20000, max: 100000 },
];

const getPackageVisualCategory = (pkg = {}) => {
  const savedType = String(pkg.packageType || pkg.package_type || pkg.category || '').toLowerCase().replace(/\s+/g, '_');
  if (['exclusive', 'joiner', 'tuktrip'].includes(savedType)) return savedType;

  const text = [
    pkg.title,
    pkg.packageName,
    pkg.duration,
    pkg.description,
  ].filter(Boolean).join(' ').toLowerCase();

  if (text.includes('tuktrip') || text.includes('tuk trip')) return 'tuktrip';
  if (text.includes('joiner') || text.includes('shared') || text.includes('open tour')) return 'joiner';
  return 'exclusive';
};

const packageSearchFields = [
  'title', 'packageName', 'package_name', 'destination', 'description',
  'duration', 'inclusion', 'inclusions', 'itinerary', 'accommodations',
  'meeting_location', 'meetingLocation', 'package_type', 'packageType',
  'category', 'activities', 'activity', 'highlights', 'tags', 'services',
];

const flattenSearchValue = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(flattenSearchValue).join(' ');
  if (typeof value === 'object') return Object.values(value).map(flattenSearchValue).join(' ');
  return String(value);
};

const getPackageSearchText = (pkg = {}) => packageSearchFields
  .map((field) => flattenSearchValue(pkg[field]))
  .filter(Boolean)
  .join(' ')
  .toLowerCase();

const formatPackageDate = (date) => date
  ? new Date(`${String(date).slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })
  : 'Date not set';

const Packages = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinerAvailability, setJoinerAvailability] = useState({});

  // Filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 100000]);

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true);
      const allPkgs = await packageService.getAll();
      setPackages(allPkgs);
      const joiners = allPkgs.filter((pkg) => getPackageVisualCategory(pkg) === 'joiner');
      const availability = await Promise.all(joiners.map(async (pkg) => {
        try {
          return [String(pkg.id), await api(`/bookings/joiner-availability/${pkg.id}`)];
        } catch {
          return [String(pkg.id), null];
        }
      }));
      setJoinerAvailability(Object.fromEntries(availability));
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
  const displayPackages = packages;

  const filteredPackages = displayPackages.filter((pkg) => {
    const searchableText = getPackageSearchText(pkg);
    const searchWords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matchesSearch = searchWords.every((word) => searchableText.includes(word));
    const matchesCategory = selectedCategory === 'all' || getPackageVisualCategory(pkg) === selectedCategory;
    const matchesPrice = pkg.price >= priceRange[0] && pkg.price <= priceRange[1];

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const selectedCategoryConfig = packageCategories.find((category) => category.key === selectedCategory) || packageCategories[0];

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
                placeholder="Search..."
                className="w-full py-3 px-4 text-[13px] font-medium focus:outline-none transition-all"
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

            {/* Package Category */}
            <div className="mb-8">
              <h4
                className="text-[10px] font-semibold mb-4 flex items-center gap-2"
                style={{
                  color: '#4a453b',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                <Tags className="w-3.5 h-3.5" /> Category
              </h4>
              <div className="flex flex-col gap-2">
                {packageCategories.map((category) => {
                  const isSelected = selectedCategory === category.key;
                  return (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => setSelectedCategory(category.key)}
                      aria-pressed={isSelected}
                      className="w-full rounded border px-4 py-3 text-left text-[13px] font-medium transition-colors"
                      style={{
                        borderColor: isSelected ? '#b0a68e' : '#d6cfc2',
                        background: isSelected ? 'rgba(196,185,154,0.12)' : 'rgba(255,255,255,0.7)',
                        color: isSelected ? '#3d3a34' : '#45403a',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {category.shortLabel}
                    </button>
                  );
                })}
              </div>
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
              <div className="relative">
                <select
                  value={priceRange.join('-')}
                  onChange={(e) => {
                    const selectedRange = packagePriceRanges.find((option) => `${option.min}-${option.max}` === e.target.value);
                    if (selectedRange) setPriceRange([selectedRange.min, selectedRange.max]);
                  }}
                  className="w-full appearance-none py-3 pl-4 pr-10 text-[13px] font-medium transition-all"
                  style={{
                    borderRadius: '4px',
                    border: '1px solid #d6cfc2',
                    background: 'rgba(255,255,255,0.7)',
                    color: '#45403a',
                    letterSpacing: '0.02em',
                  }}
                >
                  {packagePriceRanges.map((option) => (
                    <option key={option.label} value={`${option.min}-${option.max}`}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6255]" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="flex-1">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2
                className="text-lg font-semibold"
                style={{ color: '#1a1a1a', fontFamily: "'Outfit', Georgia, serif", letterSpacing: '0.03em' }}
              >
                {selectedCategoryConfig.label}
              </h2>
              <span className="text-[11px] font-medium" style={{ color: '#6b6255' }}>
                {filteredPackages.length} package{filteredPackages.length === 1 ? '' : 's'}
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-96 animate-pulse"
                    style={{ background: '#ebe7df', borderRadius: '6px' }}
                  />
                ))}
              </div>
            ) : filteredPackages.length > 0 ? (
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {filteredPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="group relative flex h-full w-full flex-col overflow-hidden transition-all duration-500 hover:-translate-y-[3px] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)]"
                    style={{
                      background: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #e0dbd0',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >

                    {/* Image Area */}
                    <div className="relative h-[240px] w-full overflow-hidden bg-[#fcfbf9]">
                      <FavoriteButton
                        itemId={pkg.id}
                        itemType="tour"
                        className="absolute right-3 top-3 z-10 shadow-sm"
                      />
                      <img
                        src={pkg.image || '/CAGSAWA.jpg'}
                        alt={pkg.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = '/CAGSAWA.jpg';
                        }}
                      />
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
                      <h3
                        className="mb-1 text-[15px] font-semibold leading-tight"
                        style={{
                          color: '#1a1a1a',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {pkg.title}
                      </h3>

                      <div className="mb-2 flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-[#c4b99a] text-[#c4b99a]" />
                          <span className="text-xs font-bold text-[#1a1a1a]">New</span>
                        </div>
                        <span className="text-[10px] font-medium text-[#8f8576]">No reviews yet</span>
                      </div>
                      <div
                        className="mt-auto grid grid-cols-2 gap-x-2 gap-y-3.5 pt-4 text-[11px] font-medium"
                        style={{ color: '#4a453b', borderTop: '1px solid #eae5db' }}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {getPackageVisualCategory(pkg) === 'joiner' ? <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#6b6255]" /> : <Clock className="h-3.5 w-3.5 shrink-0 text-[#6b6255]" />}
                          <span className="truncate">{getPackageVisualCategory(pkg) === 'joiner' ? (joinerAvailability[pkg.id]?.departureDate || pkg.joinerDate ? formatPackageDate(joinerAvailability[pkg.id]?.departureDate || pkg.joinerDate) : 'Date not set') : (pkg.duration || 'Duration TBA')}</span>
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <Users className="h-3.5 w-3.5 shrink-0 text-[#6b6255]" />
                          <span className="truncate">{getPackageVisualCategory(pkg) === 'joiner' ? (joinerAvailability[pkg.id] ? (joinerAvailability[pkg.id].bookingOpen ? `${joinerAvailability[pkg.id].remainingSlots} ${joinerAvailability[pkg.id].remainingSlots === 1 ? 'spot' : 'spots'} left` : 'Booking closed') : 'Availability loading') : (pkg.maximumCapacity ? `Up to ${pkg.maximumCapacity} guests` : 'Flexible group size')}</span>
                        </div>
                      </div>
                      {getPackageVisualCategory(pkg) === 'joiner' && joinerAvailability[pkg.id]?.scheduleValid !== false && joinerAvailability[pkg.id]?.bookingDeadline && (
                        <p className="mt-2 text-[10px] text-[#8a7f70]">Booking closes {formatPackageDate(joinerAvailability[pkg.id].bookingDeadline)}</p>
                      )}

                      {/* Price & Action */}
                      <div className="mb-4 mt-5 h-px bg-[#eae5db]" />
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div>
                          <span
                            className="mr-1 text-xl font-bold"
                            style={{
                              color: '#1a1a1a',
                            }}
                          >
                            ₱{Number(pkg.price || 0).toLocaleString()}
                          </span>
                          <span
                            className="text-[10px] font-medium"
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
                          className="rounded-[2px] border border-[#2d2a24] bg-transparent px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2d2a24] transition-all duration-300 hover:bg-[#2d2a24] hover:text-[#f7f4ef]"
                          style={{
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {getPackageVisualCategory(pkg) === 'joiner' ? 'Join this Tour' : 'Book Now'}
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
                  Try another category, search, or price range.
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
