const STORAGE_KEY = 'rabas_tour_packages_v5';

const INITIAL_PACKAGES = [
  {
    id: 'mayon-volcano-tour',
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
    title: 'Caramoan Island Hopping',
    destination: 'Caramoan, Camarines Sur',
    description: 'Explore the hidden paradise of Caramoan with its pristine white sand beaches, crystal clear waters, and dramatic limestone cliffs featured in Survivor.',
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
  {
    id: 'catanduanes-surfing',
    title: 'Catanduanes Surf & Nature Trip',
    destination: 'Virac, Catanduanes',
    description: 'Discover the Happy Island! Surf the legendary Majestics break in Baras, trek to Binurong Point, and visit Bato Church and the twin rock formations.',
    price: 14200,
    duration: '4 Days, 3 Nights',
    rating: 4.7,
    reviewsCount: 145,
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=800',
    tags: ['Adventure', 'Beach', 'Nature'],
    difficulty: 'Medium',
    spots: ['Puraran Beach Majestics', 'Binurong Point', 'Bato Church', 'Twin Rock Beach Resort', 'Balacay Point'],
    itinerary: [
      { day: 1, title: 'Arrival in Virac', desc: 'Fly or ferry to Catanduanes. Check-in at Virac hotel. Afternoon visit to Bato Church and town exploration.' },
      { day: 2, title: 'Puraran Beach Surfing', desc: 'Full day at Puraran Beach. Beginner or advanced surf lessons at the world-famous Majestics surf break.' },
      { day: 3, title: 'Binurong Point Trek', desc: 'Morning trek to Binurong Point for breathtaking cliff views. Afternoon at Twin Rock Beach Resort.' },
      { day: 4, title: 'Balacay Point & Departure', desc: 'Visit Balacay Point lighthouse. Last swim and transfer for departure.' }
    ]
  },
  {
    id: 'cam-sur-watersports',
    title: 'CamSur Watersports & Heritage',
    destination: 'Naga City, Camarines Sur',
    description: 'Experience world-class wakeboarding at CWC, explore the historic Naga Metropolitan Cathedral, taste authentic Bicolano cuisine, and visit Lake Buhi.',
    price: 10500,
    duration: '3 Days, 2 Nights',
    rating: 4.6,
    reviewsCount: 178,
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800',
    tags: ['Adventure', 'Cultural', 'Nature'],
    difficulty: 'Easy',
    spots: ['CamSur Watersports Complex', 'Naga Metropolitan Cathedral', 'Lake Buhi', 'Mt. Isarog National Park', 'Peñafrancia Basilica'],
    itinerary: [
      { day: 1, title: 'Arrival & Naga Heritage Walk', desc: 'Arrive in Naga City. Visit Naga Metropolitan Cathedral, Peñafrancia Basilica, and enjoy Bicolano dinner with laing and Bicol Express.' },
      { day: 2, title: 'CWC Watersports & Lake Buhi', desc: 'Full morning at CamSur Watersports Complex for wakeboarding. Afternoon trip to Lake Buhi, home of the smallest fish in the world.' },
      { day: 3, title: 'Mt. Isarog & Departure', desc: 'Morning nature walk at Mt. Isarog National Park foothills. Souvenir shopping for pili nut products and departure.' }
    ]
  }
];

const loadPackages = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PACKAGES));
    return INITIAL_PACKAGES;
  }
  return JSON.parse(stored);
};

export const packageService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return loadPackages();
  },

  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const packages = loadPackages();
    return packages.find(pkg => pkg.id === id) || null;
  },

  getRecommendations: async (preferences) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    const packages = loadPackages();
    if (!preferences || preferences.length === 0) {
      return packages.slice(0, 3);
    }
    
    return packages.filter(pkg => 
      pkg.tags.some(tag => preferences.includes(tag))
    );
  },

  create: async (newPackage) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const packages = loadPackages();
    const pkg = {
      ...newPackage,
      id: newPackage.id || Date.now().toString(),
      rating: newPackage.rating || 0,
      reviewsCount: newPackage.reviewsCount || 0
    };
    packages.push(pkg);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
    return pkg;
  },

  update: async (id, updatedPackage) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const packages = loadPackages();
    const index = packages.findIndex(pkg => pkg.id === id);
    if (index !== -1) {
      packages[index] = { ...packages[index], ...updatedPackage };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
      return packages[index];
    }
    throw new Error('Package not found');
  },

  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const packages = loadPackages();
    const filtered = packages.filter(pkg => pkg.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
};
