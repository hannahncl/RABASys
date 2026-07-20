// Service to manage pinned map spots and tourist-submitted photos in the Bicol Region
const SPOTS_STORAGE_KEY = 'rabas_map_spots';
const UPLOADS_STORAGE_KEY = 'rabas_map_uploads';

const INITIAL_SPOTS = [

  {
    id: 'spot-caramoan',
    name: 'Caramoan, Camarines Sur',
    coords: [13.7836, 123.8569],
    description: 'A rugged peninsula featuring secluded white-sand beaches, towering limestone cliffs, crystal lagoons, and the setting for multiple seasons of the TV show Survivor.',
    category: 'Islands & Beaches',
    featuredImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'spot-calaguas',
    name: 'Calaguas, Camarines Norte',
    coords: [14.4716, 122.9366],
    description: 'Famous for the pristine Mahabang Buhangin beach, featuring powdery white sand, sparkling turquoise waters, and a peaceful off-grid camping vibe.',
    category: 'Islands & Beaches',
    featuredImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'spot-matnog',
    name: 'Matnog, Sorsogon',
    coords: [12.5852, 124.0853],
    description: 'The southern tip of Luzon featuring Subic Beach, which is famous for its unique pink-tinted sand composed of crushed red organ-pipe corals and clear water.',
    category: 'Islands & Beaches',
    featuredImage: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=800'
  }
];

const INITIAL_UPLOADS = [
  {
    id: 'bu_3',
    spotId: 'spot-caramoan',
    touristName: 'Jonas K.',
    caption: 'Island hopping in Caramoan. These limestone cliffs look like El Nido but with fewer tourists!',
    imageUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800',
    date: '2026-06-18T12:50:00.000Z'
  },
  {
    id: 'bu_4',
    spotId: 'spot-calaguas',
    touristName: 'Anna L.',
    caption: 'Mahabang Buhangin beach sand is so white and fine! Best camping trip ever in Camarines Norte.',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    date: '2026-06-23T08:15:00.000Z'
  },
  {
    id: 'bu_6',
    spotId: 'spot-matnog',
    touristName: 'Kat P.',
    caption: 'Pink sand is real! The Subic beach in Matnog is absolutely stunning.',
    imageUrl: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=800',
    date: '2026-06-21T13:10:00.000Z'
  }
];

// Safety check: Clears old non-Bicol spots cache from browser local storage
const oldSpotsExist = localStorage.getItem(SPOTS_STORAGE_KEY) && localStorage.getItem(SPOTS_STORAGE_KEY).includes('palawan');
if (oldSpotsExist) {
  localStorage.removeItem(SPOTS_STORAGE_KEY);
  localStorage.removeItem(UPLOADS_STORAGE_KEY);
}

// Initialize storage
if (!localStorage.getItem(SPOTS_STORAGE_KEY)) {
  localStorage.setItem(SPOTS_STORAGE_KEY, JSON.stringify(INITIAL_SPOTS));
}
if (!localStorage.getItem(UPLOADS_STORAGE_KEY)) {
  localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(INITIAL_UPLOADS));
}

export const mapGalleryService = {
  getSpots: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const stored = JSON.parse(localStorage.getItem(SPOTS_STORAGE_KEY)) || [];
    const validIds = new Set(INITIAL_SPOTS.map((spot) => spot.id));
    const filtered = stored.filter((spot) => validIds.has(spot.id));
    localStorage.setItem(SPOTS_STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  },

  getUploads: async (spotId) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const all = JSON.parse(localStorage.getItem(UPLOADS_STORAGE_KEY)) || [];
    return all.filter(u => u.spotId === spotId).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getAllUploads: async () => {
    await new Promise(resolve => setTimeout(resolve, 250));
    return JSON.parse(localStorage.getItem(UPLOADS_STORAGE_KEY)) || [];
  },

  uploadPhoto: async (spotId, touristName, caption, imageUrl) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const all = JSON.parse(localStorage.getItem(UPLOADS_STORAGE_KEY)) || [];
    
    const newUpload = {
      id: `bu_${Math.random().toString(36).substr(2, 9)}`,
      spotId,
      touristName: touristName || 'Anonymous Tourist',
      caption: caption || '',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
      date: new Date().toISOString()
    };

    all.unshift(newUpload);
    localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(all));
    return newUpload;
  }
};

export default mapGalleryService;
