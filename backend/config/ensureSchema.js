const db = require("./db");

async function ensureSchema() {
    await db.query(`CREATE TABLE IF NOT EXISTS account (
        account_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        contact_number VARCHAR(50) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Customer',
        account_status VARCHAR(50) NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (account_id),
        UNIQUE KEY uq_account_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await db.query(`CREATE TABLE IF NOT EXISTS session_log (
        session_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id INT UNSIGNED NOT NULL,
        login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id),
        KEY idx_session_account (account_id),
        CONSTRAINT fk_session_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await db.query(`CREATE TABLE IF NOT EXISTS password_reset_otp (
        reset_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id INT UNSIGNED NOT NULL,
        otp_hash CHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
        used_at DATETIME NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (reset_id),
        KEY idx_reset_account (account_id),
        KEY idx_reset_expires (expires_at),
        CONSTRAINT fk_password_reset_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await db.query(`CREATE TABLE IF NOT EXISTS vehicle (
        vehicle_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        media_id INT UNSIGNED NULL DEFAULT NULL,
        vehicle_name VARCHAR(150) NOT NULL,
        vehicle_type VARCHAR(100) NOT NULL,
        plate_number VARCHAR(50) NULL DEFAULT NULL,
        capacity INT UNSIGNED NOT NULL DEFAULT 4,
        daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        availability_status VARCHAR(50) NOT NULL DEFAULT 'Available',
        image LONGTEXT NULL DEFAULT NULL,
        description TEXT NULL DEFAULT NULL,
        color VARCHAR(50) NULL DEFAULT NULL,
        pickup_location VARCHAR(255) NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (vehicle_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await db.query(`ALTER TABLE vehicle
        ADD COLUMN IF NOT EXISTS image TEXT NULL DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS description TEXT NULL DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS color VARCHAR(50) NULL DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS pickup_location VARCHAR(255) NULL DEFAULT NULL`);

    await db.query(`ALTER TABLE vehicle MODIFY COLUMN image LONGTEXT NULL DEFAULT NULL`);

    await db.query(`CREATE TABLE IF NOT EXISTS car_rental_booking (
        rental_booking_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id INT UNSIGNED NOT NULL,
        vehicle_id INT UNSIGNED NOT NULL,
        booking_reference VARCHAR(100) NOT NULL,
        booking_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        pickup_date DATETIME NOT NULL,
        return_date DATETIME NOT NULL,
        pickup_location VARCHAR(255) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        booking_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        driver_name VARCHAR(200) NULL DEFAULT NULL,
        driver_age VARCHAR(20) NULL DEFAULT NULL,
        driver_phone VARCHAR(50) NULL DEFAULT NULL,
        driver_email VARCHAR(255) NULL DEFAULT NULL,
        license_number VARCHAR(100) NULL DEFAULT NULL,
        issuing_country VARCHAR(100) NULL DEFAULT NULL,
        expiration_date VARCHAR(50) NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (rental_booking_id),
        UNIQUE KEY uq_booking_reference (booking_reference),
        KEY idx_rental_booking_account (account_id),
        KEY idx_rental_booking_vehicle (vehicle_id),
        CONSTRAINT fk_rental_booking_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_rental_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

module.exports = { ensureSchema };
