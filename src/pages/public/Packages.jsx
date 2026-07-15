import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { Compass, Search, Star, Heart, Clock, Users, SlidersHorizontal } from 'lucide-react';
import DualRangeSlider from '../../components/ui/DualRangeSlider';

const Packages = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTag, setSelectedTag] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 30000]);
  const [minPrice, setMinPrice] = useState(10);

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
    <div className="bg-white min-h-screen pt-8 pb-24 font-sans text-black">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Sidebar Filters */}
          <div className="w-full lg:w-[240px] flex-shrink-0">
            <h3 className="font-extrabold text-[15px] text-black mb-8 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-black" /> Search Filters
            </h3>
            
            {/* Keyword Search */}
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">Keyword Search</h4>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search..."
                className="w-full bg-white border border-gray-200 rounded-lg py-3 px-4 text-[15px] text-gray-900 focus:outline-none transition-all"
              />
            </div>

            {/* Category */}
            <div className="mb-8">
              <h4 className="text-xs font-extrabold text-black mb-4">Category</h4>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                      selectedTag === tag
                        ? 'bg-yellow-50 border-yellow-250 text-yellow-750 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                        : 'border-slate-150 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Price Range */}
            <div className="mb-8">
              <h4 className="text-xs font-extrabold text-black mb-6">Price range</h4>
              <DualRangeSlider 
                min={0} 
                max={30000} 
                step={500} 
                value={priceRange} 
                onChange={setPriceRange} 
              />
            </div>
          </div>
          
          {/* Main Content Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-3xl h-96 animate-pulse bg-slate-100" />
                ))}
              </div>
            ) : filteredPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPackages.map((pkg, index) => (
                  <div key={pkg.id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.06)] transition-shadow overflow-hidden flex flex-col relative group">
                    
                    {/* Image Area */}
                    <div className="h-[250px] w-full overflow-hidden relative">
                      <img 
                        src={pkg.image} 
                        alt={pkg.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Badge */}
                      <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold text-white ${
                        index % 3 === 0 ? 'bg-green-500' : index % 3 === 1 ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}>
                        {badges[index % 3]}
                      </div>
                      
                      {/* Heart Button */}
                      <button className="absolute top-4 right-4 bg-white/90 rounded-full p-2 shadow-sm hover:bg-white transition-colors">
                        <Heart className="w-3.5 h-3.5 text-black" />
                      </button>
                      
                      {/* Rating Badge at bottom of image */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm text-[10px] font-bold flex items-center gap-1 text-black">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" /> 
                        {pkg.rating} <span className="text-black font-medium ml-0.5">({Math.floor(Math.random() * 500 + 200)} reviews)</span>
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="px-5 pb-5 pt-4 flex-1 flex flex-col">
                      <h3 className="font-extrabold text-black text-lg mb-2 leading-tight">{pkg.title}</h3>
                      
                      <div className="flex items-center gap-4 text-[11px] text-black font-medium mb-5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-black" /> {pkg.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-black" /> 4-6 guest
                        </span>
                      </div>
                      
                      {/* Price & Action */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="text-black">
                          <span className="text-xl font-black">₱{pkg.price.toLocaleString()}</span>
                          <span className="text-[11px] font-medium text-black ml-1">/ person</span>
                        </div>
                        <Link 
                          to={`/packages/${pkg.id}`}
                          className="px-5 py-2 border border-yellow-250 bg-yellow-50 text-yellow-800 rounded-full text-[11px] font-bold hover:bg-yellow-100 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
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
                <Compass className="h-12 w-12 text-black mx-auto mb-4 animate-spin" />
                <h3 className="text-black font-bold mb-2">No Packages Found</h3>
                <p className="text-black text-sm">Try changing your search or filters.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Packages;
