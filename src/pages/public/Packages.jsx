import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { Compass, Search, Star, MapPin, SlidersHorizontal, Sparkles } from 'lucide-react';

const Packages = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTag, setSelectedTag] = useState('All');
  const [maxPrice, setMaxPrice] = useState(30000);
  const [recommendationsMode, setRecommendationsMode] = useState(false);

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
    const matchesPrice = pkg.price <= maxPrice;
    
    // Recommendations recommendation system simulation
    const matchesRecommendation = !recommendationsMode || pkg.rating >= 4.8;

    return matchesSearch && matchesTag && matchesPrice && matchesRecommendation;
  });

  const allTags = ['All', 'Beach', 'Adventure', 'Cultural', 'Nature', 'Premium'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold font-display text-slate-100">Explore Our Tour Packages</h1>
        <p className="text-slate-400 text-sm mt-1">Book your dream vacation. Enjoy custom itineraries, local guides, and secure payments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Filters Panel */}
        <aside className="glass-panel p-6 rounded-2xl border-slate-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-4">
            <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
            <h3 className="font-bold text-slate-200">Search Filters</h3>
          </div>

          {/* Search bar */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Keyword Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="e.g. Palawan, Surigao..."
                className="w-full bg-slate-950 border border-slate-850 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/20 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Smart Recommendation Toggle */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">Smart Recommender</span>
                <span className="text-[10px] text-slate-500">Show highly-rated tours</span>
              </div>
            </div>
            <input 
              type="checkbox"
              checked={recommendationsMode}
              onChange={(e) => setRecommendationsMode(e.target.checked)}
              className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-cyan-500/20 cursor-pointer"
            />
          </div>

          {/* Tags Filter */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Category Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-cyan-500 text-slate-950 border-cyan-500'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-semibold">
              <span className="uppercase tracking-wider">Max Price Budget</span>
              <span className="text-cyan-400 font-bold">PHP {maxPrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="30000"
              step="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>PHP 10k</span>
              <span>PHP 30k</span>
            </div>
          </div>
        </aside>

        {/* Packages List Grid */}
        <div className="lg:col-span-3 space-y-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card rounded-2xl h-96 animate-pulse bg-slate-900/40 border-slate-850" />
              ))}
            </div>
          ) : filteredPackages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredPackages.map((pkg) => (
                <div key={pkg.id} className="glass-card rounded-2xl overflow-hidden flex flex-col group h-full">
                  <div className="h-52 w-full overflow-hidden relative">
                    <img 
                      src={pkg.image} 
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-slate-800 text-cyan-400 text-xs font-semibold">
                      {pkg.duration}
                    </div>
                  </div>

                  <div className="p-6 flex-grow flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                        <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                        {pkg.destination}
                      </span>
                      <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span>{pkg.rating}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors font-display line-clamp-1">
                      {pkg.title}
                    </h3>

                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                      {pkg.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {pkg.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-900 border border-slate-850 text-slate-400 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-900 mt-auto">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">Price per person</span>
                        <span className="text-lg font-extrabold text-slate-100 font-display">PHP {pkg.price.toLocaleString()}</span>
                      </div>
                      <Link 
                        to={`/packages/${pkg.id}`}
                        className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors cursor-pointer"
                      >
                        View Itinerary
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-2xl border-slate-800 space-y-4">
              <Compass className="h-12 w-12 text-slate-500 mx-auto animate-spin" />
              <h4 className="text-lg font-bold text-slate-300 font-display">No Packages Found</h4>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">We couldn't find any tour packages matching your search criteria. Try relaxing your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Packages;
