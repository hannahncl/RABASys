const activeRentalStatuses = "('Pending', 'Confirmed', 'Rescheduled')";

// Rental dates are calendar-day reservations. Both pickup and return dates are
// treated as occupied so a vehicle cannot be selected twice on the same day.
async function findRentalConflict(queryable, vehicleId, pickupDate, returnDate, excludeBookingId = null) {
    const values = [vehicleId, returnDate, pickupDate];
    let exclusion = '';
    if (excludeBookingId !== null && excludeBookingId !== undefined) {
        values.push(excludeBookingId);
        exclusion = `AND rental_booking_id <> $${values.length}`;
    }

    const { rows } = await queryable.query(
        `SELECT rental_booking_id, pickup_date, return_date
         FROM car_rental_booking
         WHERE vehicle_id = $1
           AND booking_status IN ${activeRentalStatuses}
           AND deleted_at IS NULL
           AND pickup_date::date <= $2::date
           AND return_date::date >= $3::date
           ${exclusion}
         LIMIT 1`,
        values
    );
    return rows[0] || null;
}

module.exports = { findRentalConflict };
