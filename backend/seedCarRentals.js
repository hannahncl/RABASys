require('dotenv').config({ quiet: true });
const { Pool } = require('pg');

const vehicles = [
  {
    name: 'Toyota Vios 1.3 XLE', type: 'Sedan', plate: 'RABAS-001', capacity: 5,
    rate: 1800, image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80',
    fuel: 'Gasoline', brand: 'Toyota', transmission: 'Automatic',
  },
  {
    name: 'Mitsubishi Xpander GLS', type: 'MPV', plate: 'RABAS-002', capacity: 7,
    rate: 3000, image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80',
    fuel: 'Gasoline', brand: 'Mitsubishi', transmission: 'Automatic',
  },
  {
    name: 'Toyota HiAce Commuter', type: 'Van', plate: 'RABAS-003', capacity: 15,
    rate: 5500, image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80',
    fuel: 'Diesel', brand: 'Toyota', transmission: 'Manual',
  },
  {
    name: 'Toyota Innova 2.0 XE', type: 'SUV / MPV', plate: 'RABAS-004', capacity: 7,
    rate: 3500, image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
    fuel: 'Diesel', brand: 'Toyota', transmission: 'Automatic',
  },
  {
    name: 'Suzuki Jimny 1.5', type: 'Compact 4x4', plate: 'RABAS-005', capacity: 4,
    rate: 2800, image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80',
    fuel: 'Gasoline', brand: 'Suzuki', transmission: 'Automatic',
  },
];

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  for (const vehicle of vehicles) {
    const result = await pool.query(`
      INSERT INTO vehicle
        (vehicle_name, vehicle_type, plate_number, capacity, daily_rate, image,
         availability_status, fuel_type, vehicle_brand, transmission)
      SELECT $1::varchar, $2, $3, $4, $5, $6, 'Available', $7, $8, $9
      WHERE NOT EXISTS (
        SELECT 1 FROM vehicle WHERE vehicle_name = $1::varchar AND deleted_at IS NULL
      )
      RETURNING vehicle_id, vehicle_name
    `, [vehicle.name, vehicle.type, vehicle.plate, vehicle.capacity, vehicle.rate, vehicle.image, vehicle.fuel, vehicle.brand, vehicle.transmission]);
    console.log(result.rows[0] || { skipped: vehicle.name });
  }
  await pool.end();
})().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exitCode = 1;
});
