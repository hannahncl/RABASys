require('dotenv').config({ quiet: true });
const { Pool } = require('pg');

const packages = [
  {
    name: 'Albay Mayon Adventure Escape',
    destination: 'Legazpi City, Albay',
    description: 'A 2-day Bicol escape combining Mayon Volcano views, heritage landmarks, outdoor adventure, and local flavors.',
    accommodations: 'A Vela Hotel or a comparable Legazpi City hotel; daily breakfast included.',
    price: 18500,
    duration: '2 Days, 1 Night',
    inclusions: ['1 night hotel accommodation', 'Daily breakfast', 'Cagsawa Ruins, Daraga Church, Quitinday Hills, Sumlang Lake, and Legazpi Boulevard visits', 'ATV and zipline activity at the foot of Mayon Volcano', 'Local culinary tasting featuring Bicol Express and sili ice cream', 'Private tour transportation and local coordinator'],
    capacity: 6,
    meetingLocation: 'Legazpi City Center or Legazpi Airport',
    itinerary: ['Day 1: Meet at Legazpi City Center or the airport; visit Daraga Church, Cagsawa Ruins, Quitinday Hills, and Sumlang Lake; check in; enjoy the Legazpi Boulevard coastal view.', 'Day 2: Breakfast; Mayon-area ATV and zipline adventure; Farmplate food and chapel stop; local culinary tasting; return transfer.'],
    type: 'exclusive',
    image: '/ALBAY.jpg',
  },
  {
    name: 'Calaguas Island Camping Weekend',
    destination: 'Calaguas, Camarines Norte',
    description: 'A shared island weekend with white-sand beaches, Balagbag hilltop views, snorkeling, and full-board camping.',
    accommodations: 'Tent camping at a Calaguas island campsite or partner resort; shared tents and basic island facilities.',
    price: 45600,
    duration: '3 Days, 2 Nights',
    inclusions: ['Round-trip group transport from Albay/Bicol pickup point', 'Boat transfers to and from Calaguas', 'Tent pitching and 2 nights camping', 'Breakfast, lunch, and dinner for the tour', 'Balagbag trekking and Halabang Baybay viewpoint', 'Snorkeling and island activities', 'Trip coordination and environmental/boat fees'],
    capacity: 12,
    meetingLocation: 'Albay/BIA pickup point',
    itinerary: ['Day 1: Pickup in Albay/BIA; travel to the port; boat transfer to Calaguas; set up camp; beach time and dinner.', 'Day 2: Breakfast; Balagbag trek and Halabang Baybay viewpoint; snorkeling and island swim; lunch, free beach time, and dinner.', 'Day 3: Breakfast; final beach time and campsite cleanup; boat transfer back; return group transfer.'],
    type: 'joiner',
    image: '/CALAGUAS.jpg',
    joinerDate: '2026-12-12',
    deadline: '2026-12-08',
    slots: 12,
  },
  {
    name: 'Caramoan Island Hopping Escape',
    destination: 'Caramoan, Camarines Sur',
    description: "A 3-day island-hopping escape through Caramoan's limestone scenery, clear coves, sandbars, and island beaches.",
    accommodations: 'Overnight accommodation in Paniman, Caramoan, in a partner inn or comparable guesthouse.',
    price: 28500,
    duration: '3 Days, 2 Nights',
    inclusions: ['2 nights accommodation in Paniman, Caramoan', 'Private round-trip land and boat transfers', 'Island-hopping route covering Matukad, Lahus, Cagbalinad, Minalahos, Guinahoan, and nearby sandbars, subject to sea conditions', 'Snorkeling stop with local boat crew', 'Presentation River and Tierras Altas Cafe visit', 'Local tour coordinator and standard environmental/boat fees'],
    capacity: 6,
    meetingLocation: 'Naga City or Caramoan pickup point',
    itinerary: ['Day 1: Pickup; travel to Caramoan; check in at Paniman; visit Presentation River and Tierras Altas Cafe.', 'Day 2: Full-day island hopping at Matukad, Lahus, Cagbalinad, Minalahos, and nearby sandbars; snorkeling and beach time.', 'Day 3: Visit Guinahoan Island and coastal viewpoints; final swim or beach stop; return transfer.'],
    type: 'exclusive',
    image: '/CARAMOAN.jpg',
  },
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  for (const pkg of packages) {
    const result = await pool.query(`
      INSERT INTO tour_package
        (package_name, destination, description, accommodations, price, duration, inclusion,
         max_capacity, meeting_location, itinerary, availability_status, package_type,
         image, images, joiner_date, joiner_slots, joiner_booking_deadline, joiner_downpayment_percent)
      SELECT $1::varchar, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10::jsonb, 'Available', $11,
             $12, $13::jsonb, $14, $15, $16, $17
      WHERE NOT EXISTS (
        SELECT 1 FROM tour_package WHERE package_name = $1::varchar AND deleted_at IS NULL
      )
      RETURNING package_id, package_name
    `, [
      pkg.name, pkg.destination, pkg.description, pkg.accommodations, pkg.price, pkg.duration,
      JSON.stringify(pkg.inclusions), pkg.capacity, pkg.meetingLocation, JSON.stringify(pkg.itinerary),
      pkg.type, pkg.image, JSON.stringify([pkg.image]), pkg.joinerDate || null, pkg.slots || null,
      pkg.deadline || null, 30,
    ]);
    console.log(result.rows[0] || { skipped: pkg.name });
  }
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exitCode = 1;
});
