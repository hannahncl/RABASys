import React, { useState } from 'react';
import { Camera, MapPin, X, ArrowLeft, ArrowRight, Eye } from 'lucide-react';

const SPOT_GALLERY_IMAGES = [
  {
    id: 1,
    title: 'Big Lagoon',
    location: 'El Nido, Palawan',
    category: 'Lagoons & Falls',
    imageUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 2,
    title: 'White Beach Station 1',
    location: 'Boracay, Aklan',
    category: 'Beaches',
    imageUrl: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 3,
    title: 'Marlboro Hills',
    location: 'Basco, Batanes',
    category: 'Cliffs & Hills',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 4,
    title: 'Cloud 9 Boardwalk',
    location: 'General Luna, Siargao',
    category: 'Beaches',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 5,
    title: 'Kawasan Falls Canyoneering',
    location: 'Badian, Cebu',
    category: 'Lagoons & Falls',
    imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 6,
    title: 'Chocolate Hills Observation Deck',
    location: 'Carmen, Bohol',
    category: 'Cliffs & Hills',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800' // replacement scenic
  }
];

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const categories = ['All', 'Beaches', 'Lagoons & Falls', 'Cliffs & Hills'];

  const filteredImages = SPOT_GALLERY_IMAGES.filter((img) => 
    selectedCategory === 'All' || img.category === selectedCategory
  );

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev + 1) % filteredImages.length);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev - 1 + filteredImages.length) % filteredImages.length);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Camera className="h-3.5 w-3.5" />
            Photo Gallery
          </div>
          <h1 className="text-4xl font-extrabold font-display text-slate-100">Tourist Spot Gallery</h1>
          <p className="text-slate-400 text-sm mt-1">Explore snapshots of local attractions before visiting.</p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                closeLightbox();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 border-cyan-500'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredImages.map((spot, index) => (
          <div 
            key={spot.id} 
            onClick={() => openLightbox(index)}
            className="group relative h-72 rounded-2xl overflow-hidden border border-slate-900 shadow-xl cursor-pointer"
          >
            <img 
              src={spot.imageUrl} 
              alt={spot.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Hover overlay details */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-60 group-hover:opacity-85 transition-opacity duration-300" />
            
            <div className="absolute inset-0 p-6 flex flex-col justify-end transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-cyan-400 mb-1">{spot.category}</span>
              <h3 className="text-lg font-bold font-display text-white">{spot.title}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-cyan-500" />
                {spot.location}
              </p>
              
              {/* Eye Zoom icon */}
              <div className="absolute top-6 right-6 h-9 w-9 rounded-xl bg-slate-900/80 border border-slate-800 text-cyan-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && (
        <div 
          onClick={closeLightbox}
          className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
        >
          {/* Close button */}
          <button 
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 bg-slate-900 border border-slate-800 rounded-xl cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Lightbox Canvas */}
          <div className="relative max-w-4xl w-full flex items-center justify-center">
            {/* Left navigation */}
            <button
              onClick={prevSlide}
              className="absolute left-2 md:-left-16 p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-cyan-400 rounded-xl text-slate-300 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            {/* Main Image */}
            <div className="space-y-4 w-full text-center">
              <img 
                src={filteredImages[lightboxIndex].imageUrl} 
                alt={filteredImages[lightboxIndex].title} 
                className="max-h-[70vh] max-w-full object-contain mx-auto rounded-xl border border-slate-900 shadow-2xl"
              />
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-xl font-bold font-display text-white">{filteredImages[lightboxIndex].title}</h3>
                <p className="text-sm text-slate-400 flex items-center justify-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                  {filteredImages[lightboxIndex].location}
                </p>
              </div>
            </div>

            {/* Right navigation */}
            <button
              onClick={nextSlide}
              className="absolute right-2 md:-right-16 p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-cyan-400 rounded-xl text-slate-300 transition-all cursor-pointer"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
