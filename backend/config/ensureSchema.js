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

    await db.query(`CREATE TABLE IF NOT EXISTS tour_package (
        package_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        package_name VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NULL,
        description TEXT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        duration VARCHAR(100) NULL,
        inclusion JSON NULL,
        max_capacity INT UNSIGNED NULL,
        meeting_location VARCHAR(255) NULL,
        itinerary JSON NULL,
        availability_status VARCHAR(50) NOT NULL DEFAULT 'Available',
        package_type VARCHAR(50) NOT NULL DEFAULT 'tour',
        image TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (package_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    const [packageTypeColumns] = await db.query(`SHOW COLUMNS FROM tour_package LIKE 'package_type'`);
    if (!packageTypeColumns.length) {
        await db.query(`ALTER TABLE tour_package ADD COLUMN package_type VARCHAR(50) NOT NULL DEFAULT 'tour'`);
    }

    const [imageColumns] = await db.query(`SHOW COLUMNS FROM tour_package LIKE 'image'`);
    if (!imageColumns.length) {
        await db.query(`ALTER TABLE tour_package ADD COLUMN image TEXT NULL`);
    }

    await db.query(`CREATE TABLE IF NOT EXISTS vehicle (
        vehicle_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        media_id INT UNSIGNED NULL,
        vehicle_name VARCHAR(255) NOT NULL,
        vehicle_type VARCHAR(100) NOT NULL,
        plate_number VARCHAR(100) NOT NULL,
        capacity INT UNSIGNED NOT NULL DEFAULT 1,
        daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        image VARCHAR(500) NULL,
        availability_status VARCHAR(50) NOT NULL DEFAULT 'Available',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (vehicle_id),
        UNIQUE KEY uq_vehicle_plate_number (plate_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

module.exports = { ensureSchema };
