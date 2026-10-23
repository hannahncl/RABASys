// Simulated real-time uploads from Tour Guides / Staff in the field
const UPLOADS_STORAGE_KEY = 'rabas_trip_uploads';

const DEFAULT_UPLOADS = [
  {
    id: 'up_1',
    packageId: 'el-nido-premium',
    packageName: 'El Nido Premium Island Hopping',
    guideName: 'Albert Guide',
    spotName: 'Big Lagoon',
    caption: 'Crystal clear waters today! Guests are currently kayaking around the lagoon.',
    imageUrl: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800',
    timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },
  {
    id: 'up_2',
    packageId: 'siargao-surf-adventure',
    packageName: 'Siargao Surf & Island Hop Adventure',
    guideName: 'Sarah Guide',
    spotName: 'Cloud 9 Boardwalk',
    caption: 'Waves are rising! Catching some swells at Cloud 9 before sunset.',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
    timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  }
];

if (!localStorage.getItem(UPLOADS_STORAGE_KEY)) {
  localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(DEFAULT_UPLOADS));
}

export const tripUploadService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return JSON.parse(localStorage.getItem(UPLOADS_STORAGE_KEY)) || [];
  },

  upload: async (packageId, packageName, guideName, spotName, caption, imageFileOrUrl) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const list = JSON.parse(localStorage.getItem(UPLOADS_STORAGE_KEY)) || [];
    
    // Fallback image if none selected
    const imageUrl = imageFileOrUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800';

    const newUpload = {
      id: `up_${Math.random().toString(36).substr(2, 9)}`,
      packageId,
      packageName,
      guideName,
      spotName,
      caption,
      imageUrl,
      timestamp: new Date().toISOString()
    };

    list.unshift(newUpload);
    localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(list));
    return newUpload;
  }
};
export default tripUploadService;
