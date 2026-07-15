// serviceService.js — unified service layer for all RABAS service categories
// Categories: 'tour' | 'tuktrip' | 'car'

const STORAGE_KEY = 'rabas_services_v1';

const INITIAL_SERVICES = [
  // ─── TOUR PACKAGES ───────────────────────────────────────────────────────────
  {
    id: 'mayon-volcano-tour',
    category: 'tour',
    title: 'Mayon Volcano Adventure Tour',
    destination: 'Legazpi, Albay',
    description: 'Witness the perfect cone of Mayon Volcano up close. Includes ATV ride to the lava front, Cagsawa Ruins visit, Lignon Hill zipline, and Embarcadero nightlife.',
    price: 12500,
    duration: '3 Days, 2 Nights',
    rating: 4.9,
    reviewsCount: 234,
    image: '/CAGSAWA.jpg',
    tags: ['Adventure', 'Nature', 'Cultural'],
    difficulty: 'Medium',
    spots: ['Mayon Volcano Lava Front', 'Cagsawa Ruins', 'Lignon Hill', 'Embarcadero de Legazpi', 'Sumlang Lake'],
    itinerary: [
      { day: 1, title: 'Arrival & Cagsawa Ruins', desc: 'Transfer from Legazpi Airport. Visit the iconic Cagsawa Ruins with Mayon Volcano backdrop. Evening stroll at Embarcadero de Legazpi.' },
      { day: 2, title: 'ATV Mayon Lava Front & Lignon Hill', desc: 'Early morning ATV ride to the Mayon Volcano lava front. Afternoon zipline adventure at Lignon Hill with panoramic views.' },
      { day: 3, title: 'Sumlang Lake & Departure', desc: 'Peaceful bamboo rafting at Sumlang Lake with Mayon Volcano view. Souvenir shopping and airport transfer.' }
    ]
  },
  {
    id: 'caramoan-island-hopping',
    category: 'tour',
    title: 'Caramoan Island Hopping',
    destination: 'Caramoan, Camarines Sur',
    description: 'Explore the hidden paradise of Caramoan with its pristine white sand beaches, crystal clear waters, and dramatic limestone cliffs.',
    price: 15800,
    duration: '4 Days, 3 Nights',
    rating: 4.8,
    reviewsCount: 189,
    image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800',
    tags: ['Beach', 'Adventure', 'Nature'],
    difficulty: 'Medium',
    spots: ['Matukad Island', 'Lahos Island', 'Minalahos Island', 'Tayak Beach', 'Cotivas Island'],
    itinerary: [
      { day: 1, title: 'Arrival & Gota Beach', desc: 'Travel from Naga City to Caramoan via land and boat. Check-in at beach resort. Relax at Gota Village beachfront.' },
      { day: 2, title: 'Island Hopping Day 1', desc: 'Visit Matukad Island with its iconic lagoon, Lahos Island hidden beach, and snorkeling at coral gardens.' },
      { day: 3, title: 'Island Hopping Day 2', desc: 'Explore Minalahos Island, Cotivas Island white sand bar, and Tayak Beach. Beach bonfire dinner.' },
      { day: 4, title: 'Leisure & Departure', desc: 'Morning swim, breakfast at the resort, and transfer back to Naga City.' }
    ]
  },
  {
    id: 'donsol-whale-shark',
    category: 'tour',
    title: 'Donsol Whale Shark Interaction',
    destination: 'Donsol, Sorsogon',
    description: 'Swim alongside the gentle giants of Donsol. Experience the world-renowned Butanding interaction, Firefly River tour, and beautiful Sorsogon beaches.',
    price: 11500,
    duration: '3 Days, 2 Nights',
    rating: 4.9,
    reviewsCount: 312,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=800',
    tags: ['Nature', 'Adventure', 'Beach'],
    difficulty: 'Easy',
    spots: ['Donsol Butanding Interaction Center', 'Ogod River Firefly Watching', 'Dancalan Beach', 'Paguriran Island'],
    itinerary: [
      { day: 1, title: 'Arrival & Firefly River Tour', desc: 'Transfer to Donsol resort. Evening magical firefly watching boat tour along the Ogod River mangrove forest.' },
      { day: 2, title: 'Whale Shark Interaction', desc: 'Early morning Butanding (whale shark) swimming interaction. Afternoon visit to Dancalan Beach and local seafood lunch.' },
      { day: 3, title: 'Paguriran Island & Departure', desc: 'Visit the stunning Paguriran Island lagoon and sandbar. Transfer back for departure.' }
    ]
  },

  // ─── TUKTRIP SERVICES ────────────────────────────────────────────────────────
  {
    id: 'tuktrip-legazpi-city',
    category: 'tuktrip',
    title: 'Legazpi City Highlights Tuktrip',
    destination: 'Legazpi City, Albay',
    description: 'Explore Legazpi City landmarks and hidden gems aboard a comfortable tuk-tuk. Visit Cagsawa Ruins, Embarcadero, and local markets in one fun-filled ride.',
    price: 1800,
    duration: '4 Hours',
    rating: 4.7,
    reviewsCount: 98,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800',
    tags: ['City Tour', 'Cultural', 'Budget-Friendly'],
    vehicleType: 'Standard Tuk-Tuk',
    capacity: '2-3 Passengers',
    includes: ['Driver-Guide', 'Fuel', 'Basic Travel Insurance'],
    stops: ['Cagsawa Ruins', 'Embarcadero de Legazpi', 'Lignon Hill Viewpoint', 'Public Market']
  },
  {
    id: 'tuktrip-naga-heritage',
    category: 'tuktrip',
    title: 'Naga Heritage & Food Trip Tuktrip',
    destination: 'Naga City, Camarines Sur',
    description: 'Ride through the historical streets of Naga City. Stop by the Peñafrancia Basilica, Naga Cathedral, local delicacy shops, and enjoy authentic Bicolano food.',
    price: 1500,
    duration: '3 Hours',
    rating: 4.6,
    reviewsCount: 74,
    image: 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?auto=format&fit=crop&q=80&w=800',
    tags: ['Heritage', 'Food Trip', 'City Tour'],
    vehicleType: 'Standard Tuk-Tuk',
    capacity: '2-3 Passengers',
    includes: ['Driver-Guide', 'Fuel', 'Basic Travel Insurance'],
    stops: ['Peñafrancia Basilica', 'Naga Metropolitan Cathedral', 'Dela Rosa St. Food Hub', 'Plaza Rizal']
  },
  {
    id: 'tuktrip-donsol-coast',
    category: 'tuktrip',
    title: 'Donsol Coastal Tuktrip',
    destination: 'Donsol, Sorsogon',
    description: 'Discover the coastal charm of Donsol aboard a tuk-tuk. Pass through barangay fishing villages, local ports, and scenic riverside roads.',
    price: 1200,
    duration: '2.5 Hours',
    rating: 4.5,
    reviewsCount: 52,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
    tags: ['Coastal', 'Nature', 'Budget-Friendly'],
    vehicleType: 'Standard Tuk-Tuk',
    capacity: '2-3 Passengers',
    includes: ['Driver-Guide', 'Fuel'],
    stops: ['Dancalan Beachfront', 'Ogod River Crossing', 'Local Fish Port', 'Donsol Municipal Hall']
  },

  // ─── CAR RENTALS ─────────────────────────────────────────────────────────────
  {
    id: 'car-sedan-vios',
    category: 'car',
    title: 'Toyota Vios – Economy Sedan',
    destination: 'Bicol Region',
    description: 'A reliable and fuel-efficient sedan for couples or solo travelers. Ideal for city drives and short provincial trips across the Bicol Region.',
    price: 2500,
    duration: 'Per Day',
    rating: 4.5,
    reviewsCount: 143,
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800',
    tags: ['Economy', 'Sedan', 'Fuel-Efficient'],
    vehicleType: 'Sedan',
    capacity: '4 Passengers',
    transmission: 'Automatic',
    fuelType: 'Gasoline',
    includes: ['Driver', 'Fuel (within 100km)', 'Basic Insurance'],
    features: ['Air Conditioning', 'Bluetooth Audio', 'USB Charging Port']
  },
  {
    id: 'car-suv-fortuner',
    category: 'car',
    title: 'Toyota Fortuner – Premium SUV',
    destination: 'Bicol Region',
    description: 'A premium 4x4 SUV perfect for family trips, adventure routes, and off-road destinations. Comfortable for long drives with spacious interiors.',
    price: 4800,
    duration: 'Per Day',
    rating: 4.8,
    reviewsCount: 201,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
    tags: ['Premium', 'SUV', '4x4', 'Family'],
    vehicleType: 'SUV',
    capacity: '7 Passengers',
    transmission: 'Automatic',
    fuelType: 'Diesel',
    includes: ['Driver', 'Fuel (within 150km)', 'Full Insurance'],
    features: ['Air Conditioning', 'GPS Navigation', 'Leather Seats', 'USB Charging Ports', '4x4 Drive']
  },
  {
    id: 'car-van-hiace',
    category: 'car',
    title: 'Toyota Hi-Ace – Group Van',
    destination: 'Bicol Region',
    description: 'Spacious van rental perfect for group tours, corporate outings, and large families. Accommodates up to 12 passengers comfortably.',
    price: 6500,
    duration: 'Per Day',
    rating: 4.7,
    reviewsCount: 167,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800',
    tags: ['Group', 'Van', 'Corporate', 'Family'],
    vehicleType: 'Van',
    capacity: '12 Passengers',
    transmission: 'Manual',
    fuelType: 'Diesel',
    includes: ['Driver', 'Fuel (within 200km)', 'Full Insurance'],
    features: ['Air Conditioning', 'Extra Luggage Space', 'Reclining Seats']
  }
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

const loadServices = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SERVICES));
    return INITIAL_SERVICES;
  }
  return JSON.parse(stored);
};

// ─── Exported service object ──────────────────────────────────────────────────

export const serviceService = {
  /** Get all services across all categories */
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return loadServices();
  },

  /** Get services filtered by category ('tour' | 'tuktrip' | 'car') */
  getByCategory: async (category) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const all = loadServices();
    return all.filter(s => s.category === category);
  },

  /** Get a single service by id */
  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const all = loadServices();
    return all.find(s => s.id === id) || null;
  },

  /** Get recommended services (tour category) based on tag preferences */
  getRecommendations: async (preferences) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const all = loadServices();
    const tours = all.filter(s => s.category === 'tour');
    if (!preferences || preferences.length === 0) return tours.slice(0, 3);
    return tours.filter(pkg => pkg.tags && pkg.tags.some(tag => preferences.includes(tag)));
  },

  /** Create a new service entry */
  create: async (newService) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const all = loadServices();
    const entry = {
      ...newService,
      id: newService.id || Date.now().toString(),
      rating: newService.rating || 0,
      reviewsCount: newService.reviewsCount || 0
    };
    all.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return entry;
  },

  /** Update an existing service entry */
  update: async (id, updated) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const all = loadServices();
    const index = all.findIndex(s => s.id === id);
    if (index !== -1) {
      all[index] = { ...all[index], ...updated };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return all[index];
    }
    throw new Error('Service not found');
  },

  /** Delete a service entry */
  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const all = loadServices();
    const filtered = all.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
};

// ─── Keep backward-compat alias so existing imports of packageService still work ──
export const packageService = {
  getAll: () => serviceService.getByCategory('tour'),
  getById: (id) => serviceService.getById(id),
  getRecommendations: (pref) => serviceService.getRecommendations(pref),
  create: (pkg) => serviceService.create({ ...pkg, category: 'tour' }),
  update: (id, pkg) => serviceService.update(id, pkg),
  delete: (id) => serviceService.delete(id)
};
