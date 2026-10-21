const db = require('./db');

// The project runs on Supabase/PostgreSQL. Keep this repair small and
// idempotent so it can safely run on every server start and fix databases
// created by the old MySQL-oriented schema initializer.
async function ensurePostgresSchema() {
    await db.query(`
        ALTER TABLE vehicle ALTER COLUMN vehicle_id DROP IDENTITY IF EXISTS;
        CREATE SEQUENCE IF NOT EXISTS vehicle_vehicle_id_seq;
        SELECT setval('vehicle_vehicle_id_seq', COALESCE((SELECT MAX(vehicle_id) FROM vehicle), 0) + 1, false);
        ALTER TABLE vehicle ALTER COLUMN vehicle_id SET DEFAULT nextval('vehicle_vehicle_id_seq');
    `);

    await db.query(`
        ALTER TABLE audit_log ALTER COLUMN audit_id DROP IDENTITY IF EXISTS;
        CREATE SEQUENCE IF NOT EXISTS audit_log_audit_id_seq;
        SELECT setval('audit_log_audit_id_seq', COALESCE((SELECT MAX(audit_id) FROM audit_log), 0) + 1, false);
        ALTER TABLE audit_log ALTER COLUMN audit_id SET DEFAULT nextval('audit_log_audit_id_seq');
    `);

    await db.query(`
        ALTER TABLE car_rental_booking ALTER COLUMN rental_booking_id DROP IDENTITY IF EXISTS;
        CREATE SEQUENCE IF NOT EXISTS car_rental_booking_rental_booking_id_seq;
        SELECT setval('car_rental_booking_rental_booking_id_seq', COALESCE((SELECT MAX(rental_booking_id) FROM car_rental_booking), 0) + 1, false);
        ALTER TABLE car_rental_booking ALTER COLUMN rental_booking_id SET DEFAULT nextval('car_rental_booking_rental_booking_id_seq');
    `);

    await db.query(`
        ALTER TABLE notification ALTER COLUMN notification_id DROP IDENTITY IF EXISTS;
        CREATE SEQUENCE IF NOT EXISTS notification_notification_id_seq;
        SELECT setval('notification_notification_id_seq', COALESCE((SELECT MAX(notification_id) FROM notification), 0) + 1, false);
        ALTER TABLE notification ALTER COLUMN notification_id SET DEFAULT nextval('notification_notification_id_seq');
    `);

    await db.query(`
        ALTER TABLE vehicle DROP CONSTRAINT IF EXISTS ck_vehicle_availability_status;
        ALTER TABLE vehicle ADD CONSTRAINT ck_vehicle_availability_status
            CHECK (availability_status IN ('Available', 'Unavailable', 'Maintenance', 'Deactivated'));
    `);

    // Vehicle reviews were added after the original PostgreSQL schema. The
    // vehicle listing query depends on these columns even when no reviews
    // exist, so they must be present on every database.
    await db.query(`
        ALTER TABLE review ADD COLUMN IF NOT EXISTS vehicle_id INTEGER NULL;
        ALTER TABLE review ADD COLUMN IF NOT EXISTS rental_booking_id INTEGER NULL;
        CREATE INDEX IF NOT EXISTS idx_review_vehicle ON review (vehicle_id);
        CREATE INDEX IF NOT EXISTS idx_review_rental ON review (rental_booking_id);
    `);

    // Joiner tour fields were added in the application after the original
    // PostgreSQL schema. Keep these nullable so existing tour packages remain
    // valid while allowing joiner packages to be created.
    await db.query(`
        ALTER TABLE tour_package ADD COLUMN IF NOT EXISTS joiner_date DATE NULL;
        ALTER TABLE tour_package ADD COLUMN IF NOT EXISTS joiner_slots INTEGER NULL;
        ALTER TABLE tour_package ADD COLUMN IF NOT EXISTS joiner_booking_deadline DATE NULL;
    `);

    // Admin deactivation uses a distinct status so unavailable packages are
    // hidden from public booking without being deleted.
    await db.query(`
        ALTER TABLE tour_package DROP CONSTRAINT IF EXISTS ck_tour_package_availability_status;
        ALTER TABLE tour_package ADD CONSTRAINT ck_tour_package_availability_status
            CHECK (availability_status IN ('Available', 'Unavailable', 'Deactivated'));
    `);
}

module.exports = { ensurePostgresSchema };
