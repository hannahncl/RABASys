// Service to manage pinned map spots and tourist-submitted photos in the Bicol Region
import { api } from '../../services/api';

const INITIAL_SPOTS = [
  {
    id: 'spot-mayon',
    name: 'Cagsawa Ruins & Mayon Volcano, Albay',
    coords: [13.1660559, 123.7010503],
    description: 'Iconic 16th-century Franciscan church ruins with majestic views of Mayon Volcano, Earth\'s most perfect natural cone.',
    category: 'Historical Landmarks',
    featuredImage: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800',
    travelTips: 'Best visited during early mornings for clear views of Mayon summit. Try the ATV trail adventure!',
    bestSeason: 'Nov - May (Dry Season)',
    activities: ['ATV Volcano Tour', 'Ruins Photography', 'Bicol Express Tasting'],
    packageLink: '/packages'
  },
  {
    id: 'spot-caramoan',
    name: 'Caramoan Islands, Camarines Sur',
    coords: [13.7681398, 123.8624978],
    description: 'A rugged peninsula featuring secluded white-sand beaches, towering limestone cliffs, crystal lagoons, and Survivor filming locations.',
    category: 'Islands & Beaches',
    featuredImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800',
    travelTips: 'Boat island hopping recommended between April and October when sea waters are calmest.',
    bestSeason: 'March - June',
    activities: ['Island Hopping', 'Snorkeling', 'Rock Climbing'],
    packageLink: '/packages'
  },
  {
    id: 'spot-calaguas',
    name: 'Calaguas Beach, Camarines Norte',
    coords: [14.4759359, 122.9388605],
    description: 'Famous for the pristine Mahabang Buhangin beach, featuring powdery white sand, sparkling turquoise waters, and peaceful off-grid camping.',
    category: 'Islands & Beaches',
    featuredImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    travelTips: 'Off-grid destination: bring power banks and dry bags. Overnight stargazing on Mahabang Buhangin is unforgettable.',
    bestSeason: 'Feb - May',
    activities: ['Beach Camping', 'Stargazing', 'Trekking Hilltop Viewpoints'],
    packageLink: '/packages'
  },
  {
    id: 'spot-donsol',
    name: 'Donsol Whale Shark Sanctuary, Sorsogon',
    coords: [12.9231333, 123.5779705],
    description: 'World-renowned eco-tourism destination for ethical swimming with gentle giant whale sharks (Butanding) in their natural habitat.',
    category: 'Eco Adventure',
    featuredImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800',
    travelTips: 'Peak whale shark season is Feb to May. Respect interaction guidelines (no flash, no touching).',
    bestSeason: 'Feb - May (Peak Butanding Season)',
    activities: ['Whale Shark Swimming', 'Firefly River Cruise', 'Mangrove Kayaking'],
    packageLink: '/packages'
  },
  {
    id: 'spot-matnog',
    name: 'Matnog Pink Sand Beach, Sorsogon',
    coords: [12.5387376, 124.1050759],
    description: 'The southern tip of Luzon featuring Subic Beach, famous for its unique pink-tinted sand composed of crushed red organ-pipe corals.',
    category: 'Islands & Beaches',
    featuredImage: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=800',
    travelTips: 'Combine with Juag Lagoon Fish Sanctuary for fish feeding and snorkeling.',
    bestSeason: 'March - June',
    activities: ['Pink Sand Photography', 'Fish Sanctuary Feeding', 'Island Hopping'],
    packageLink: '/packages'
  },
  {
    id: 'spot-naga',
    name: 'Peñafrancia Basilica, Naga City',
    coords: [13.6320559, 123.200008],
    description: 'The major Roman Catholic pilgrimage site in Bicol, housing the revered image of Our Lady of Peñafrancia.',
    category: 'Cultural & Heritage',
    featuredImage: 'https://images.unsplash.com/photo-1548625361-18544e300185?auto=format&fit=crop&q=80&w=800',
    travelTips: 'September hosts the grand Peñafrancia Festival. Dress modestly when visiting religious sanctuaries.',
    bestSeason: 'Year-round (Peñafrancia Fiesta in Sept)',
    activities: ['Cultural Heritage Tour', 'Religious Pilgrimage', 'Naga Food Crawl'],
    packageLink: '/packages'
  },
  {
    id: 'spot-sorsogon-city',
    name: 'Sorsogon City',
    coords: [12.9711469, 124.0014783],
    description: 'Explore Sorsogon City, the provincial capital, and its nearby heritage and food destinations.',
    category: 'City Destinations',
    featuredImage: '/SORSOGON.jpg',
    travelTips: 'Use Sorsogon City as a starting point for exploring the province.',
    bestSeason: 'Year-round',
    activities: ['City Sightseeing', 'Local Food', 'Heritage Stops'],
    packageLink: '/packages'
  }
];

export const mapGalleryService = {
  getSpots: async () => INITIAL_SPOTS,

  getUploads: async (spotId) => {
    const query = spotId && spotId !== 'all' ? `?spotId=${encodeURIComponent(spotId)}` : '';
    return api(`/map-stories${query}`);
  },

  getAllUploads: async () => api('/map-stories'),

  uploadPhoto: async (spotId, touristName, caption, imageUrl, location) => api('/map-stories', {
    method: 'POST',
    body: JSON.stringify({ spotId, touristName, caption, imageUrl, location }),
  }),

  getMyUploads: async () => api('/map-stories/mine'),

  updateMyUploadCaption: async (uploadId, caption) => api(`/map-stories/${encodeURIComponent(uploadId)}/caption`, {
    method: 'PATCH',
    body: JSON.stringify({ caption }),
  }),

  deleteMyUpload: async (uploadId) => {
    const result = await api(`/map-stories/${encodeURIComponent(uploadId)}`, { method: 'DELETE' });
    return result.deleted === true;
  },

  likeUpload: async (uploadId) => api(`/map-stories/${encodeURIComponent(uploadId)}/like`, {
    method: 'POST',
  }),
};

export default mapGalleryService;
