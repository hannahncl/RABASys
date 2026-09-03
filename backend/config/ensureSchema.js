const db = require("./db");

async function ensureSchema() {
    // 1. Account table
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

    // 2. Session Log table
    await db.query(`CREATE TABLE IF NOT EXISTS session_log (
        session_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id INT UNSIGNED NOT NULL,
        login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        logout_time DATETIME NULL DEFAULT NULL,
        last_activity DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        session_token_hash CHAR(64) NULL DEFAULT NULL,
        expires_at DATETIME NOT NULL DEFAULT '2030-01-01 00:00:00',
        revoked_at DATETIME NULL DEFAULT NULL,
        ip_address VARCHAR(45) NULL DEFAULT NULL,
        user_agent VARCHAR(512) NULL DEFAULT NULL,
        PRIMARY KEY (session_id),
        KEY idx_session_account (account_id),
        KEY idx_session_expires (expires_at),
        CONSTRAINT fk_session_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await db.query(`ALTER TABLE session_log ADD COLUMN IF NOT EXISTS session_token_hash CHAR(64) NULL DEFAULT NULL`);
    await db.query(`ALTER TABLE session_log ADD COLUMN IF NOT EXISTS logout_time DATETIME NULL DEFAULT NULL`);
    await db.query(`ALTER TABLE session_log ADD COLUMN IF NOT EXISTS expires_at DATETIME NOT NULL DEFAULT '2030-01-01 00:00:00'`);
    await db.query(`ALTER TABLE session_log ADD COLUMN IF NOT EXISTS revoked_at DATETIME NULL DEFAULT NULL`);
    await db.query(`ALTER TABLE session_log ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NULL DEFAULT NULL`);
    await db.query(`ALTER TABLE session_log ADD COLUMN IF NOT EXISTS user_agent VARCHAR(512) NULL DEFAULT NULL`);

    // 3. Audit Log table
    await db.query(`CREATE TABLE IF NOT EXISTS audit_log (
        audit_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id INT UNSIGNED NULL DEFAULT NULL,
        session_id INT UNSIGNED NULL DEFAULT NULL,
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(100) NOT NULL DEFAULT 'system',
        record_id VARCHAR(100) NULL DEFAULT NULL,
        old_values JSON NULL,
        new_values JSON NULL,
        ip_address VARCHAR(45) NULL DEFAULT NULL,
        user_agent VARCHAR(512) NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (audit_id),
        KEY idx_audit_account_created (account_id, created_at),
        KEY idx_audit_record (table_name, record_id),
        KEY idx_audit_created (created_at),
        CONSTRAINT fk_audit_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await db.query(`ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS session_id INT UNSIGNED NULL DEFAULT NULL`);
    await db.query(`ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS table_name VARCHAR(100) NOT NULL DEFAULT 'system'`);
    await db.query(`ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS record_id VARCHAR(100) NULL DEFAULT NULL`);
    await db.query(`ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS old_values JSON NULL`);
    await db.query(`ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS new_values JSON NULL`);
    await db.query(`ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) NULL DEFAULT NULL`);
    await db.query(`ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_agent VARCHAR(512) NULL DEFAULT NULL`);

    // 4. Password Reset OTP
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

    // 5. Login OTP
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

    // 6. Tour Package
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
        image LONGTEXT NULL,
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
        await db.query(`ALTER TABLE tour_package ADD COLUMN image LONGTEXT NULL`);
    }

    // 7. Vehicle
    await db.query(`CREATE TABLE IF NOT EXISTS vehicle (
        vehicle_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        media_id INT UNSIGNED NULL,
        vehicle_name VARCHAR(255) NOT NULL,
        vehicle_type VARCHAR(100) NOT NULL DEFAULT 'Car',
        plate_number VARCHAR(100) NOT NULL,
        capacity INT UNSIGNED NOT NULL DEFAULT 1,
        daily_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        image LONGTEXT NULL,
        availability_status VARCHAR(50) NOT NULL DEFAULT 'Available',
        fuel_type VARCHAR(50) NULL DEFAULT NULL,
        vehicle_brand VARCHAR(100) NULL DEFAULT NULL,
        transmission VARCHAR(50) NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (vehicle_id),
        UNIQUE KEY uq_vehicle_plate_number (plate_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    const [fuelTypeCol] = await db.query(`SHOW COLUMNS FROM vehicle LIKE 'fuel_type'`);
    if (!fuelTypeCol.length) {
        await db.query(`ALTER TABLE vehicle ADD COLUMN fuel_type VARCHAR(50) NULL DEFAULT NULL`);
    }
    const [brandCol] = await db.query(`SHOW COLUMNS FROM vehicle LIKE 'vehicle_brand'`);
    if (!brandCol.length) {
        await db.query(`ALTER TABLE vehicle ADD COLUMN vehicle_brand VARCHAR(100) NULL DEFAULT NULL`);
    }
    const [transmissionCol] = await db.query(`SHOW COLUMNS FROM vehicle LIKE 'transmission'`);
    if (!transmissionCol.length) {
        await db.query(`ALTER TABLE vehicle ADD COLUMN transmission VARCHAR(50) NULL DEFAULT NULL`);
    }

    // 8. Tour Guide
    await db.query(`CREATE TABLE IF NOT EXISTS tour_guide (
        guide_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id INT UNSIGNED NOT NULL,
        media_id INT UNSIGNED NULL DEFAULT NULL,
        sex VARCHAR(20) NULL DEFAULT 'Male',
        birthdate DATE NULL DEFAULT NULL,
        years_of_experience INT UNSIGNED NULL DEFAULT 0,
        description TEXT NULL DEFAULT NULL,
        languages_spoken VARCHAR(255) NULL DEFAULT NULL,
        availability_status VARCHAR(50) NOT NULL DEFAULT 'Available',
        employment_status VARCHAR(50) NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (guide_id),
        KEY idx_tour_guide_account (account_id),
        CONSTRAINT fk_tour_guide_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // 9. Booking (Tour Bookings)
    await db.query(`CREATE TABLE IF NOT EXISTS booking (
        booking_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id INT UNSIGNED NOT NULL,
        package_id INT UNSIGNED NOT NULL,
        guide_id INT UNSIGNED NULL DEFAULT NULL,
        booking_reference VARCHAR(100) NOT NULL,
        booking_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        travel_date DATE NOT NULL,
        number_of_persons INT UNSIGNED NOT NULL DEFAULT 1,
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        booking_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (booking_id),
        KEY idx_booking_account (account_id),
        KEY idx_booking_package (package_id),
        KEY idx_booking_guide (guide_id),
        CONSTRAINT fk_booking_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_booking_package FOREIGN KEY (package_id) REFERENCES tour_package(package_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // 10. Car Rental Booking
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
        payment_method VARCHAR(50) NULL DEFAULT 'GCash',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (rental_booking_id),
        KEY idx_rental_account (account_id),
        KEY idx_rental_vehicle (vehicle_id),
        CONSTRAINT fk_rental_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_rental_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(vehicle_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // 11. Review
    await db.query(`CREATE TABLE IF NOT EXISTS review (
        review_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id INT UNSIGNED NOT NULL,
        package_id INT UNSIGNED NOT NULL,
        booking_id INT UNSIGNED NULL DEFAULT NULL,
        rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
        comment TEXT NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (review_id),
        KEY idx_review_account (account_id),
        KEY idx_review_package (package_id),
        CONSTRAINT fk_review_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_review_package FOREIGN KEY (package_id) REFERENCES tour_package(package_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // 12. Notification
    await db.query(`CREATE TABLE IF NOT EXISTS notification (
        notification_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id INT UNSIGNED NOT NULL,
        booking_id INT UNSIGNED NULL DEFAULT NULL,
        payment_id INT UNSIGNED NULL DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        notification_type VARCHAR(50) NOT NULL DEFAULT 'General',
        delivery_method VARCHAR(50) NULL DEFAULT 'InApp',
        email_status VARCHAR(50) NULL DEFAULT 'Pending',
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_by INT UNSIGNED NULL DEFAULT NULL,
        sent_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (notification_id),
        KEY idx_notification_account (account_id),
        CONSTRAINT fk_notification_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // 13. Payment
    await db.query(`CREATE TABLE IF NOT EXISTS payment (
        payment_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        booking_id INT UNSIGNED NULL DEFAULT NULL,
        rental_booking_id INT UNSIGNED NULL DEFAULT NULL,
        transaction_reference VARCHAR(100) NULL DEFAULT NULL,
        payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        payment_method VARCHAR(50) NOT NULL DEFAULT 'GCash',
        payment_status VARCHAR(50) NOT NULL DEFAULT 'Completed',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (payment_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // 14. Reschedule Request
    await db.query(`CREATE TABLE IF NOT EXISTS reschedule_request (
        reschedule_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        booking_id INT UNSIGNED NULL DEFAULT NULL,
        rental_booking_id INT UNSIGNED NULL DEFAULT NULL,
        current_schedule_date DATETIME NULL DEFAULT NULL,
        requested_schedule_date DATETIME NOT NULL,
        reason TEXT NULL DEFAULT NULL,
        request_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        requested_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
        approved_by INT UNSIGNED NULL DEFAULT NULL,
        approved_at DATETIME NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (reschedule_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // 15. Recommendation Preference
    await db.query(`CREATE TABLE IF NOT EXISTS recommendation_preference (
        preference_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id INT UNSIGNED NOT NULL,
        preferred_destination_type VARCHAR(100) NULL DEFAULT NULL,
        preferred_duration VARCHAR(100) NULL DEFAULT NULL,
        budget_range VARCHAR(100) NULL DEFAULT NULL,
        travel_style VARCHAR(100) NULL DEFAULT NULL,
        preferred_activity VARCHAR(100) NULL DEFAULT NULL,
        group_type VARCHAR(100) NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (preference_id),
        KEY idx_pref_account (account_id),
        CONSTRAINT fk_pref_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // 16. Media
    await db.query(`CREATE TABLE IF NOT EXISTS media (
        media_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        file_path VARCHAR(500) NOT NULL,
        media_type VARCHAR(50) NOT NULL DEFAULT 'image',
        uploaded_by INT UNSIGNED NULL DEFAULT NULL,
        title VARCHAR(255) NULL DEFAULT NULL,
        description TEXT NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (media_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // 17. Content
    await db.query(`CREATE TABLE IF NOT EXISTS content (
        content_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        media_id INT UNSIGNED NULL DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NULL DEFAULT NULL,
        content_type VARCHAR(50) NOT NULL DEFAULT 'announcement',
        display_order INT UNSIGNED NULL DEFAULT 0,
        is_active TINYINT(1) NULL DEFAULT 1,
        created_by INT UNSIGNED NULL DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (content_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    // 18. Package Media
    await db.query(`CREATE TABLE IF NOT EXISTS package_media (
        package_media_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        package_id INT UNSIGNED NOT NULL,
        media_id INT UNSIGNED NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (package_media_id),
        CONSTRAINT fk_pm_package FOREIGN KEY (package_id) REFERENCES tour_package(package_id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_pm_media FOREIGN KEY (media_id) REFERENCES media(media_id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

module.exports = { ensureSchema };
