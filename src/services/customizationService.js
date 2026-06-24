const STORAGE_KEY = 'rabas_customization_data';

const INITIAL_DATA = {
  destinations: {
    'Palawan (El Nido/Coron)': { base: 4500, activities: [
      { id: 'act_1', name: 'Island Hopping Tour A & C', price: 2500 },
      { id: 'act_2', name: 'Scuba Diving Session', price: 3000 },
      { id: 'act_3', name: 'Canopy Walk & Cliff Climb', price: 1200 }
    ]},
    'Boracay Island': { base: 3500, activities: [
      { id: 'act_4', name: 'Sunset Paraw Sailing', price: 1500 },
      { id: 'act_5', name: 'Helmet Diving Experience', price: 2000 },
      { id: 'act_6', name: 'Parasailing Adventure', price: 2500 }
    ]},
    'Siargao Island': { base: 4000, activities: [
      { id: 'act_7', name: 'Cloud 9 Surfing Lesson', price: 1200 },
      { id: 'act_8', name: 'Sugba Lagoon & Rock Pool Tour', price: 1800 },
      { id: 'act_9', name: 'Three Islands Island Hopping', price: 1500 }
    ]},
    'Batanes Province': { base: 7500, activities: [
      { id: 'act_10', name: 'Sabtang Island Faluwa Crossing', price: 2000 },
      { id: 'act_11', name: 'Ivatan Heritage Tour & Vakul Rental', price: 1500 },
      { id: 'act_12', name: 'Marlboro Hills Sunset Picnic', price: 1200 }
    ]},
    'Cebu & Bohol': { base: 5000, activities: [
      { id: 'act_13', name: 'Oslob Whale Shark Swimming', price: 2500 },
      { id: 'act_14', name: 'Kawasan Falls Canyoning', price: 2000 },
      { id: 'act_15', name: 'Chocolate Hills & Tarsier Sanctuary', price: 1800 }
    ]}
  },
  hotelTiers: [
    { id: 'hostel', name: 'Backpacker Hostel / Guesthouse', pricePerNight: 1200 },
    { id: 'standard', name: 'Standard Comfort Hotel', pricePerNight: 3000 },
    { id: 'luxury', name: 'Premium 5-Star Beachfront Resort', pricePerNight: 8500 }
  ]
};

const loadData = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    return INITIAL_DATA;
  }
  return JSON.parse(stored);
};

export const customizationService = {
  getAll: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return loadData();
  },

  updateDestinations: async (destinations) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const data = loadData();
    data.destinations = destinations;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  },

  updateHotelTiers: async (hotelTiers) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const data = loadData();
    data.hotelTiers = hotelTiers;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
};
