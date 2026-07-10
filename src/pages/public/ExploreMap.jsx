import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Camera, MapPin, X, CloudSun, Wind, ArrowLeft,
  Droplets, Image as ImageIcon, Send, Upload, RefreshCw, Search, ZoomIn
} from 'lucide-react';
import mapGalleryService from '../../services/mapGalleryService';
import { weatherService } from '../../services/weatherService';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const PRESET_UPLOAD_IMAGES = [
  { name: 'Sunset Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800' },
  { name: 'Crystal Lagoon', url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800' },
  { name: 'Surfer Waves', url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800' },
  { name: 'Mountain Overlook', url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800' },
];

const MapFocusController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom, { animate: true, duration: 1.0 });
  }, [center, zoom, map]);
  return null;
};

const MapEventsController = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      if (e.originalEvent.target.classList.contains('leaflet-container')) onMapClick();
    }
  });
  return null;
};

const ExploreMap = () => {
  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [mapCenter, setMapCenter] = useState([13.4, 123.6]);
  const [mapZoom, setMapZoom] = useState(8.5);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  const [searchQuery, setSearchQuery] = useState('');

  // Left panel mode: 'grid' (spots overview) or 'photos' (spot's photo album)
  const [leftPanelMode, setLeftPanelMode] = useState('grid');

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [touristName, setTouristName] = useState('');
  const [caption, setCaption] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [selectedPresetImage, setSelectedPresetImage] = useState(PRESET_UPLOAD_IMAGES[0].url);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    const fetchSpots = async () => {
      const data = await mapGalleryService.getSpots();
      setSpots(data);
      const cats = ['All', ...new Set(data.map(s => s.category))];
      setCategories(cats);
    };
    fetchSpots();
  }, []);

  // When a spot is selected, load its photos and weather
  useEffect(() => {
    if (selectedSpot) {
      const loadDetails = async () => {
        const gallery = await mapGalleryService.getUploads(selectedSpot.id);
        setUploads(gallery);
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
      setLeftPanelMode('photos'); // Switch left panel to photo album view
    } else {
      setUploads([]);
      setWeather(null);
      setLeftPanelMode('grid');
    }
  }, [selectedSpot]);

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
    setMapCenter(spot.coords);
    setMapZoom(11);
    setLightboxIndex(null);
  };

  const handleBackToGrid = () => {
    setSelectedSpot(null);
    setLeftPanelMode('grid');
    setMapCenter([13.4, 123.6]);
    setMapZoom(8.5);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!touristName.trim()) { setUploadError('Please enter your name.'); return; }
    if (!caption.trim()) { setUploadError('Please add a caption.'); return; }
    setUploading(true);
    setUploadError('');
    const finalImageUrl = customImageUrl.trim() || selectedPresetImage;
    try {
      const newUpload = await mapGalleryService.uploadPhoto(selectedSpot.id, touristName, caption, finalImageUrl);
      setUploads(prev => [newUpload, ...prev]);
      setTouristName('');
      setCaption('');
      setCustomImageUrl('');
      setUploadModalOpen(false);
    } catch {
      setUploadError('Failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getMarkerIcon = (spot) => {
    const isSelected = selectedSpot?.id === spot.id;
    return L.divIcon({
      className: 'custom-marker-wrapper',
      html: `
        <div class="relative flex flex-col items-center group cursor-pointer">
          ${isSelected ? `<span class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-yellow-400 opacity-50"></span>` : ''}
          <div class="relative flex items-center justify-center h-9 w-9 rounded-full ${isSelected ? 'border-4 border-yellow-500' : 'border-2 border-white'} shadow-xl overflow-hidden">
            <img src="${spot.featuredImage}" class="w-full h-full object-cover" />
          </div>
          <div class="absolute -bottom-7 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold py-0.5 px-2 rounded-full whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            ${spot.name.split(',')[0]}
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  const filteredSpots = spots.filter(spot => {
    const matchCat = selectedCategory === 'All' || spot.category === selectedCategory;
    const matchSearch = spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Explore</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 font-display">Spot Gallery & Travel Map</h1>
          <p className="text-slate-500 text-sm mt-1">Browse destination spots, explore locations on the map, and share your own travel moments.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

        {/* ── When in GRID mode: show category pills ── */}
        {leftPanelMode === 'grid' && (
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-yellow-500 text-white border-yellow-500 shadow-md'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-yellow-400 hover:text-yellow-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* ── When in PHOTOS mode: show back button header ── */}
        {leftPanelMode === 'photos' && selectedSpot && (
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBackToGrid}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-yellow-600 transition-colors cursor-pointer bg-white border border-slate-200 hover:border-yellow-300 rounded-xl px-4 py-2 shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              All Spots
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-yellow-500 shadow-sm">
                <img src={selectedSpot.featuredImage} alt={selectedSpot.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-800 leading-tight">{selectedSpot.name}</h2>
                <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider">{selectedSpot.category}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Two-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT PANEL ── */}
          <div className="w-full lg:w-5/12 xl:w-5/12">

            {/* ── GRID VIEW: all spots cards ── */}
            {leftPanelMode === 'grid' && (
              <div className="grid grid-cols-2 gap-4">
                {filteredSpots.map(spot => (
                  <div
                    key={spot.id}
                    onClick={() => handleSpotClick(spot)}
                    className="relative group h-52 rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-yellow-400 transition-all duration-200 shadow-sm hover:shadow-xl"
                  >
                    <img
                      src={spot.featuredImage}
                      alt={spot.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-slate-800 text-[11px] font-bold px-2.5 py-1.5 rounded-full shadow-md">
                      <MapPin className="h-3 w-3 text-yellow-500 shrink-0" />
                      <span className="truncate max-w-[100px]">{spot.name.split(',')[0]}</span>
                    </div>
                    <div className="absolute top-3 right-3 bg-yellow-500 text-white text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      {spot.category.split(' ')[0]}
                    </div>
                    {/* Click hint */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1.5">
                        <Camera className="h-3.5 w-3.5" />
                        View Photos
                      </div>
                    </div>
                  </div>
                ))}

                {filteredSpots.length === 0 && (
                  <div className="col-span-2 py-16 text-center text-slate-400">
                    <ImageIcon className="h-10 w-10 mx-auto mb-2 stroke-1" />
                    <p className="text-sm font-medium">No spots found for this category.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── PHOTO ALBUM VIEW: all uploaded photos for selected spot ── */}
            {leftPanelMode === 'photos' && selectedSpot && (
              <div className="space-y-4">
                {/* Spot description card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <p className="text-slate-600 text-sm leading-relaxed">{selectedSpot.description}</p>

                  {/* Weather strip */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <CloudSun className="h-3.5 w-3.5 text-yellow-500" />
                      Live Weather
                    </div>
                    {loadingWeather ? (
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-yellow-500" />
                        Checking conditions...
                      </div>
                    ) : weather ? (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt={weather.description} className="w-9 h-9" />
                          <div>
                            <div className="text-lg font-black text-slate-800">{weather.temp}°C</div>
                            <div className="text-[10px] text-slate-500 capitalize">{weather.description}</div>
                          </div>
                        </div>
                        <div className="space-y-1 border-l border-slate-100 pl-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1"><Droplets className="h-3 w-3 text-yellow-500" /> {weather.humidity}% humidity</div>
                          <div className="flex items-center gap-1"><Wind className="h-3 w-3 text-yellow-500" /> {weather.wind} km/h</div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Weather unavailable.</p>
                    )}
                  </div>
                </div>

                {/* Photo album header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-yellow-500" />
                    Tourist Photos
                    <span className="text-xs font-bold text-slate-400 ml-1">({uploads.length} uploaded)</span>
                  </h3>
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload Photo
                  </button>
                </div>

                {/* Photo grid – 2 columns of all uploaded photos */}
                {uploads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                    <ImageIcon className="h-10 w-10 mb-2 stroke-1" />
                    <p className="text-sm font-semibold text-slate-500 text-center">No photos uploaded yet for this spot.</p>
                    <p className="text-xs text-slate-400 mt-1">Be the first to share your photo!</p>
                    <button
                      onClick={() => setUploadModalOpen(true)}
                      className="mt-4 flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload First Photo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {uploads.map((up, idx) => (
                      <div
                        key={up.id}
                        onClick={() => setLightboxIndex(idx)}
                        className="group relative rounded-2xl overflow-hidden cursor-pointer border border-slate-200 shadow-sm hover:shadow-lg hover:border-yellow-300 transition-all duration-200"
                      >
                        <div className="h-40 w-full overflow-hidden">
                          <img
                            src={up.imageUrl}
                            alt={up.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                          />
                        </div>
                        {/* Zoom hint */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-2">
                            <ZoomIn className="h-4 w-4 text-slate-700" />
                          </div>
                        </div>
                        {/* Caption overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-[11px] text-white font-semibold line-clamp-2 leading-snug">"{up.caption}"</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] font-bold text-yellow-400">{up.touristName}</span>
                            <span className="text-[9px] text-white/60">
                              {new Date(up.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Map Card ── */}
          <div className="w-full lg:w-7/12 xl:w-7/12 lg:sticky lg:top-6">
            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search spots..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 shadow-sm transition-all"
              />
            </div>

            {/* Map Container */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white" style={{ height: '520px' }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="w-full h-full"
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
                <MapFocusController center={mapCenter} zoom={mapZoom} />
                <MapEventsController onMapClick={() => {}} />

                {filteredSpots.map(spot => (
                  <Marker
                    key={spot.id}
                    position={spot.coords}
                    icon={getMarkerIcon(spot)}
                    eventHandlers={{ click: () => handleSpotClick(spot) }}
                  />
                ))}
              </MapContainer>
            </div>

            {/* Map Legend / Spot list chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {filteredSpots.map(spot => (
                <button
                  key={spot.id}
                  onClick={() => handleSpotClick(spot)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                    selectedSpot?.id === spot.id
                      ? 'bg-yellow-500 text-white border-yellow-500 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-yellow-400 hover:text-yellow-600'
                  }`}
                >
                  <MapPin className="h-3 w-3" />
                  {spot.name.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Overlay for uploaded photos */}
      {lightboxIndex !== null && uploads.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative max-w-3xl w-full"
            onClick={e => e.stopPropagation()}
          >
            {/* Prev */}
            <button
              onClick={() => setLightboxIndex(prev => (prev - 1 + uploads.length) % uploads.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 p-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl cursor-pointer transition-colors"
            >
              ‹
            </button>

            {/* Main Photo */}
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={uploads[lightboxIndex].imageUrl}
                alt={uploads[lightboxIndex].caption}
                className="w-full max-h-[70vh] object-contain bg-black"
              />
            </div>

            <div className="mt-4 text-center space-y-1">
              <p className="text-white font-semibold text-sm">"{uploads[lightboxIndex].caption}"</p>
              <div className="flex items-center justify-center gap-3 text-xs">
                <span className="font-bold text-yellow-400">{uploads[lightboxIndex].touristName}</span>
                <span className="text-white/50">•</span>
                <span className="text-white/60">
                  {new Date(uploads[lightboxIndex].date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <p className="text-white/40 text-xs">{lightboxIndex + 1} of {uploads.length} photos</p>
            </div>

            {/* Next */}
            <button
              onClick={() => setLightboxIndex(prev => (prev + 1) % uploads.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 p-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl cursor-pointer transition-colors"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Upload Photo Modal */}
      {uploadModalOpen && selectedSpot && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Camera className="h-5 w-5 text-yellow-500" />
                Upload Photo — {selectedSpot.name.split(',')[0]}
              </h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Maria Santos"
                  value={touristName}
                  onChange={e => setTouristName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Caption / Story</label>
                <textarea
                  placeholder="Share your experience at this spot..."
                  rows="3"
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select a Photo</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PRESET_UPLOAD_IMAGES.map(img => (
                    <button
                      type="button"
                      key={img.name}
                      onClick={() => { setSelectedPresetImage(img.url); setCustomImageUrl(''); }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedPresetImage === img.url && !customImageUrl
                          ? 'border-yellow-500 shadow-md'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <div className="relative flex items-center my-3">
                  <div className="flex-1 border-t border-slate-200" />
                  <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or paste a URL</span>
                  <div className="flex-1 border-t border-slate-200" />
                </div>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customImageUrl}
                  onChange={e => setCustomImageUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" />Uploading...</>
                  ) : (
                    <><Send className="h-4 w-4" />Submit Photo</>
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
