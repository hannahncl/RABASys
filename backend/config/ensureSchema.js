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
        two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (account_id),
        UNIQUE KEY uq_account_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    const [twoFactorColumns] = await db.query(`SHOW COLUMNS FROM account LIKE 'two_factor_enabled'`);
    if (!twoFactorColumns.length) {
        await db.query(`ALTER TABLE account ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0`);
    }

    await db.query(`CREATE TABLE IF NOT EXISTS session_log (
        session_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id INT UNSIGNED NOT NULL,
        login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        session_token_hash CHAR(64) NULL DEFAULT NULL,
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (session_id),
        KEY idx_session_account (account_id),
        KEY idx_session_expires (expires_at),
        CONSTRAINT fk_session_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await db.query(`ALTER TABLE session_log ADD COLUMN IF NOT EXISTS session_token_hash CHAR(64) NULL DEFAULT NULL`);
    await db.query(`ALTER TABLE session_log ADD COLUMN IF NOT EXISTS expires_at DATETIME NOT NULL DEFAULT '2030-01-01 00:00:00'`);
    await db.query(`ALTER TABLE session_log ADD COLUMN IF NOT EXISTS revoked_at DATETIME NULL DEFAULT NULL`);

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

<<<<<<< HEAD
=======
    await db.query(`CREATE TABLE IF NOT EXISTS login_otp (
        login_otp_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id INT UNSIGNED NOT NULL,
        otp_hash CHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
        used_at DATETIME NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (login_otp_id),
        KEY idx_login_otp_account (account_id),
        KEY idx_login_otp_expires (expires_at),
        CONSTRAINT fk_login_otp_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

>>>>>>> 8fc067db244f7dc5aedbc1e06bdfb72a5f93c080
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
<<<<<<< HEAD
        image VARCHAR(500) NULL,
=======
        package_type VARCHAR(50) NOT NULL DEFAULT 'tour',
        image LONGTEXT NULL,
>>>>>>> 8fc067db244f7dc5aedbc1e06bdfb72a5f93c080
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (package_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

<<<<<<< HEAD
=======
    const [packageTypeColumns] = await db.query(`SHOW COLUMNS FROM tour_package LIKE 'package_type'`);
    if (!packageTypeColumns.length) {
        await db.query(`ALTER TABLE tour_package ADD COLUMN package_type VARCHAR(50) NOT NULL DEFAULT 'tour'`);
    }

    const [imageColumns] = await db.query(`SHOW COLUMNS FROM tour_package LIKE 'image'`);
    if (!imageColumns.length) {
        await db.query(`ALTER TABLE tour_package ADD COLUMN image TEXT NULL`);
    }

>>>>>>> 8fc067db244f7dc5aedbc1e06bdfb72a5f93c080
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
