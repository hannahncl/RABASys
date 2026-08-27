const db = require('./config/db');

(async () => {
  try {
    const [rows] = await db.query(
      'SELECT vehicle_id, vehicle_name, fuel_type, vehicle_brand, transmission FROM vehicle WHERE deleted_at IS NULL LIMIT 5'
    );
    console.log('=== Vehicle Records ===');
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();
