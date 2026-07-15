import mapGalleryService from './mapGalleryService';

const STORAGE_KEY = 'rabas_customization_data_v2';

const DEFAULT_HOTELS = {
  Albay: [
    { id: 'hotel_1', name: 'The Marison Hotel', pricePerGuest: 4201, details: 'Comfort hotel near Legazpi City attractions.' },
    { id: 'hotel_2', name: 'Lotus Blu Hotel Legazpi', pricePerGuest: 3101, details: 'City hotel option for custom Albay tours.' },
    { id: 'hotel_3', name: 'PROXY by The Oriental Albay', pricePerGuest: 2906, details: 'Modern hotel for short Bicol itineraries.' }
  ],
  Sorsogon: [
    { id: 'hotel_4', name: 'Siama Hotel Sorsogon', pricePerGuest: 3500, details: 'Boutique stay for Sorsogon custom trips.' },
    { id: 'hotel_5', name: 'Donsol Eco Lodge', pricePerGuest: 2650, details: 'Eco-style stay near Donsol activities.' },
    { id: 'hotel_6', name: 'Elysia Beach Resort', pricePerGuest: 3200, details: 'Beach resort option for Donsol tours.' }
  ],
  'Camarines Sur': [
    { id: 'hotel_7', name: 'Villa Caceres Hotel', pricePerGuest: 3300, details: 'Naga City hotel for CamSur custom trips.' },
    { id: 'hotel_8', name: 'Gota Village Resort', pricePerGuest: 4200, details: 'Island resort option for Caramoan trips.' }
  ],
  'Camarines Norte': [
    { id: 'hotel_9', name: 'Calaguas Beach Camp', pricePerGuest: 2200, details: 'Simple island stay for Calaguas tours.' }
  ]
};

const TOUR_TEMPLATES = {
  'spot-mayon': [
    { name: 'Cagsawa Ruins and Mayon View Tour', price: 1200, details: 'Photo stops, heritage walk, and local guide assistance.' },
    { name: 'Mayon ATV Adventure', price: 2500, details: 'ATV route near the Mayon lava trail with safety briefing.' },
    { name: 'Sumlang Lake Side Trip', price: 900, details: 'Lake visit with optional bamboo raft experience.' }
  ],
  'spot-caramoan': [
    { name: 'Caramoan Island Hopping', price: 2800, details: 'Boat tour covering major islands and beach stops.' },
    { name: 'Matukad Island Lagoon Visit', price: 1400, details: 'Guided island stop with lagoon viewpoint.' }
  ],
  'spot-calaguas': [
    { name: 'Calaguas Beach Camping', price: 2400, details: 'Mahabang Buhangin beach stay with campsite assistance.' },
    { name: 'Calaguas Island Hopping', price: 2200, details: 'Nearby island and beach stops depending on weather.' }
  ],
  'spot-donsol': [
    { name: 'Whale Shark Interaction', price: 2600, details: 'Butanding interaction briefing and boat coordination.' },
    { name: 'Donsol Firefly River Tour', price: 1000, details: 'Evening river tour with local guide.' }
  ],
  'spot-matnog': [
    { name: 'Subic Pink Beach Tour', price: 2200, details: 'Matnog island hopping with Subic Beach stop.' },
    { name: 'Juag Lagoon Sanctuary Visit', price: 1200, details: 'Marine sanctuary stop with guide assistance.' }
  ]
};

const getProvince = (spotName) => {
  const parts = spotName.split(',').map(part => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || spotName;
};

const buildActivity = (template, index, spotId) => ({
  id: `${spotId}_tour_${index + 1}`,
  name: template.name,
  price: template.price,
  details: template.details
});

const buildInitialData = async () => {
  const spots = await mapGalleryService.getSpots();
  const destinations = {};
  const hotels = {};

  spots.forEach((spot) => {
    const province = getProvince(spot.name);
    destinations[spot.name] = {
      base: 0,
      spotId: spot.id,
      category: spot.category,
      description: spot.description,
      image: spot.featuredImage,
      details: `Custom tour destination based on ${spot.name}.`,
      activities: (TOUR_TEMPLATES[spot.id] || []).map((tour, index) => buildActivity(tour, index, spot.id))
    };
    hotels[spot.name] = DEFAULT_HOTELS[province] || [];
  });

  return { destinations, hotels, hotelTiers: [] };
};

const normalizeData = (data) => ({
  destinations: data?.destinations || {},
  hotels: data?.hotels || {},
  hotelTiers: data?.hotelTiers || []
});

const loadData = async () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return normalizeData(JSON.parse(stored));

  const initialData = await buildInitialData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

const saveData = (data) => {
  const normalized = normalizeData(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
};

export const customizationService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 250));
    return loadData();
  },

  updateDestinations: async (destinations) => {
    await new Promise(resolve => setTimeout(resolve, 250));
    const data = await loadData();
    return saveData({ ...data, destinations });
  },

  updateHotels: async (hotels) => {
    await new Promise(resolve => setTimeout(resolve, 250));
    const data = await loadData();
    return saveData({ ...data, hotels });
  },

  updateHotelTiers: async (hotelTiers) => {
    await new Promise(resolve => setTimeout(resolve, 250));
    const data = await loadData();
    return saveData({ ...data, hotelTiers });
  }
};
