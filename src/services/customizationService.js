const STORAGE_KEY = 'rabas_customization_data';

const bicolActivities = [
  { id: 'act_1', name: 'ATV and Ziplining adventure at the foot of Mayon Volcano, and the first Skywheel in Bicol.' },
  { id: 'act_2', name: 'Culinary tour to taste the local delicacies such as Bicol Express, Sili Ice Cream and more.' },
  { id: 'act_3', name: 'Visit Historical landmarks including Daraga Church, Cagsawa Ruins, and Quituinan Hills.' },
  { id: 'act_4', name: 'Visit the famous 7 Eleven in Camalig, the smallest Chapel in Bicol at Farmplate, enjoy the scenery at Sumlang Lake, and Costal view of Legazpi Boulevard.' },
  { id: 'act_5', name: 'Culinary tour to taste local delicacies such as Yema Buko Pie, Bicol Express and more.' },
  { id: 'act_6', name: 'Explore Calintaan Cave.' },
  { id: 'act_7', name: 'Kayaking at Bulusan Natural Park.' },
  { id: 'act_8', name: 'Stroll at Balay Buhay sa Uma Bee Farm.' },
  { id: 'act_9', name: 'Swim and Snorkel at Juag Lagoon Sanctuary.' },
  { id: 'act_10', name: 'Swim and watch with Gentle Giants (Whale Sharks) in Donsol.' },
  { id: 'act_11', name: 'Visit historical landmarks including the Barcelona Ruins, St. Joseph Church, and museo Sorsogon.' },
  { id: 'act_12', name: 'Visit Pepita Park, Sorosogon Sports Arena, the Rome Coliseum Inspired Sports Complex, Rompeolas Coastal Road, and Casiguran Park the 16k Roses.' },
  { id: 'act_13', name: 'Caramoan Island Hopping which includes Matukad Island, Lahus Island, Cagbalinad Island (Snorkeling with Fish), Minalahus Island, Busdak Island, Guinahaon Island, Cutivas Sandbar, Bugtong Sandbar, Manlawi Big Sandbar, and Sabitang Laya (Caramoan Proper).' },
  { id: 'act_14', name: 'Balagbag Trekking (Little Batanes of the South).' },
  { id: 'act_15', name: 'Hilltop Halabang Baybay.' },
  { id: 'act_16', name: 'Snorkeling.' },
  { id: 'act_17', name: 'Visit the Calaguas Group of Islands.' }
];

const INITIAL_DATA = {
  destinations: {
    'Albay': {
      base: 0, activities: bicolActivities
    },
    'Sorsogon': {
      base: 0, activities: bicolActivities
    }
  },
  hotels: {
    'Albay': [
      { id: 'hotel_1', name: 'The Marison Hotel', pricePerGuest: 4201 },
      { id: 'hotel_2', name: 'Lotus Blu Hotel Legazpi', pricePerGuest: 3101 },
      { id: 'hotel_3', name: 'Vela Hotel', pricePerGuest: 2450 },
      { id: 'hotel_4', name: 'PROXY by The Oriental Albay', pricePerGuest: 2906 },
      { id: 'hotel_5', name: "Antonio's Bed and Breakfast Hotel", pricePerGuest: 3136 },
      { id: 'hotel_6', name: 'Villa Isabel', pricePerGuest: 2468 }
    ],
    'Sorsogon': [
      { id: 'hotel_7', name: 'Siama Hotel Sorsogon', pricePerGuest: 3500 },
      { id: 'hotel_8', name: 'Rizal Beach Resort', pricePerGuest: 2800 },
      { id: 'hotel_9', name: 'Villa Kasanggayahan', pricePerGuest: 2100 },
      { id: 'hotel_10', name: 'Fernandos Hotel', pricePerGuest: 1950 },
      { id: 'hotel_11', name: 'Donsol Eco Lodge', pricePerGuest: 2650 },
      { id: 'hotel_12', name: 'Elysia Beach Resort', pricePerGuest: 3200 }
    ]
  },
  // Legacy support
  hotelTiers: [
    { id: 'hostel', name: 'Backpacker Hostel / Guesthouse', pricePerNight: 1200 },
    { id: 'standard', name: 'Standard Comfort Hotel', pricePerNight: 3000 },
    { id: 'luxury', name: 'Premium 5-Star Beachfront Resort', pricePerNight: 8500 }
  ]
};

const loadData = () => {
  // Always reset to ensure new data structure is used
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
  return INITIAL_DATA;
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
