const db = require("../config/db");
const { sendTripReminder } = require("../config/mailer");

const tourReminderQuery = `
    SELECT b.booking_id, b.booking_reference, b.travel_date,
        a.first_name, a.email, p.package_name, p.destination
    FROM booking b
    JOIN account a ON a.account_id = b.account_id
    JOIN tour_package p ON p.package_id = b.package_id
    LEFT JOIN trip_reminder r ON r.reminder_key = CONCAT('tour:', b.booking_id, ':', CURDATE())
    WHERE b.travel_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      AND b.booking_status IN ('Confirmed', 'Rescheduled')
      AND b.deleted_at IS NULL AND a.deleted_at IS NULL AND r.reminder_id IS NULL`;

const rentalReminderQuery = `
    SELECT b.rental_booking_id, b.booking_reference, b.pickup_date,
        b.pickup_location, a.first_name, a.email, v.vehicle_name
    FROM car_rental_booking b
    JOIN account a ON a.account_id = b.account_id
    JOIN vehicle v ON v.vehicle_id = b.vehicle_id
    LEFT JOIN trip_reminder r ON r.reminder_key = CONCAT('rental:', b.rental_booking_id, ':', CURDATE())
    WHERE DATE(b.pickup_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      AND b.booking_status IN ('Confirmed', 'Rescheduled')
      AND b.deleted_at IS NULL AND a.deleted_at IS NULL AND r.reminder_id IS NULL`;

async function sendTripReminders() {
    const [tours] = await db.query(tourReminderQuery);
    const [rentals] = await db.query(rentalReminderQuery);
    let sent = 0;

    for (const booking of tours) {
        if (await sendTripReminder(booking, "tour")) {
            await db.execute("INSERT IGNORE INTO trip_reminder (reminder_key, booking_id, reminder_date) VALUES (CONCAT('tour:', ?, ':', CURDATE()), ?, CURDATE())", [booking.booking_id, booking.booking_id]);
            sent += 1;
        }
    }
    for (const booking of rentals) {
        if (await sendTripReminder(booking, "rental")) {
            await db.execute("INSERT IGNORE INTO trip_reminder (reminder_key, rental_booking_id, reminder_date) VALUES (CONCAT('rental:', ?, ':', CURDATE()), ?, CURDATE())", [booking.rental_booking_id, booking.rental_booking_id]);
            sent += 1;
        }
    }
    if (tours.length || rentals.length) console.log(`[reminders] Processed ${sent} of ${tours.length + rentals.length} trip reminder(s).`);
}

module.exports = { sendTripReminders };
