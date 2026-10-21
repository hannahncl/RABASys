import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { api } from '../../services/api';
import { Compass, Clock, SlidersHorizontal, Tags, Users, CalendarDays } from 'lucide-react';
import FavoriteButton from '../../components/ui/FavoriteButton';

const packageCategories = [
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
  const [selectedCategory, setSelectedCategory] = useState('exclusive');
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
    const searchableText = [pkg.title, pkg.destination, pkg.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchesSearch = searchableText.includes(searchQuery.toLowerCase());
    const matchesCategory = getPackageVisualCategory(pkg) === selectedCategory;
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
            <div className="mb-6">
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
                className="w-full py-2.5 px-3 text-[13px] focus:outline-none transition-all"
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
            <div className="mb-6">
              <h4
                className="text-[10px] font-semibold mb-3 flex items-center gap-2"
                style={{
                  color: '#4a453b',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                <Tags className="w-3.5 h-3.5" /> Category
              </h4>
              <div className="flex flex-col gap-1.5">
                {packageCategories.map((category) => {
                  const isSelected = selectedCategory === category.key;
                  return (
                    <button
                      key={category.key}
                      type="button"
                      onClick={() => setSelectedCategory(category.key)}
                      className="w-full rounded-md border px-3 py-2 text-left text-[11px] font-medium transition-colors"
                      style={{
                        borderColor: isSelected ? '#2d2a24' : '#e0dbd0',
                        background: isSelected ? '#2d2a24' : '#fff',
                        color: isSelected ? '#f7f4ef' : '#45403a',
                      }}
                    >
                      {category.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Price Range */}
            <div className="mb-6">
              <h4
                className="text-[10px] font-semibold mb-3"
                style={{
                  color: '#4a453b',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                Price range
              </h4>
              <select
                value={priceRange.join('-')}
                onChange={(e) => {
                  const selectedRange = packagePriceRanges.find((option) => `${option.min}-${option.max}` === e.target.value);
                  if (selectedRange) setPriceRange([selectedRange.min, selectedRange.max]);
                }}
                className="w-full rounded-md border border-[#e0dbd0] bg-white px-3 py-2.5 text-xs text-[#45403a] outline-none focus:border-[#b0a68e]"
              >
                {packagePriceRanges.map((option) => (
                  <option key={option.label} value={`${option.min}-${option.max}`}>{option.label}</option>
                ))}
              </select>
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
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                {filteredPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#e7e2d8] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                    }}
                  >

                    {/* Image Area */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
                      <FavoriteButton
                        itemId={pkg.id}
                        itemType="tour"
                        className="absolute right-3 top-3 z-10 shadow-sm"
                      />
                      <img
                        src={pkg.image || '/CAGSAWA.jpg'}
                        alt={pkg.title}
                        className="absolute inset-0 h-full w-full bg-white object-contain"
                        onError={(e) => {
                          e.currentTarget.src = '/CAGSAWA.jpg';
                        }}
                      />
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-1 flex-col p-4">
                      <h3
                        className="text-base font-semibold leading-tight"
                        style={{
                          color: '#1a1a1a',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {pkg.title}
                      </h3>

                      {getPackageVisualCategory(pkg) === 'joiner' ? (
                        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-[#faf9f6] px-3 py-2.5 text-xs text-[#514b42]">
                          <div className="flex min-w-0 items-center gap-2">
                            <CalendarDays className="h-4 w-4 shrink-0 text-[#8b7355]" />
                            <span className="truncate whitespace-nowrap" title={joinerAvailability[pkg.id]?.departureDate || pkg.joinerDate ? formatPackageDate(joinerAvailability[pkg.id]?.departureDate || pkg.joinerDate) : 'Date not set'}>
                              {joinerAvailability[pkg.id]?.departureDate || pkg.joinerDate ? formatPackageDate(joinerAvailability[pkg.id]?.departureDate || pkg.joinerDate) : 'Date not set'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Users className="h-4 w-4 shrink-0 text-[#8b7355]" />
                            <span>{joinerAvailability[pkg.id] ? (joinerAvailability[pkg.id].bookingOpen ? `${joinerAvailability[pkg.id].remainingSlots} ${joinerAvailability[pkg.id].remainingSlots === 1 ? 'spot' : 'spots'} left` : 'Closed') : 'Slots unavailable'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg bg-[#faf9f6] px-3 py-2.5 text-xs text-[#514b42]">
                          <div className="flex min-w-0 items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0 text-[#8b7355]" />
                            <span className="truncate whitespace-nowrap" title={pkg.duration || 'To be announced'}>{pkg.duration || 'To be announced'}</span>
                          </div>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Users className="h-4 w-4 shrink-0 text-[#8b7355]" />
                            <span>{pkg.maximumCapacity ? `Max ${pkg.maximumCapacity} guests` : 'Flexible group'}</span>
                          </div>
                        </div>
                      )}
                      {getPackageVisualCategory(pkg) === 'joiner' && joinerAvailability[pkg.id]?.scheduleValid !== false && joinerAvailability[pkg.id]?.bookingDeadline && (
                        <p className="mt-2 text-[10px] text-[#8a7f70]">Booking closes {formatPackageDate(joinerAvailability[pkg.id].bookingDeadline)}</p>
                      )}

                      {/* Price & Action */}
                      <div className="mt-4 flex items-end justify-between gap-3 border-t border-[#eeeae3] pt-3">
                        <div>
                          <span
                            className="text-base font-semibold"
                            style={{
                              color: '#1a1a1a',
                            }}
                          >
                            ₱{Number(pkg.price || 0).toLocaleString()}
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
                          className="rounded-md border border-[#514b42] px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-[#37332d] transition-colors hover:bg-[#37332d] hover:text-white"
                          style={{
                            whiteSpace: 'nowrap',
                          }}
                        >
                          View Details
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
