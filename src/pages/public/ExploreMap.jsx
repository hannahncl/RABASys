import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Camera, MapPin, X, ArrowLeft,
  Image as ImageIcon, Send, RefreshCw, Search,
  Link2, VideoOff, Heart,
  Sparkles, Flame, Plus, Grid, List
} from 'lucide-react';
import mapGalleryService from '../../services/mapGalleryService';
import { useNotification } from '../../hooks/useNotification';

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
  { name: 'Cagsawa Ruins', url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800' },
  { name: 'Caramoan Lagoon', url: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800' },
  { name: 'Calaguas Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800' },
  { name: 'Matnog Pink Sand', url: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=800' },
];

const getTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  const diffSec = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};

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
  const { showNotification } = useNotification();

  const [spots, setSpots] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [mapCenter, setMapCenter] = useState([13.4, 123.6]);
  const [mapZoom, setMapZoom] = useState(8.5);
  const [searchQuery, setSearchQuery] = useState('');

  // Gallery filter state
  const [galleryFilterValue, setGalleryFilterValue] = useState('All');
  const [galleryView, setGalleryView] = useState('grid'); // 'grid' | 'list'

  // Story Viewer state
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [touristName, setTouristName] = useState('');
  const [caption, setCaption] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [selectedPresetImage, setSelectedPresetImage] = useState(PRESET_UPLOAD_IMAGES[0].url);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [targetSpotId, setTargetSpotId] = useState('spot-mayon');

  // Upload tab state: 'file' | 'camera' | 'gallery' | 'url'
  const [uploadTab, setUploadTab] = useState('file');
  const [deviceFile, setDeviceFile] = useState(null);
  const [deviceFilePreview, setDeviceFilePreview] = useState('');

  // Handle device file upload (phone / computer gallery)
  const handleDeviceFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Image file size must be less than 8MB.');
      return;
    }
    setUploadError('');
    setDeviceFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setDeviceFilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Camera state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [facingMode] = useState('environment');

  // Start camera stream
  const startCamera = useCallback(async () => {
    setCameraError('');
    setCapturedPhoto(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission was denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Could not access camera. Try Gallery or URL instead.');
      }
      setCameraActive(false);
    }
  }, [facingMode]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Snap photo
  const snapPhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (uploadModalOpen && uploadTab === 'camera' && !capturedPhoto) {
      startCamera();
    } else if (uploadTab !== 'camera') {
      stopCamera();
    }
    return () => {
      if (uploadTab !== 'camera') stopCamera();
    };
  }, [uploadModalOpen, uploadTab, facingMode, startCamera, stopCamera, capturedPhoto]);

  useEffect(() => {
    if (!uploadModalOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setCameraError('');
    }
  }, [uploadModalOpen, stopCamera]);

  // Initial load
  useEffect(() => {
    const initData = async () => {
      const spotList = await mapGalleryService.getSpots();
      setSpots(spotList);

      const allStoryUploads = await mapGalleryService.getAllUploads();
      setUploads(allStoryUploads);
    };
    initData();
  }, []);

  // When spot changes
  useEffect(() => {
    const loadSpotUploads = async () => {
      if (selectedSpot) {
        const spotPhotos = await mapGalleryService.getUploads(selectedSpot.id);
        setUploads(spotPhotos);
        setTargetSpotId(selectedSpot.id);
      } else {
        const all = await mapGalleryService.getAllUploads();
        setUploads(all);
      }
    };
    loadSpotUploads();
  }, [selectedSpot]);

  // Auto-progress timer for Story Viewer
  useEffect(() => {
    let timer;
    if (storyViewerOpen && uploads.length > 0) {
      setStoryProgress(0);
      const interval = 50;
      const totalTime = 5000;
      timer = setInterval(() => {
        setStoryProgress(prev => {
          if (prev >= 100) {
            if (activeStoryIndex < uploads.length - 1) {
              setActiveStoryIndex(idx => idx + 1);
              return 0;
            } else {
              setStoryViewerOpen(false);
              return 0;
            }
          }
          return prev + (interval / totalTime) * 100;
        });
      }, interval);
    }
    return () => clearInterval(timer);
  }, [storyViewerOpen, activeStoryIndex, uploads.length]);

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
    setGalleryFilterValue(spot.name.split(',')[0]);
    setMapCenter(spot.coords);
    setMapZoom(11);
  };

  const handleBackToAll = () => {
    setSelectedSpot(null);
    setGalleryFilterValue('All');
    setMapCenter([13.4, 123.6]);
    setMapZoom(8.5);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!touristName.trim()) { setUploadError('Please enter your name.'); return; }
    if (!caption.trim()) { setUploadError('Please add a caption.'); return; }
    setUploading(true);
    setUploadError('');

    let finalImageUrl;
    if (uploadTab === 'file' && deviceFilePreview) {
      finalImageUrl = deviceFilePreview;
    } else if (uploadTab === 'camera' && capturedPhoto) {
      finalImageUrl = capturedPhoto;
    } else if (uploadTab === 'url' && customImageUrl.trim()) {
      finalImageUrl = customImageUrl.trim();
    } else {
      finalImageUrl = selectedPresetImage;
    }

    if (!finalImageUrl) {
      setUploadError('Please choose or snap a photo file first.');
      setUploading(false);
      return;
    }

    try {
      const activeSpotId = selectedSpot ? selectedSpot.id : targetSpotId;
      const newUpload = await mapGalleryService.uploadPhoto(activeSpotId, touristName, caption, finalImageUrl);

      setUploads(prev => [newUpload, ...prev]);

      showNotification('Your photo was uploaded successfully!', 'success');

      setTouristName('');
      setCaption('');
      setCustomImageUrl('');
      setCapturedPhoto(null);
      setDeviceFile(null);
      setDeviceFilePreview('');
      setUploadModalOpen(false);
      setUploadTab('file');
    } catch {
      setUploadError('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (e, uploadId) => {
    e.stopPropagation();
    const updated = await mapGalleryService.likeUpload(uploadId);
    if (updated) {
      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, isLiked: updated.isLiked, likesCount: updated.likesCount } : u));
    }
  };

  const openStoryViewer = (index = 0) => {
    setActiveStoryIndex(index);
    setStoryProgress(0);
    setStoryViewerOpen(true);
  };

  const getMarkerIcon = (spot) => {
    const isSelected = selectedSpot?.id === spot.id;
    return L.divIcon({
      className: 'custom-marker-wrapper',
      html: `
        <div class="relative flex flex-col items-center group cursor-pointer">
          <div class="p-[2px] rounded-full bg-stone-900 shadow-md transition-transform group-hover:scale-110 ${isSelected ? 'ring-4 ring-amber-400' : ''}">
            <div class="w-9 h-9 rounded-full overflow-hidden border-2 border-white bg-stone-900">
              <img src="${spot.featuredImage}" class="w-full h-full object-cover" />
            </div>
          </div>
          <div class="mt-1 bg-white/95 backdrop-blur-sm border border-stone-200 text-stone-800 text-[10px] font-bold py-0.5 px-2.5 rounded-full whitespace-nowrap shadow-sm pointer-events-none flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            ${spot.name.split(',')[0]}
          </div>
        </div>
      `,
      iconSize: [40, 50],
      iconAnchor: [20, 25],
    });
  };

  const filteredSpots = spots.filter(spot =>
    spot.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Derive gallery filter options
  const galleryDestinationOptions = ['All', ...spots.map(s => s.name.split(',')[0])];

  // Filtered uploads for gallery
  const galleryUploads = uploads.filter(up => {
    if (galleryFilterValue === 'All') return true;
    const spot = spots.find(s => s.id === up.spotId);
    return spot?.name.split(',')[0] === galleryFilterValue;
  });

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', paddingBottom: '7rem', paddingTop: '2.5rem', fontFamily: "'Inter', 'Outfit', Georgia, serif" }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #d6cfc2', paddingBottom: '1.5rem', marginBottom: '2rem', gap: '1rem' }}>
          <div>
            <h1 className="text-2xl text-slate-400 tracking-widest uppercase mb-1">
              EXPLORE MAP &amp; TOURIST GALLERY
            </h1>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', border: '1px solid #2d2a24', borderRadius: '2px', background: '#2d2a24', color: '#f7f4ef', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2d2a24'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2d2a24'; e.currentTarget.style.color = '#f7f4ef'; }}
          >
            <Camera style={{ width: '0.875rem', height: '0.875rem' }} />
            + Share Story
          </button>
        </div>



        {/* ── Side-by-Side Flex Layout ── */}
        <div style={{ display: 'flex', gap: '3rem' }} className="flex-col lg:flex-row">

          {/* ── LEFT COLUMN: Photo Gallery & Filters (55% width) ── */}
          <div style={{ flex: '1 1 55%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Gallery Header Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1a1a', fontFamily: "'Outfit', Georgia, serif", letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Grid style={{ width: '1rem', height: '1rem', color: '#6b6255' }} />
                  {selectedSpot ? `${selectedSpot.name.split(',')[0]} Photos` : 'Photo Gallery'}
                </h2>
                <p style={{ fontSize: '0.7rem', color: '#6b6255', marginTop: '0.125rem' }}>
                  {galleryUploads.length} photo{galleryUploads.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {selectedSpot && (
                  <button
                    onClick={handleBackToAll}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.875rem', border: '1px solid #b0a68e', borderRadius: '2px', background: 'rgba(196,185,154,0.12)', color: '#3d3a34', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    <ArrowLeft style={{ width: '0.75rem', height: '0.75rem' }} /> All Spots
                  </button>
                )}
                <button
                  onClick={() => setGalleryView(v => v === 'grid' ? 'list' : 'grid')}
                  style={{ padding: '0.4rem', border: '1px solid #e0dbd0', borderRadius: '4px', background: 'rgba(255,255,255,0.7)', color: '#6b6255', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title={galleryView === 'grid' ? 'List view' : 'Grid view'}
                >
                  {galleryView === 'grid' ? <List style={{ width: '0.875rem', height: '0.875rem' }} /> : <Grid style={{ width: '0.875rem', height: '0.875rem' }} />}
                </button>
              </div>
            </div>

            {/* Filter Controls container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#fcfbf9', border: '1px solid #e0dbd0', borderRadius: '6px', padding: '1rem' }}>

              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', width: '0.875rem', height: '0.875rem', color: '#b0a68e' }} />
                <input
                  type="text"
                  placeholder="Search destinations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', border: '1px solid #d6cfc2', borderRadius: '4px', background: '#ffffff', color: '#1a1a1a', fontSize: '0.8rem', fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#b0a68e'; e.target.style.boxShadow = '0 0 0 3px rgba(176,166,142,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = '#d6cfc2'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Destination filter chips */}
              <div style={{ display: 'flex', gap: '0.375rem', overflowX: 'auto', paddingBottom: '0.25rem', flexWrap: 'nowrap' }}>
                {galleryDestinationOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => setGalleryFilterValue(opt)}
                    style={{
                      flexShrink: 0, padding: '0.375rem 0.875rem', borderRadius: '2px', fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                      border: galleryFilterValue === opt ? '1px solid #b0a68e' : '1px solid #e0dbd0',
                      background: galleryFilterValue === opt ? 'rgba(196,185,154,0.15)' : 'rgba(255,255,255,0.7)',
                      color: galleryFilterValue === opt ? '#2d2a24' : '#45403a',
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Gallery Grid/List content wrapper */}
            <div style={{ maxHeight: '640px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {galleryUploads.length === 0 ? (
                <div style={{ padding: '4rem 1.5rem', textAlign: 'center', border: '1px solid #e0dbd0', borderRadius: '6px', background: 'rgba(255,255,255,0.6)' }}>
                  <ImageIcon style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem', color: '#c4b99a', opacity: 0.6 }} />
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#3d3a34', fontFamily: "'Outfit', Georgia, serif", letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>No Photos Found</h3>
                  <p style={{ fontSize: '0.75rem', color: '#4a453b', marginBottom: '1rem' }}>Try changing your filters or search query.</p>
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    style={{ padding: '0.5rem 1.25rem', border: '1px solid #2d2a24', borderRadius: '2px', background: '#2d2a24', color: '#f7f4ef', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Be the First to Share
                  </button>
                </div>
              ) : galleryView === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                  {galleryUploads.map(up => {
                    const spot = spots.find(s => s.id === up.spotId);
                    const uploadsIdx = uploads.findIndex(u => u.id === up.id);
                    return (
                      <div
                        key={up.id}
                        onClick={() => openStoryViewer(uploadsIdx >= 0 ? uploadsIdx : 0)}
                        className="group"
                        style={{ position: 'relative', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #e0dbd0', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', transition: 'box-shadow 0.3s, transform 0.5s' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <div style={{ height: '220px', overflow: 'hidden', background: '#ebe7df' }}>
                          <img src={up.imageUrl} alt={up.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s' }} className="group-hover:scale-105" />
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4rem', background: 'linear-gradient(to top, rgba(0,0,0,0.06), transparent)', pointerEvents: 'none' }} />

                        {/* Card Info */}
                        <div style={{ padding: '0.75rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                          <p style={{ fontSize: '0.7rem', fontWeight: 500, color: '#2d2a24', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {up.caption}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginTop: '0.25rem' }}>
                            <span style={{ fontSize: '0.625rem', color: '#6b6255', fontWeight: 500 }}>{up.touristName}</span>
                            <button
                              onClick={e => handleLike(e, up.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.625rem', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: up.isLiked ? '#3d3a34' : '#b0a68e', transition: 'color 0.2s' }}
                            >
                              <Heart style={{ width: '0.7rem', height: '0.7rem', fill: up.isLiked ? '#3d3a34' : 'none' }} />{up.likesCount || 0}
                            </button>
                          </div>
                          <div style={{ height: '1px', background: '#eae5db', margin: '0.125rem 0' }} />
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {spot && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6rem', fontWeight: 600, color: '#6b6255' }}>
                                <MapPin style={{ width: '0.55rem', height: '0.55rem', color: '#b0a68e' }} />{spot.name.split(',')[0]}
                              </span>
                            )}
                            <span style={{ fontSize: '0.575rem', color: '#b0a68e' }}>{getTimeAgo(up.date)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {galleryUploads.map(up => {
                    const spot = spots.find(s => s.id === up.spotId);
                    const uploadsIdx = uploads.findIndex(u => u.id === up.id);
                    return (
                      <div
                        key={up.id}
                        onClick={() => openStoryViewer(uploadsIdx >= 0 ? uploadsIdx : 0)}
                        style={{ display: 'flex', gap: '0.875rem', background: '#ffffff', border: '1px solid #e0dbd0', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.3s, transform 0.3s', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        className="group"
                      >
                        <div style={{ position: 'relative', width: '7rem', height: '6rem', flexShrink: 0, overflow: 'hidden', background: '#ebe7df' }}>
                          <img src={up.imageUrl} alt={up.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} className="group-hover:scale-105" />
                        </div>
                        <div style={{ flex: 1, padding: '0.75rem 0.875rem 0.75rem 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, gap: '0.375rem' }}>
                          <p style={{ fontSize: '0.75rem', color: '#2d2a24', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            <span style={{ fontWeight: 700 }}>{up.touristName}: </span>{up.caption}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {spot && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.625rem', fontWeight: 600, color: '#6b6255' }}>
                                <MapPin style={{ width: '0.55rem', height: '0.55rem', color: '#b0a68e' }} />{spot.name.split(',')[0]}
                              </span>
                            )}
                            <span style={{ fontSize: '0.6rem', color: '#b0a68e' }}>{getTimeAgo(up.date)}</span>
                            <button
                              onClick={e => handleLike(e, up.id)}
                              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.625rem', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: up.isLiked ? '#3d3a34' : '#b0a68e' }}
                            >
                              <Heart style={{ width: '0.7rem', height: '0.7rem', fill: up.isLiked ? '#3d3a34' : 'none' }} />{up.likesCount || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Map & Destinations (45% width) ── */}
          <div style={{ flex: '1 1 45%', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '2rem' }}>

            {/* Destinations Map Header */}
            <div>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a1a', fontFamily: "'Outfit', Georgia, serif", letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <MapPin style={{ width: '0.95rem', height: '0.95rem', color: '#b0a68e' }} /> Interactive Map Guide
              </h3>
              <p style={{ fontSize: '0.65rem', color: '#6b6255', marginTop: '0.125rem' }}>
                Select a marker on the map to filter stories from that destination
              </p>
            </div>

            {/* Map Container */}
            <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #e0dbd0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', height: '460px', position: 'relative', zIndex: 0 }}>
              <MapContainer center={mapCenter} zoom={mapZoom} className="w-full h-full" zoomControl={true}>
                <TileLayer
                  attribution='&copy; Esri &mdash; Source: Esri, USGS, NOAA'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />
                <MapFocusController center={mapCenter} zoom={mapZoom} />
                <MapEventsController onMapClick={() => { }} />
                {filteredSpots.map(spot => (
                  <Marker key={spot.id} position={spot.coords} icon={getMarkerIcon(spot)} eventHandlers={{ click: () => handleSpotClick(spot) }}>
                    <Popup className="custom-spot-popup">
                      <div style={{ padding: '0.375rem', maxWidth: '230px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <img src={spot.featuredImage} alt={spot.name} style={{ width: '100%', height: '5.5rem', objectFit: 'cover', borderRadius: '4px' }} />
                        <div>
                          <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#855912', background: '#fef9c3', padding: '0.15rem 0.5rem', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {spot.category}
                          </span>
                          <h4 style={{ fontWeight: 700, fontSize: '0.75rem', color: '#1a1a1a', marginTop: '0.25rem', lineHeight: 1.2 }}>{spot.name}</h4>
                        </div>
                        <p style={{ fontSize: '0.65rem', color: '#4a453b', lineHeight: 1.3 }}>{spot.description}</p>
                        {spot.travelTips && (
                          <div style={{ fontSize: '0.6rem', background: '#f8f6f0', borderLeft: '2px solid #b0a68e', padding: '0.25rem 0.5rem', color: '#3d3a34' }}>
                            <strong>Tip:</strong> {spot.travelTips}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.375rem', paddingTop: '0.25rem' }}>
                          <button
                            onClick={() => handleSpotClick(spot)}
                            style={{ flex: 1, padding: '0.4rem', background: '#2d2a24', color: '#f7f4ef', fontWeight: 700, fontSize: '0.6rem', borderRadius: '2px', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}
                          >
                            View Photos
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Selected Spot Informative Guide Spotlight */}
            {selectedSpot && (
              <div style={{ background: '#fcfbf9', border: '1px solid #b0a68e', borderRadius: '6px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#855912', background: '#fef9c3', border: '1px solid #fef08a', padding: '0.15rem 0.5rem', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {selectedSpot.category} Spotlight
                  </span>
                  <button onClick={handleBackToAll} style={{ fontSize: '0.6rem', color: '#6b6255', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Reset Spot
                  </button>
                </div>

                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1a1a1a', fontFamily: "'Outfit', Georgia, serif" }}>
                  {selectedSpot.name}
                </h3>

                <p style={{ fontSize: '0.725rem', color: '#4a453b', lineHeight: 1.4 }}>
                  {selectedSpot.description}
                </p>

                {selectedSpot.bestSeason && (
                  <div style={{ fontSize: '0.65rem', color: '#3d3a34', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <strong>Best Time to Visit:</strong> <span>{selectedSpot.bestSeason}</span>
                  </div>
                )}

                {selectedSpot.activities && selectedSpot.activities.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                    {selectedSpot.activities.map((act, i) => (
                      <span key={i} style={{ fontSize: '0.575rem', fontWeight: 600, color: '#45403a', background: '#f0ece1', border: '1px solid #e0dbd0', padding: '0.15rem 0.4rem', borderRadius: '2px' }}>
                        {act}
                      </span>
                    ))}
                  </div>
                )}

                {selectedSpot.travelTips && (
                  <div style={{ fontSize: '0.65rem', background: 'rgba(196,185,154,0.12)', borderLeft: '3px solid #b0a68e', padding: '0.5rem', borderRadius: '2px', color: '#2d2a24', lineHeight: 1.35 }}>
                    <strong>Pro Travel Tip:</strong> {selectedSpot.travelTips}
                  </div>
                )}
              </div>
            )}

            {/* Map Legend / Destination Chip Selection */}
            <div>
              <h4 style={{ fontSize: '0.6rem', fontWeight: 600, color: '#4a453b', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Bicol Destinations
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                {filteredSpots.map(spot => {
                  const isActive = selectedSpot?.id === spot.id;
                  return (
                    <button
                      key={spot.id}
                      onClick={() => handleSpotClick(spot)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.875rem', borderRadius: '2px', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase',
                        border: isActive ? '1px solid #b0a68e' : '1px solid #e0dbd0',
                        background: isActive ? 'rgba(196,185,154,0.15)' : 'rgba(255,255,255,0.6)',
                        color: isActive ? '#2d2a24' : '#45403a',
                      }}
                    >
                      <MapPin style={{ width: '0.6rem', height: '0.6rem', color: '#b0a68e' }} />
                      {spot.name.split(',')[0]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STORY VIEWER MODAL ── */}
      {storyViewerOpen && uploads.length > 0 && uploads[activeStoryIndex] && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(29,26,20,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(6px)' }}
          onClick={() => setStoryViewerOpen(false)}
        >
          <button
            onClick={() => setStoryViewerOpen(false)}
            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', padding: '0.5rem', color: 'rgba(247,244,239,0.7)', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', cursor: 'pointer', zIndex: 50 }}
          >
            <X style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
          <div
            style={{ position: 'relative', width: '100%', maxWidth: '26rem', height: '80vh', maxHeight: '44rem', background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Progress bars */}
            <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', right: '0.75rem', zIndex: 30, display: 'flex', gap: '0.25rem' }}>
              {uploads.map((_, i) => (
                <div key={i} style={{ height: '2px', flex: 1, background: 'rgba(247,244,239,0.25)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#f7f4ef', transition: 'width 0.05s linear', width: i === activeStoryIndex ? `${storyProgress}%` : i < activeStoryIndex ? '100%' : '0%' }} />
                </div>
              ))}
            </div>
            {/* Header */}
            <div style={{ position: 'absolute', top: '1.5rem', left: '1rem', right: '1rem', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <img src={uploads[activeStoryIndex].avatar} alt={uploads[activeStoryIndex].touristName} style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #c4b99a' }} />
                <div>
                  <h4 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#f7f4ef', lineHeight: 1.2 }}>{uploads[activeStoryIndex].touristName}</h4>
                  <span style={{ fontSize: '0.6rem', color: 'rgba(247,244,239,0.6)' }}>{getTimeAgo(uploads[activeStoryIndex].date)}</span>
                </div>
              </div>
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#f7f4ef', background: 'rgba(29,26,20,0.6)', border: '1px solid rgba(196,185,154,0.3)', padding: '0.25rem 0.625rem', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '0.25rem', backdropFilter: 'blur(4px)' }}>
                <MapPin style={{ width: '0.625rem', height: '0.625rem', color: '#c4b99a' }} />
                {spots.find(s => s.id === uploads[activeStoryIndex].spotId)?.name.split(',')[0] || 'Bicol Spot'}
              </span>
            </div>
            {/* Image & Nav */}
            <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0c0a' }}>
              <img src={uploads[activeStoryIndex].imageUrl} alt={uploads[activeStoryIndex].caption} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <div onClick={() => { if (activeStoryIndex > 0) setActiveStoryIndex(i => i - 1); }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '33%', cursor: 'pointer' }} />
              <div onClick={() => { if (activeStoryIndex < uploads.length - 1) setActiveStoryIndex(i => i + 1); else setStoryViewerOpen(false); }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '67%', cursor: 'pointer' }} />
            </div>
            {/* Caption & Actions */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'linear-gradient(to top, rgba(10,9,7,0.92) 0%, rgba(10,9,7,0.5) 60%, transparent 100%)', zIndex: 30 }}>
              <p style={{ fontSize: '0.7rem', color: '#f7f4ef', lineHeight: 1.5, marginBottom: '0.75rem' }}>{uploads[activeStoryIndex].caption}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  onClick={e => handleLike(e, uploads[activeStoryIndex].id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.7rem', fontWeight: 700, background: 'none', border: 'none', color: '#f7f4ef', cursor: 'pointer' }}
                >
                  <Heart style={{ width: '1.125rem', height: '1.125rem', fill: uploads[activeStoryIndex].isLiked ? '#f7f4ef' : 'none' }} />
                  {uploads[activeStoryIndex].likesCount || 0} Likes
                </button>
                <span style={{ fontSize: '0.6rem', color: 'rgba(247,244,239,0.5)', letterSpacing: '0.04em' }}>
                  {activeStoryIndex + 1} of {uploads.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── UPLOAD MODAL ── */}
      {uploadModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(29,26,20,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: '28rem', background: '#ffffff', borderRadius: '6px', boxShadow: '0 24px 60px rgba(0,0,0,0.14)', overflow: 'hidden', border: '1px solid #e0dbd0' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #eae5db' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1a1a1a', fontFamily: "'Outfit', Georgia, serif", letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera style={{ width: '1rem', height: '1rem', color: '#6b6255' }} /> Share a Story
              </h3>
              <button onClick={() => setUploadModalOpen(false)} style={{ padding: '0.375rem', background: 'rgba(214,207,194,0.2)', border: '1px solid #e0dbd0', borderRadius: '4px', cursor: 'pointer', color: '#6b6255' }}>
                <X style={{ width: '0.875rem', height: '0.875rem' }} />
              </button>
            </div>

            {uploadError && (
              <div style={{ margin: '0.75rem 1.5rem', padding: '0.75rem 1rem', background: '#fdf2f2', border: '1px solid #e0c0c0', borderRadius: '4px', fontSize: '0.7rem', color: '#7a3636', fontWeight: 600 }}>
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Destination */}
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#4a453b', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Destination Spot</label>
                <select
                  value={selectedSpot ? selectedSpot.id : targetSpotId}
                  onChange={e => setTargetSpotId(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.8)', border: '1px solid #d6cfc2', borderRadius: '4px', padding: '0.625rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, color: '#1a1a1a', outline: 'none', fontFamily: "'Inter', sans-serif" }}
                >
                  {spots.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#4a453b', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Your Name</label>
                <input
                  type="text" value={touristName} onChange={e => setTouristName(e.target.value)} placeholder="e.g. Alex Santos"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.8)', border: '1px solid #d6cfc2', borderRadius: '4px', padding: '0.625rem 0.75rem', fontSize: '0.75rem', color: '#1a1a1a', outline: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#b0a68e'; e.target.style.boxShadow = '0 0 0 3px rgba(176,166,142,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#d6cfc2'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Caption */}
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#4a453b', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>Story Caption</label>
                <textarea
                  rows={2} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Share your experience..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.8)', border: '1px solid #d6cfc2', borderRadius: '4px', padding: '0.625rem 0.75rem', fontSize: '0.75rem', color: '#1a1a1a', outline: 'none', resize: 'none', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#b0a68e'; e.target.style.boxShadow = '0 0 0 3px rgba(176,166,142,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#d6cfc2'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Source Tabs */}
              <div>
                <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#4a453b', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Photo Source</label>
                <div style={{ display: 'flex', gap: '0.25rem', background: '#f5f2ee', borderRadius: '4px', padding: '0.25rem' }}>
                  {[{ id: 'file', label: 'Device File', icon: ImageIcon }, { id: 'camera', label: 'Camera', icon: Camera }, { id: 'url', label: 'URL', icon: Link2 }].map(tab => (
                    <button
                      key={tab.id} type="button" onClick={() => setUploadTab(tab.id)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.5rem', borderRadius: '3px', border: 'none', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: uploadTab === tab.id ? '#ffffff' : 'transparent', color: uploadTab === tab.id ? '#1a1a1a' : '#6b6255', boxShadow: uploadTab === tab.id ? '0 1px 4px rgba(0,0,0,0.07)' : 'none' }}
                    >
                      <tab.icon style={{ width: '0.75rem', height: '0.75rem' }} />{tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab content */}
              <div style={{ minHeight: '10rem' }}>
                {uploadTab === 'file' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', border: '1.5px dashed #b0a68e', borderRadius: '6px', background: '#fcfbf9', cursor: 'pointer', textAlign: 'center' }}>
                      <ImageIcon style={{ width: '2rem', height: '2rem', color: '#b0a68e', marginBottom: '0.5rem' }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#2d2a24' }}>Click to Choose Photo File from Device</span>
                      <span style={{ fontSize: '0.625rem', color: '#6b6255', marginTop: '0.25rem' }}>Supports JPG, PNG, WEBP (Up to 8MB)</span>
                      <input type="file" accept="image/*" onChange={handleDeviceFileChange} style={{ display: 'none' }} />
                    </label>
                    {deviceFilePreview && (
                      <div style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #e0dbd0', height: '10rem' }}>
                        <img src={deviceFilePreview} alt="Device File Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                )}

                {uploadTab === 'camera' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {cameraError ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: '#f5f2ee', border: '1px solid #e0dbd0', borderRadius: '6px' }}>
                        <VideoOff style={{ width: '1.75rem', height: '1.75rem', color: '#b0a68e', marginBottom: '0.5rem' }} />
                        <p style={{ fontSize: '0.7rem', color: '#4a453b', textAlign: 'center', marginBottom: '0.5rem', fontWeight: 600 }}>{cameraError}</p>
                        <button type="button" onClick={() => setUploadTab('file')} style={{ fontSize: '0.65rem', fontWeight: 600, color: '#3d3a34', background: 'rgba(196,185,154,0.15)', border: '1px solid #b0a68e', padding: '0.375rem 0.875rem', borderRadius: '2px', cursor: 'pointer' }}>Switch to Device File Upload</button>
                      </div>
                    ) : capturedPhoto ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <img src={capturedPhoto} alt="Captured" style={{ width: '100%', height: '11rem', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e0dbd0' }} />
                        <button type="button" onClick={() => { setCapturedPhoto(null); startCamera(); }} style={{ width: '100%', padding: '0.5rem', background: '#f5f2ee', border: '1px solid #e0dbd0', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, color: '#3d3a34', cursor: 'pointer' }}>Retake Photo</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ borderRadius: '4px', overflow: 'hidden', background: '#0d0c0a', height: '11rem', border: '1px solid #e0dbd0' }}>
                          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <button type="button" onClick={snapPhoto} disabled={!cameraActive} style={{ width: '100%', padding: '0.625rem', background: '#2d2a24', color: '#f7f4ef', border: 'none', borderRadius: '2px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: cameraActive ? 'pointer' : 'not-allowed', opacity: cameraActive ? 1 : 0.5 }}>
                          Snap Photo
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {uploadTab === 'gallery' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    {PRESET_UPLOAD_IMAGES.map(img => (
                      <button type="button" key={img.name} onClick={() => setSelectedPresetImage(img.url)}
                        style={{ aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', border: selectedPresetImage === img.url ? '2px solid #b0a68e' : '1px solid #e0dbd0', opacity: selectedPresetImage === img.url ? 1 : 0.65, cursor: 'pointer', background: 'none', padding: 0, transition: 'all 0.2s', transform: selectedPresetImage === img.url ? 'scale(1.04)' : 'scale(1)' }}
                      >
                        <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}

                {uploadTab === 'url' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input
                      type="url" placeholder="https://..." value={customImageUrl} onChange={e => setCustomImageUrl(e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.8)', border: '1px solid #d6cfc2', borderRadius: '4px', padding: '0.625rem 0.75rem', fontSize: '0.75rem', color: '#1a1a1a', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => { e.target.style.borderColor = '#b0a68e'; }}
                      onBlur={e => { e.target.style.borderColor = '#d6cfc2'; }}
                    />
                    {customImageUrl.trim() && (
                      <div style={{ borderRadius: '4px', overflow: 'hidden', border: '1px solid #e0dbd0' }}>
                        <img src={customImageUrl} alt="Preview" style={{ width: '100%', height: '9rem', objectFit: 'cover' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
                <button type="button" onClick={() => setUploadModalOpen(false)}
                  style={{ flex: 1, padding: '0.75rem', background: 'rgba(255,255,255,0.6)', border: '1px solid #e0dbd0', borderRadius: '2px', fontSize: '0.65rem', fontWeight: 600, color: '#4a453b', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={uploading}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', padding: '0.75rem', background: '#2d2a24', color: '#f7f4ef', border: '1px solid #2d2a24', borderRadius: '2px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.65 : 1 }}
                >
                  {uploading ? <><RefreshCw style={{ width: '0.875rem', height: '0.875rem' }} className="animate-spin" /> Posting...</> : <><Send style={{ width: '0.875rem', height: '0.875rem' }} /> Share Story</>}
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
