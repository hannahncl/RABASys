// Mock Tour Packages Data
export const TOUR_PACKAGES = [
  {
    id: 'el-nido-premium',
    title: 'El Nido Premium Island Hopping',
    destination: 'El Nido, Palawan',
    description: 'Explore the world-famous lagoons, white sand beaches, and towering karst cliffs of El Nido. Includes Tours A & C, premium beachfront resort stay, and private boat transfers.',
    price: 18500,
    duration: '4 Days, 3 Nights',
    rating: 4.9,
    reviewsCount: 124,
    image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=800',
    tags: ['Beach', 'Adventure', 'Premium'],
    difficulty: 'Easy',
    spots: ['Big Lagoon', 'Secret Lagoon', 'Shimizu Island', 'Seven Commando Beach', 'Matinloc Shrine', 'Helicopter Island'],
    itinerary: [
      { day: 1, title: 'Arrival & Beach Sunset', desc: 'Transfer from Lio Airport to beachfront resort. Evening leisure walk at Las Cabañas beach for a scenic sunset dinner.' },
      { day: 2, title: 'Lagoon Exploration (Tour A)', desc: 'Full-day private boat tour visiting Big Lagoon, Secret Lagoon, Shimizu Island, and Seven Commando Beach with buffet lunch.' },
      { day: 3, title: 'Cliffs & Shrines (Tour C)', desc: 'Explore Matinloc Shrine, Hidden Beach, Star Beach, and Helicopter Island. Great snorkeling spots.' },
      { day: 4, title: 'Souvenir Shopping & Departure', desc: 'Breakfast at the resort, free time for town exploration, and airport drop-off.' }
    ]
  },
  {
    id: 'boracay-sunset-getaway',
    title: 'Boracay Sunset & Watersports Escape',
    destination: 'Boracay, Aklan',
    description: 'Experience the finest white sand beach in the world. Includes paraw sailing, helmet diving, buffet island lunch, and 4-star Station 1 hotel stay.',
    price: 12000,
    duration: '3 Days, 2 Nights',
    rating: 4.8,
    reviewsCount: 312,
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&q=80&w=800',
    tags: ['Beach', 'Leisure', 'Party'],
    difficulty: 'Easy',
    spots: ['White Beach Station 1', 'Puka Shell Beach', 'Crystal Cove Island', 'Bulabog Beach'],
    itinerary: [
      { day: 1, title: 'Arrival & Paraw Sailing', desc: 'Transfer from Caticlan Airport. Check-in at Station 1. 5:00 PM Paraw sailing to witness the famous Boracay sunset.' },
      { day: 2, title: 'Island Hopping & Water Activities', desc: 'Explore Puka Beach and snorkeling at Crocodile Island. Try helmet diving or parasailing in the afternoon.' },
      { day: 3, title: 'Leisure Morning & Flight Back', desc: 'Relaxing breakfast, last minute swim, and transfer back to Caticlan Airport.' }
    ]
  },
  {
    id: 'batanes-cultural-tour',
    title: 'Batanes Scenic & Cultural Expedition',
    destination: 'Basco, Batanes',
    description: 'Travel to the northernmost frontier. Marvel at rolling hills, traditional stone houses, lighthouses, and experience the warm Ivatan hospitality.',
    price: 24500,
    duration: '5 Days, 4 Nights',
    rating: 4.9,
    reviewsCount: 88,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800', // Scenic coast replacement
    tags: ['Cultural', 'Nature', 'Photography'],
    difficulty: 'Medium',
    spots: ['Marlboro Hills', 'Basco Lighthouse', 'Chawa View Deck', 'Sabtang Island Stone Houses', 'Honesty Coffee Shop'],
    itinerary: [
      { day: 1, title: 'Basco Arrival & North Batan Tour', desc: 'Arrive at Basco Airport. Welcome Ivatan lunch. Tour Mt. Carmel Chapel, Basco Lighthouse, and Naidi Hills.' },
      { day: 2, title: 'South Batan Tour', desc: 'Explore Chawa View Deck, Mahatao shelter port, House of Dakay, and the breathtaking Marlboro Hills.' },
      { day: 3, title: 'Sabtang Island Cultural Immersion', desc: 'Take a Faluwa boat ride to Sabtang. Visit Nakabuang Beach stone arch and Ivana historical village.' },
      { day: 4, title: 'Mt. Iraya Hiking or Free Day', desc: 'Optional trekking at Mt. Iraya or enjoy biking around Basco town at your own pace.' },
      { day: 5, title: 'Farewell Basco', desc: 'Purchase Ivatan Vakul souvenirs and catch your morning flight back to Manila.' }
    ]
  },
  {
    id: 'siargao-surf-adventure',
    title: 'Siargao Surf & Island Hop Adventure',
    destination: 'General Luna, Siargao',
    description: 'Catch the waves at Cloud 9, swim in Sugba Lagoon, and enjoy island hopping to Naked, Daku, and Guyam islands. Stay at a beautiful eco-resort.',
    price: 15800,
    duration: '4 Days, 3 Nights',
    rating: 4.7,
    reviewsCount: 195,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
    tags: ['Adventure', 'Surfing', 'Nature'],
    difficulty: 'Medium',
    spots: ['Cloud 9 Surf Break', 'Sugba Lagoon', 'Daku Island', 'Naked Island', 'Guyam Island', 'Maasin River swing'],
    itinerary: [
      { day: 1, title: 'Welcome to Surf Town & Cloud 9', desc: 'Airport transfer to General Luna. Sunset viewing and beginner surf lesson at the Cloud 9 boardwalk.' },
      { day: 2, title: 'Sugba Lagoon & Maasin River', desc: 'Bamboo rafting and diving boards at Sugba Lagoon. Afternoon swing at Maasin coconut tree river.' },
      { day: 3, title: 'Three Islands Tour', desc: 'Visit Naked Island, Daku Island for fresh coconut lunch, and Guyam Island. Beach bonfire at night.' },
      { day: 4, title: 'Departure', desc: 'Breakfast, check-out, and airport shuttle.' }
    ]
  },
  {
    id: 'cebu-bohol-wonders',
    title: 'Cebu & Bohol Heritage & Wonders Tour',
    destination: 'Cebu & Bohol',
    description: 'A rich tour covering Magellan’s Cross, swimming with Whale Sharks in Oslob, Chocolate Hills, and Loboc River cruise in Bohol.',
    price: 16500,
    duration: '5 Days, 4 Nights',
    rating: 4.6,
    reviewsCount: 154,
    image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800',
    tags: ['Cultural', 'Wildlife', 'Adventure'],
    difficulty: 'Medium',
    spots: ['Chocolate Hills', 'Loboc River', 'Tarsier Sanctuary', 'Oslob Whale Shark swim', 'Kawasan Falls', 'Magellan\'s Cross'],
    itinerary: [
      { day: 1, title: 'Cebu Arrival & Heritage Tour', desc: 'Arrive in Cebu. Visit Magellan\'s Cross, Fort San Pedro, and Temple of Leah.' },
      { day: 2, title: 'Oslob Whale Sharks & Kawasan Falls', desc: 'Early 4:00 AM trip to Oslob for whale shark swimming, followed by canyoneering/swimming at Kawasan Falls.' },
      { day: 3, title: 'Ferry to Bohol & Loboc River Cruise', desc: 'Take fast craft ferry to Tagbilaran. Check-in. Loboc River floating restaurant buffet lunch with folk performances.' },
      { day: 4, title: 'Chocolate Hills & Tarsier Sanctuary', desc: 'View the iconic Chocolate Hills, cross the bamboo hanging bridge, and meet the worlds smallest primates.' },
      { day: 5, title: 'Bohol Departure', desc: 'Free time at Panglao Beach, transfer to Panglao Airport for departure.' }
    ]
  }
];

export const packageService = {
  getAll: async () => {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 300));
    return TOUR_PACKAGES;
  },

  getById: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return TOUR_PACKAGES.find(pkg => pkg.id === id) || null;
  },

  getRecommendations: async (preferences) => {
    await new Promise(resolve => setTimeout(resolve, 400));
    if (!preferences || preferences.length === 0) {
      return TOUR_PACKAGES.slice(0, 3); // Default to top 3 rated
    }
    
    // Filter packages matching preferences (tags)
    return TOUR_PACKAGES.filter(pkg => 
      pkg.tags.some(tag => preferences.includes(tag))
    );
  }
};
