const express = require("express");
const db = require("../config/db");
const { requireAuth, allowRoles } = require("../middleware/auth");

// Only these known tables/columns can be used. This avoids dynamic SQL from request input.
const resources = {
    accounts: { table: "account", id: "account_id", fields: ["first_name", "last_name", "email", "contact_number", "role", "account_status"] },
    packages: { table: "tour_package", id: "package_id", fields: ["package_name", "destination", "description", "price", "duration", "inclusion", "max_capacity", "meeting_location", "itinerary", "availability_status"] },
    vehicles: { table: "vehicle", id: "vehicle_id", fields: ["media_id", "vehicle_name", "vehicle_type", "plate_number", "capacity", "daily_rate", "availability_status", "image", "description", "color", "pickup_location"] },
    guides: { table: "tour_guide", id: "guide_id", fields: ["account_id", "media_id", "sex", "birthdate", "years_of_experience", "description", "languages_spoken", "availability_status", "employment_status"] },
    media: { table: "media", id: "media_id", fields: ["file_path", "media_type", "uploaded_by", "title", "description"] },
    content: { table: "content", id: "content_id", fields: ["media_id", "title", "content", "content_type", "display_order", "is_active", "created_by"] },
    packageMedia: { table: "package_media", id: "package_media_id", fields: ["package_id", "media_id"] },
    preferences: { table: "recommendation_preference", id: "preference_id", fields: ["account_id", "preferred_destination_type", "preferred_duration", "budget_range", "travel_style", "preferred_activity", "group_type"], softDelete: false },
    notifications: { table: "notification", id: "notification_id", fields: ["account_id", "booking_id", "payment_id", "title", "message", "notification_type", "delivery_method", "email_status", "is_read", "created_by", "sent_at"] },
    rescheduleRequests: { table: "reschedule_request", id: "reschedule_id", fields: ["booking_id", "rental_booking_id", "current_schedule_date", "requested_schedule_date", "reason", "request_status", "requested_at", "approved_by", "approved_at"] },
    payments: { table: "payment", id: "payment_id", fields: ["booking_id", "rental_booking_id", "transaction_reference", "payment_date", "amount", "payment_method", "payment_status"] },
    reviews: { table: "review", id: "review_id", fields: ["account_id", "package_id", "booking_id", "rating", "comment"] },
    rentalBookings: { table: "car_rental_booking", id: "rental_booking_id", fields: ["account_id", "vehicle_id", "booking_reference", "booking_date", "pickup_date", "return_date", "pickup_location", "total_amount", "booking_status", "driver_name", "driver_age", "driver_phone", "driver_email", "license_number", "issuing_country", "expiration_date"] },
    sessionLogs: { table: "session_log", id: "session_id", fields: ["account_id", "login_time", "logout_time", "last_activity"], softDelete: false }
};

function selected(resource, input) {
    return resource.fields.filter((field) => Object.prototype.hasOwnProperty.call(input, field));
}

async function createVehicleMediaIfNeeded(req, payload) {
    if (!payload || typeof payload !== "object") return payload;
    if (payload.image === undefined || payload.image === null || String(payload.image).trim() === "") return payload;
    if (payload.media_id !== undefined && payload.media_id !== null && payload.media_id !== "") return payload;

    const imageValue = String(payload.image).trim();
    const [mediaResult] = await db.execute(
        "INSERT INTO media (file_path, media_type, uploaded_by, title, description) VALUES (?, ?, ?, ?, ?)",
        [imageValue, "image", req.user?.accountId || null, payload.vehicle_name || payload.title || "Vehicle image", payload.description || null]
    );

    payload.media_id = mediaResult.insertId;
    delete payload.image;
    return payload;
}

async function hydrateVehicleRows(rows) {
    if (!Array.isArray(rows) || !rows.length) return rows;
    const mediaIds = [...new Set(rows.filter((row) => row && row.media_id).map((row) => row.media_id))];
    if (!mediaIds.length) return rows;

    const placeholders = mediaIds.map(() => "?").join(", ");
    const [mediaRows] = await db.query(`SELECT media_id, file_path FROM media WHERE media_id IN (${placeholders})`, mediaIds);
    const mediaMap = new Map(mediaRows.map((row) => [row.media_id, row.file_path]));

    return rows.map((row) => ({
        ...row,
        image: row.image || mediaMap.get(row.media_id) || null
    }));
}

function addCrud(router, path, resource) {
    const whereActive = resource.softDelete === false ? "" : " WHERE deleted_at IS NULL";
    const readMiddleware = path === "packages" || path === "vehicles" ? [] : [requireAuth];
    const writeMiddleware = path === "rentalBookings" ? [requireAuth] : [requireAuth, allowRoles("Admin")];
    router.get(`/${path}`, ...readMiddleware, async (req, res, next) => {
        try {
            const [rows] = await db.query(`SELECT * FROM \`${resource.table}\`${whereActive} ORDER BY \`${resource.id}\` DESC`);
            const responseRows = path === "vehicles" ? await hydrateVehicleRows(rows) : rows;
            res.json(responseRows);
        } catch (e) { next(e); }
    });
    router.get(`/${path}/:id`, ...readMiddleware, async (req, res, next) => {
        try {
            const [rows] = await db.execute(`SELECT * FROM \`${resource.table}\` WHERE \`${resource.id}\` = ?${resource.softDelete === false ? "" : " AND deleted_at IS NULL"}`, [req.params.id]);
            if (!rows[0]) return res.status(404).json({ message: "Record not found." });
            const [responseRow] = path === "vehicles" ? await hydrateVehicleRows([rows[0]]) : [rows[0]];
            res.json(responseRow);
        } catch (e) { next(e); }
    });
    router.post(`/${path}`, ...writeMiddleware, async (req, res, next) => {
        try {
            const payload = { ...req.body };
            if (path === "rentalBookings" && req.user?.accountId && !Object.prototype.hasOwnProperty.call(payload, "account_id")) {
                payload.account_id = req.user.accountId;
            }
            if (path === "vehicles") {
                await createVehicleMediaIfNeeded(req, payload);
            }
            const fields = selected(resource, payload);
            if (!fields.length) return res.status(400).json({ message: "No valid fields supplied." });
            const [result] = await db.execute(`INSERT INTO \`${resource.table}\` (${fields.map(f => `\`${f}\``).join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`, fields.map(f => payload[f]));
            const [rows] = await db.execute(`SELECT * FROM \`${resource.table}\` WHERE \`${resource.id}\` = ?`, [result.insertId]);
            const [responseRow] = path === "vehicles" ? await hydrateVehicleRows([rows[0]]) : [rows[0]];
            res.status(201).json(responseRow);
        } catch (e) { next(e); }
    });
    router.patch(`/${path}/:id`, ...writeMiddleware, async (req, res, next) => {
        try {
            const payload = { ...req.body };
            if (path === "vehicles") {
                await createVehicleMediaIfNeeded(req, payload);
            }
            const fields = selected(resource, payload);
            if (!fields.length) return res.status(400).json({ message: "No valid fields supplied." });
            const [result] = await db.execute(`UPDATE \`${resource.table}\` SET ${fields.map(f => `\`${f}\` = ?`).join(", ")} WHERE \`${resource.id}\` = ?${resource.softDelete === false ? "" : " AND deleted_at IS NULL"}`, [...fields.map(f => payload[f]), req.params.id]);
            if (!result.affectedRows) return res.status(404).json({ message: "Record not found." });
            const [rows] = await db.execute(`SELECT * FROM \`${resource.table}\` WHERE \`${resource.id}\` = ?`, [req.params.id]);
            const [responseRow] = path === "vehicles" ? await hydrateVehicleRows([rows[0]]) : [rows[0]];
            res.json(responseRow);
        } catch (e) { next(e); }
    });
    router.delete(`/${path}/:id`, ...writeMiddleware, async (req, res, next) => {
        try { const sql = resource.softDelete === false ? `DELETE FROM \`${resource.table}\` WHERE \`${resource.id}\` = ?` : `UPDATE \`${resource.table}\` SET deleted_at = NOW() WHERE \`${resource.id}\` = ? AND deleted_at IS NULL`; const [result] = await db.execute(sql, [req.params.id]); if (!result.affectedRows) return res.status(404).json({ message: "Record not found." }); res.status(204).end(); } catch (e) { next(e); }
    });
}

const router = express.Router();
Object.entries(resources).forEach(([path, resource]) => addCrud(router, path, resource));
module.exports = router;
