// Service to manage pinned map spots and tourist-submitted photos in the Bicol Region
const SPOTS_STORAGE_KEY = 'rabas_map_spots';
const UPLOADS_STORAGE_KEY = 'rabas_map_uploads';

const INITIAL_SPOTS = [
  {
    id: 'spot-mayon',
    name: 'Cagsawa Ruins & Mayon Volcano, Albay',
    coords: [13.1391, 123.7438],
    description: 'Iconic 16th-century Franciscan church ruins with majestic views of Mayon Volcano, Earth\'s most perfect natural cone.',
    category: 'Historical Landmarks',
    featuredImage: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'spot-caramoan',
    name: 'Caramoan Islands, Camarines Sur',
    coords: [13.7836, 123.8569],
    description: 'A rugged peninsula featuring secluded white-sand beaches, towering limestone cliffs, crystal lagoons, and Survivor filming locations.',
    category: 'Islands & Beaches',
    featuredImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'spot-calaguas',
    name: 'Calaguas Beach, Camarines Norte',
    coords: [14.4716, 122.9366],
    description: 'Famous for the pristine Mahabang Buhangin beach, featuring powdery white sand, sparkling turquoise waters, and peaceful off-grid camping.',
    category: 'Islands & Beaches',
    featuredImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'spot-donsol',
    name: 'Donsol Whale Shark Sanctuary, Sorsogon',
    coords: [12.9067, 123.5997],
    description: 'World-renowned eco-tourism destination for ethical swimming with gentle giant whale sharks (Butanding) in their natural habitat.',
    category: 'Eco Adventure',
    featuredImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'spot-matnog',
    name: 'Matnog Pink Sand Beach, Sorsogon',
    coords: [12.5852, 124.0853],
    description: 'The southern tip of Luzon featuring Subic Beach, famous for its unique pink-tinted sand composed of crushed red organ-pipe corals.',
    category: 'Islands & Beaches',
    featuredImage: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'spot-naga',
    name: 'Peñafrancia Basilica, Naga City',
    coords: [13.6218, 123.1948],
    description: 'The major Roman Catholic pilgrimage site in Bicol, housing the revered image of Our Lady of Peñafrancia.',
    category: 'Cultural & Heritage',
    featuredImage: 'https://images.unsplash.com/photo-1548625361-18544e300185?auto=format&fit=crop&q=80&w=800'
  }
];

const INITIAL_UPLOADS = [
  {
    id: 'bu_1',
    spotId: 'spot-mayon',
    touristName: 'Maria Santos',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    caption: 'Mayon Volcano looking stunning today! Absolutely clear skies over Cagsawa Ruins 🌋',
    imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800',
    date: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    likesCount: 24,
    isLiked: false,
  },
  {
    id: 'bu_2',
    spotId: 'spot-caramoan',
    touristName: 'Jonas K.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    caption: 'Island hopping in Caramoan. These limestone cliffs look like paradise! 🏝️',
    imageUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800',
    date: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    likesCount: 18,
    isLiked: false,
  },
  {
    id: 'bu_3',
    spotId: 'spot-calaguas',
    touristName: 'Anna L.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    caption: 'Mahabang Buhabang sand is so white and fine! Best camping trip ever 🌊',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    date: new Date(Date.now() - 1000 * 3600 * 2).toISOString(), // 2 hours ago
    likesCount: 42,
    isLiked: true,
  },
  {
    id: 'bu_4',
    spotId: 'spot-donsol',
    touristName: 'Mark R.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    caption: 'Just swam alongside a giant Butanding in Donsol! Unbelievable experience 🐋',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800',
    date: new Date(Date.now() - 1000 * 3600 * 4).toISOString(), // 4 hours ago
    likesCount: 31,
    isLiked: false,
  },
  {
    id: 'bu_5',
    spotId: 'spot-matnog',
    touristName: 'Kat P.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
    caption: 'Pink sand is real! The Subic beach in Matnog is absolutely breathtaking 💕',
    imageUrl: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=800',
    date: new Date(Date.now() - 1000 * 3600 * 6).toISOString(), // 6 hours ago
    likesCount: 56,
    isLiked: true,
  }
];

// Safety reset if storage structure changes
const validIds = new Set(INITIAL_SPOTS.map((spot) => spot.id));
const storedSpots = JSON.parse(localStorage.getItem(SPOTS_STORAGE_KEY) || '[]');
if (!storedSpots.length || storedSpots.some(s => !validIds.has(s.id))) {
  localStorage.setItem(SPOTS_STORAGE_KEY, JSON.stringify(INITIAL_SPOTS));
}

if (!localStorage.getItem(UPLOADS_STORAGE_KEY)) {
  localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(INITIAL_UPLOADS));
}

export const mapGalleryService = {
  getSpots: async () => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const stored = JSON.parse(localStorage.getItem(SPOTS_STORAGE_KEY)) || INITIAL_SPOTS;
    return stored;
  },

  getUploads: async (spotId) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const all = JSON.parse(localStorage.getItem(UPLOADS_STORAGE_KEY)) || INITIAL_UPLOADS;
    if (!spotId || spotId === 'all') {
      return all.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return all.filter(u => u.spotId === spotId).sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  getAllUploads: async () => {
    await new Promise(resolve => setTimeout(resolve, 150));
    return JSON.parse(localStorage.getItem(UPLOADS_STORAGE_KEY)) || INITIAL_UPLOADS;
  },

  uploadPhoto: async (spotId, touristName, caption, imageUrl, avatar) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const all = JSON.parse(localStorage.getItem(UPLOADS_STORAGE_KEY)) || [];

    const defaultAvatar = avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`;

    const newUpload = {
      id: `story_${Math.random().toString(36).substr(2, 9)}`,
      spotId: spotId || 'spot-mayon',
      touristName: touristName || 'Tourist Traveler',
      avatar: defaultAvatar,
      caption: caption || 'Real-time story from Bicol!',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800',
      date: new Date().toISOString(),
      likesCount: 1,
      isLiked: true,
      isNewStory: true,
    };

    all.unshift(newUpload);
    localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(all));
    return newUpload;
  },

  likeUpload: async (uploadId) => {
    const all = JSON.parse(localStorage.getItem(UPLOADS_STORAGE_KEY)) || [];
    const item = all.find(u => u.id === uploadId);
    if (item) {
      item.isLiked = !item.isLiked;
      item.likesCount = item.isLiked ? (item.likesCount || 0) + 1 : Math.max(0, (item.likesCount || 1) - 1);
      localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(all));
      return item;
    }
    return null;
  }
};

export default mapGalleryService;

