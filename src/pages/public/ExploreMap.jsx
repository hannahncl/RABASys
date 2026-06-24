import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Camera, MapPin, X, Sun, CloudRain, CloudSun, Wind, 
  Droplets, Image as ImageIcon, Send, Upload, RefreshCw, ZoomIn, Heart 
} from 'lucide-react';
import mapGalleryService from '../../services/mapGalleryService';
import { weatherService } from '../../services/weatherService';

// Fix for default Leaflet marker assets in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Preset photos for easy selection in upload form
const PRESET_UPLOAD_IMAGES = [
  {
    name: 'Sunset Beach',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Crystal Lagoon',
    url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Surfer Waves',
    url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800'
  },
  {
    name: 'Mountain Overlook',
    url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800'
  }
];

// Sub-component to monitor map events (zoom changes and map clicks)
const MapEventsController = ({ onZoomChange, onMapClick }) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
    click: (e) => {
      // Don't close panel if clicking a marker (handled by marker click)
      if (e.originalEvent.target.classList.contains('leaflet-container')) {
        onMapClick();
      }
    }
  });
  return null;
};

// Sub-component to focus the map viewport on selection
const MapFocusController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, {
        animate: true,
        duration: 1.2
      });
    }
  }, [center, zoom, map]);
  return null;
};

const ExploreMap = () => {
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(6);
  const [uploads, setUploads] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [mapCenter, setMapCenter] = useState([13.4, 123.6]); // Centered on Bicol Region
  const [mapZoom, setMapZoom] = useState(8.5);
  
  // Filtering spots by category
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);

  // Photo upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [touristName, setTouristName] = useState('');
  const [caption, setCaption] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [selectedPresetImage, setSelectedPresetImage] = useState(PRESET_UPLOAD_IMAGES[0].url);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Map theme based on user color scheme
  const [tileUrl, setTileUrl] = useState("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png");

  useEffect(() => {
    // Detect system dark mode preference to style map tiles
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTileLayer = (e) => {
      const isDark = e ? e.matches : mediaQuery.matches;
      setTileUrl(
        isDark 
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      );
    };
    
    updateTileLayer();
    mediaQuery.addEventListener('change', updateTileLayer);
    return () => mediaQuery.removeEventListener('change', updateTileLayer);
  }, []);

  // Load spots
  useEffect(() => {
    const fetchSpots = async () => {
      const data = await mapGalleryService.getSpots();
      setSpots(data);
      
      // Extract categories
      const cats = ['All', ...new Set(data.map(s => s.category))];
      setCategories(cats);
    };
    fetchSpots();
  }, []);

  // Fetch photos and weather when a spot is clicked
  useEffect(() => {
    if (selectedSpot) {
      const loadDetails = async () => {
        // Load local gallery uploads
        const gallery = await mapGalleryService.getUploads(selectedSpot.id);
        setUploads(gallery);

        // Load weather
        setLoadingWeather(true);
        setWeather(null);
        try {
          const w = await weatherService.getWeatherByDestination(selectedSpot.name);
          setWeather(w);
        } catch (e) {
          console.error(e);
        } finally {
          setLoadingWeather(false);
        }
      };
      loadDetails();
    } else {
      setUploads([]);
      setWeather(null);
    }
  }, [selectedSpot]);

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
    setMapCenter(spot.coords);
    setMapZoom(11); // Zoom in on click
  };

  const handleClosePanel = () => {
    setSelectedSpot(null);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!touristName.trim()) {
      setUploadError('Please enter your name.');
      return;
    }
    if (!caption.trim()) {
      setUploadError('Please add a short caption or story about your visit.');
      return;
    }

    setUploading(true);
    setUploadError('');
    
    const finalImageUrl = customImageUrl.trim() || selectedPresetImage;

    try {
      const newUpload = await mapGalleryService.uploadPhoto(
        selectedSpot.id,
        touristName,
        caption,
        finalImageUrl
      );

      // Add to list and close
      setUploads(prev => [newUpload, ...prev]);
      setTouristName('');
      setCaption('');
      setCustomImageUrl('');
      setUploadModalOpen(false);
    } catch (err) {
      setUploadError('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Create customized Leaflet divIcon depending on zoom level
  const getMarkerIcon = (spot) => {
    const isZoomedIn = zoomLevel >= 10;
    
    if (isZoomedIn && uploads.length > 0) {
      // Find latest photo upload for this spot
      const latestPhoto = uploads.find(u => u.spotId === spot.id) || { imageUrl: spot.featuredImage };
      return L.divIcon({
        className: 'custom-thumbnail-marker-wrapper',
        html: `
          <div class="relative flex items-center justify-center group">
            <span class="absolute inline-flex h-13 w-13 rounded-full border border-cyan-400 bg-cyan-400/20 animate-pulse"></span>
            <div class="relative h-11 w-11 rounded-full border-2 border-white dark:border-slate-900 shadow-xl overflow-hidden cursor-pointer transform hover:scale-110 transition-transform duration-200">
              <img src="${latestPhoto.imageUrl || spot.featuredImage}" class="w-full h-full object-cover" />
            </div>
            <div class="absolute -top-7 bg-slate-900 border border-slate-800 text-white text-[10px] font-semibold py-0.5 px-2 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
              ${spot.name.split(',')[0]}
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });
    }

    // Default icon: Pulse-animated location marker
    return L.divIcon({
      className: 'custom-pulse-marker-wrapper',
      html: `
        <div class="relative flex items-center justify-center group cursor-pointer">
          <span class="animate-ping absolute inline-flex h-7 w-7 rounded-full bg-cyan-400 opacity-60"></span>
          <div class="relative flex items-center justify-center h-8 w-8 rounded-full bg-slate-950 border border-cyan-400 shadow-lg text-cyan-400 hover:bg-cyan-400 hover:text-slate-950 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div class="absolute -top-7 bg-slate-950 border border-slate-800 text-slate-100 text-[10px] font-semibold py-0.5 px-2 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
            ${spot.name.split(',')[0]}
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };

  const filteredSpots = spots.filter(spot => 
    selectedCategory === 'All' || spot.category.includes(selectedCategory)
  );

  return (
    <div className="relative w-full h-[calc(100vh-80px)] flex flex-col md:flex-row overflow-hidden bg-slate-950">
      
      {/* Category Selection Floating Pill Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 max-w-[90%] md:max-w-2xl">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold border shadow-lg transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-cyan-400 text-slate-950 border-cyan-400 font-bold scale-105'
                : 'bg-slate-900/90 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:text-white backdrop-blur-md'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Map Guidance Tip */}
      {zoomLevel < 10 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-slate-900/90 border border-slate-800/80 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl backdrop-blur-md animate-bounce">
          <ZoomIn className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-medium text-slate-200">
            Zoom in closer to Mayon Volcano or other spots to reveal tourist photos!
          </span>
        </div>
      )}

      {/* Interactive Map Pane */}
      <div className="flex-grow h-full w-full z-0 relative">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          className="w-full h-full"
          zoomControl={false} // Disable to put customized ones or use default style
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={tileUrl}
          />
          
          <MapEventsController 
            onZoomChange={setZoomLevel} 
            onMapClick={handleClosePanel}
          />
          <MapFocusController 
            center={mapCenter} 
            zoom={mapZoom} 
          />

          {filteredSpots.map((spot) => (
            <Marker 
              key={spot.id} 
              position={spot.coords}
              icon={getMarkerIcon(spot)}
              eventHandlers={{
                click: () => handleSpotClick(spot)
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Floating Side Drawer for Selected Pinned Spot */}
      <div 
        className={`absolute top-0 right-0 h-full w-full md:w-[420px] bg-slate-900/95 border-l border-slate-800/50 shadow-2xl backdrop-blur-xl transition-all duration-300 ease-in-out z-20 flex flex-col transform ${
          selectedSpot ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedSpot && (
          <>
            {/* Drawer Image Banner */}
            <div className="relative h-48 w-full shrink-0">
              <img 
                src={selectedSpot.featuredImage} 
                alt={selectedSpot.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/35 to-transparent" />
              
              <button 
                onClick={handleClosePanel}
                className="absolute top-4 right-4 p-2 bg-slate-950/70 border border-slate-800/60 text-slate-400 hover:text-white rounded-xl backdrop-blur-sm transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-cyan-400/90 text-slate-950 px-2 py-0.5 rounded-md">
                  {selectedSpot.category}
                </span>
                <h2 className="text-2xl font-black text-white mt-1 leading-tight">{selectedSpot.name}</h2>
              </div>
            </div>

            {/* Scrollable details panel */}
            <div className="flex-grow overflow-y-auto p-5 space-y-6">
              
              {/* Description */}
              <p className="text-slate-300 text-xs leading-relaxed">
                {selectedSpot.description}
              </p>

              {/* Weather Info widget (uses weatherService) */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <CloudSun className="h-4 w-4 text-cyan-400" />
                  Live Spot Weather
                </h4>
                
                {loadingWeather ? (
                  <div className="flex items-center justify-center py-2 text-slate-500 gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                    <span className="text-xs font-medium">Checking sky updates...</span>
                  </div>
                ) : weather ? (
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="flex items-center gap-3">
                      <img 
                        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                        alt={weather.description}
                        className="w-12 h-12 bg-slate-900 rounded-xl"
                      />
                      <div>
                        <div className="text-2xl font-black text-white">{weather.temp}°C</div>
                        <div className="text-[10px] text-slate-400 capitalize">{weather.description}</div>
                      </div>
                    </div>

                    <div className="space-y-1 text-slate-300 text-xs border-l border-slate-800/80 pl-4">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Droplets className="h-3 w-3 text-cyan-400" />
                        <span>Humidity: <strong>{weather.humidity}%</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Wind className="h-3 w-3 text-cyan-400" />
                        <span>Wind: <strong>{weather.wind} km/h</strong></span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-1">Weather data currently unavailable.</div>
                )}
              </div>

              {/* Photo Upload Prompters */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Camera className="h-4 w-4 text-cyan-400" />
                  Tourist Uploads ({uploads.length})
                </h3>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="flex items-center gap-1.5 bg-cyan-400 text-slate-950 text-xs font-bold py-1.5 px-3.5 rounded-xl hover:bg-cyan-500 transition-all cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Add Photo
                </button>
              </div>

              {/* Gallery List */}
              {uploads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-2xl p-4">
                  <ImageIcon className="h-8 w-8 mb-2 stroke-1 text-slate-600" />
                  <p className="text-xs text-slate-400 text-center font-medium">Be the first to pin a photo from your travels here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {uploads.map((up) => (
                    <div 
                      key={up.id} 
                      className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col h-48"
                    >
                      <div className="relative h-28 w-full overflow-hidden shrink-0">
                        <img 
                          src={up.imageUrl} 
                          alt={up.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      
                      <div className="p-2.5 flex-grow flex flex-col justify-between">
                        <p className="text-[10px] text-slate-300 font-medium line-clamp-2 leading-relaxed">
                          "{up.caption}"
                        </p>
                        
                        <div className="flex items-center justify-between mt-1 text-[9px] text-slate-500 border-t border-slate-900 pt-1.5">
                          <span className="font-semibold text-cyan-400 truncate max-w-[70px]">
                            {up.touristName}
                          </span>
                          <span>
                            {new Date(up.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Picture Upload Modal Box */}
      {uploadModalOpen && selectedSpot && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Camera className="h-5 w-5 text-cyan-400" />
                Upload Photo: {selectedSpot.name.split(',')[0]}
              </h3>
              <button 
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 border border-slate-700/50 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-red-400 text-xs font-semibold">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={touristName}
                  onChange={(e) => setTouristName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Your Story / Caption
                </label>
                <textarea
                  placeholder="Share a short note about this spot..."
                  rows="3"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 transition-colors resize-none"
                />
              </div>

              {/* Preset Image Chooser */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select a Photo
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESET_UPLOAD_IMAGES.map((img) => (
                    <button
                      type="button"
                      key={img.name}
                      onClick={() => {
                        setSelectedPresetImage(img.url);
                        setCustomImageUrl('');
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedPresetImage === img.url && !customImageUrl
                          ? 'border-cyan-400 scale-95 shadow-md'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                
                <div className="relative flex items-center">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-800/80"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase w-full">
                    <span className="bg-slate-900 px-2 text-[10px] text-slate-500 font-extrabold tracking-widest">
                      Or paste a custom image URL
                    </span>
                  </div>
                </div>

                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customImageUrl}
                  onChange={(e) => {
                    setCustomImageUrl(e.target.value);
                  }}
                  className="w-full mt-3 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="flex-grow bg-slate-950 text-slate-300 border border-slate-800 text-xs font-bold py-2.5 rounded-xl hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-grow flex items-center justify-center gap-1.5 bg-cyan-400 text-slate-950 text-xs font-bold py-2.5 rounded-xl hover:bg-cyan-500 transition-all cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Photo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreMap;
