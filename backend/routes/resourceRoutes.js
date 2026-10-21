const express = require("express");
const db = require("../config/db");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { logAudit } = require("../utils/auditLogger");

// Only these known tables/columns can be used. This avoids dynamic SQL from request input.
const resources = {
    accounts: { table: "account", id: "account_id", fields: ["first_name", "last_name", "email", "contact_number", "role", "account_status"] },
    packages: { table: "tour_package", id: "package_id", fields: ["package_name", "destination", "description", "price", "duration", "inclusion", "max_capacity", "meeting_location", "itinerary", "availability_status", "package_type", "image", "joiner_date", "joiner_slots", "joiner_booking_deadline"] },
    vehicles: { table: "vehicle", id: "vehicle_id", fields: ["media_id", "vehicle_name", "vehicle_type", "plate_number", "capacity", "daily_rate", "image", "availability_status", "fuel_type", "vehicle_brand", "transmission"] },
    guides: { table: "tour_guide", id: "guide_id", fields: ["account_id", "media_id", "sex", "birthdate", "years_of_experience", "description", "languages_spoken", "availability_status", "employment_status"] },
    media: { table: "media", id: "media_id", fields: ["file_path", "media_type", "uploaded_by", "title", "description"] },
    content: { table: "content", id: "content_id", fields: ["media_id", "title", "content", "content_type", "display_order", "is_active", "created_by"] },
    packageMedia: { table: "package_media", id: "package_media_id", fields: ["package_id", "media_id"] },
    preferences: { table: "recommendation_preference", id: "preference_id", fields: ["account_id", "preferred_destination_type", "preferred_duration", "budget_range", "travel_style", "preferred_activity", "group_type"], softDelete: false },
    notifications: { table: "notification", id: "notification_id", fields: ["account_id", "booking_id", "payment_id", "title", "message", "notification_type", "delivery_method", "email_status", "is_read", "created_by", "sent_at"] },
    rescheduleRequests: { table: "reschedule_request", id: "reschedule_id", fields: ["booking_id", "rental_booking_id", "current_schedule_date", "requested_schedule_date", "reason", "request_status", "requested_at", "approved_by", "approved_at"] },
    payments: { table: "payment", id: "payment_id", fields: ["booking_id", "rental_booking_id", "transaction_reference", "payment_date", "amount", "payment_method", "payment_status"] },
    reviews: { table: "review", id: "review_id", fields: ["account_id", "package_id", "booking_id", "rating", "comment"] },
    rentalBookings: { table: "car_rental_booking", id: "rental_booking_id", fields: ["account_id", "vehicle_id", "booking_reference", "booking_date", "pickup_date", "return_date", "pickup_location", "total_amount", "booking_status"] },
    sessionLogs: { table: "session_log", id: "session_id", fields: ["account_id", "login_time", "logout_time", "last_activity"], softDelete: false }
};

function selected(resource, input) {
    return resource.fields.filter((field) => Object.prototype.hasOwnProperty.call(input, field));
}

function normalizeImageValue(value) {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed;
}

function normalizeVehiclePayload(input = {}) {
    const vehicleName = input.vehicle_name || input.vehicleName || input.name || "";
    const vehicleType = input.vehicle_type || input.vehicleType || "Car";
    const plateNumber = input.plate_number || input.plateNumber || "";
    const capacity = Number(input.capacity ?? input.seatingCapacity ?? input.seating_capacity ?? 1);
    const dailyRate = Number(input.daily_rate ?? input.dailyRate ?? input.price ?? 0);
    const availabilityStatus = input.availability_status || input.availabilityStatus || "Available";
    const image = normalizeImageValue(input.image || input.vehicleImage || input.vehicle_image || null);

    const fuelType = input.fuel_type || input.fuelType || null;
    const vehicleBrand = input.vehicle_brand || input.vehicleBrand || null;
    const transmission = input.transmission || null;

    return {
        vehicle_name: String(vehicleName).trim(),
        vehicle_type: String(vehicleType).trim() || "Car",
        plate_number: String(plateNumber).trim(),
        capacity: Number.isFinite(capacity) && capacity > 0 ? Math.floor(capacity) : 1,
        daily_rate: Number.isFinite(dailyRate) && dailyRate >= 0 ? dailyRate : 0,
        availability_status: ["Available", "Unavailable", "Maintenance", "Deactivated"].includes(availabilityStatus) ? availabilityStatus : "Available",
        image: image ? String(image) : null,
        fuel_type: fuelType ? String(fuelType).trim() : null,
        vehicle_brand: vehicleBrand ? String(vehicleBrand).trim() : null,
        transmission: transmission ? String(transmission).trim() : null,
    };
}

function prepareResourcePayload(resource, input = {}) {
    const payload = { ...input };
    if (Object.prototype.hasOwnProperty.call(payload, "image") && payload.image !== undefined && payload.image !== null) {
        payload.image = normalizeImageValue(payload.image);
    }
    return payload;
}

function joinerScheduleError(payload, existing = {}) {
    const packageType = String(payload.package_type ?? existing.package_type ?? "").toLowerCase();
    if (packageType !== "joiner") return null;
    const tripDate = String(payload.joiner_date ?? existing.joiner_date ?? "").slice(0, 10);
    const deadline = String(payload.joiner_booking_deadline ?? existing.joiner_booking_deadline ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tripDate) || !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        return "Joiner trips need a trip date and a booking deadline.";
    }
    if (deadline > tripDate) {
        return "The booking deadline must be on or before the trip date.";
    }
    return null;
}

function approvalAction(resource, values) {
    if (resource.table !== "reschedule_request") return "UPDATE";
    const status = String(values.request_status || "").trim().toLowerCase();
    if (status === "approved") return "APPROVE";
    if (status === "rejected") return "REJECT";
    return "UPDATE";
}

// Quote identifier for PostgreSQL using double-quotes
function qi(name) {
    return `"${name}"`;
}

function addCrud(router, path, resource) {
    const whereActive = resource.softDelete === false ? "" : " WHERE deleted_at IS NULL";
    const readMiddleware = path === "packages" || path === "vehicles" ? [] : [requireAuth];
    router.get(`/${path}`, ...readMiddleware, async (req, res, next) => {
        try { const { rows } = await db.query(`SELECT * FROM ${qi(resource.table)}${whereActive} ORDER BY ${qi(resource.id)} DESC`); res.json(rows); } catch (e) { next(e); }
    });
    router.get(`/${path}/:id`, ...readMiddleware, async (req, res, next) => {
        try { const { rows } = await db.query(`SELECT * FROM ${qi(resource.table)} WHERE ${qi(resource.id)} = $1${resource.softDelete === false ? "" : " AND deleted_at IS NULL"}`, [req.params.id]); if (!rows[0]) return res.status(404).json({ message: "Record not found." }); res.json(rows[0]); } catch (e) { next(e); }
    });
    router.post(`/${path}`, requireAuth, allowRoles("Admin"), async (req, res, next) => {
        try {
            const payload = prepareResourcePayload(resource, req.body);
            const fields = selected(resource, payload);
            if (!fields.length) return res.status(400).json({ message: "No valid fields supplied." });
            const scheduleError = resource.table === "tour_package" ? joinerScheduleError(payload) : null;
            if (scheduleError) return res.status(422).json({ message: scheduleError });
            const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");
            const { rows: inserted } = await db.query(`INSERT INTO ${qi(resource.table)} (${fields.map(qi).join(", ")}) VALUES (${placeholders}) RETURNING ${qi(resource.id)}`, fields.map(f => payload[f]));
            const newId = inserted[0][resource.id];
            const { rows } = await db.query(`SELECT * FROM ${qi(resource.table)} WHERE ${qi(resource.id)} = $1`, [newId]);
            try {
                await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "CREATE", tableName: resource.table, recordId: newId, newValues: req.body, req });
            } catch (auditError) {
                // The resource is already persisted. An audit-table failure
                // must not make the client retry a successful create.
                console.error(`Failed to write ${resource.table} creation audit record:`, auditError);
            }
            res.status(201).json(rows[0]);
        } catch (e) { next(e); }
    });
    router.patch(`/${path}/:id`, requireAuth, allowRoles("Admin"), async (req, res, next) => {
        try {
            const payload = prepareResourcePayload(resource, req.body);
            const fields = selected(resource, payload);
            if (!fields.length) return res.status(400).json({ message: "No valid fields supplied." });
            const { rows: existingRows } = await db.query(`SELECT * FROM ${qi(resource.table)} WHERE ${qi(resource.id)} = $1${resource.softDelete === false ? "" : " AND deleted_at IS NULL"}`, [req.params.id]);
            const oldValues = existingRows[0];
            if (!oldValues) return res.status(404).json({ message: "Record not found." });
            const scheduleError = resource.table === "tour_package" ? joinerScheduleError(payload, oldValues) : null;
            if (scheduleError) return res.status(422).json({ message: scheduleError });
            // SET col = $1, col2 = $2 … WHERE id = $N
            const setClauses = fields.map((f, i) => `${qi(f)} = $${i + 1}`).join(", ");
            const result = await db.query(`UPDATE ${qi(resource.table)} SET ${setClauses} WHERE ${qi(resource.id)} = $${fields.length + 1}${resource.softDelete === false ? "" : " AND deleted_at IS NULL"}`, [...fields.map(f => payload[f]), req.params.id]);
            if (!result.rowCount) return res.status(404).json({ message: "Record not found." });
            const { rows } = await db.query(`SELECT * FROM ${qi(resource.table)} WHERE ${qi(resource.id)} = $1`, [req.params.id]);
            await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: approvalAction(resource, req.body), tableName: resource.table, recordId: Number(req.params.id), oldValues, newValues: req.body, req });
            res.json(rows[0]);
        } catch (e) { next(e); }
    });
    router.delete(`/${path}/:id`, requireAuth, allowRoles("Admin"), async (req, res, next) => {
        try { const { rows: existingRows } = await db.query(`SELECT * FROM ${qi(resource.table)} WHERE ${qi(resource.id)} = $1${resource.softDelete === false ? "" : " AND deleted_at IS NULL"}`, [req.params.id]); const oldValues = existingRows[0]; if (!oldValues) return res.status(404).json({ message: "Record not found." }); const sql = resource.softDelete === false ? `DELETE FROM ${qi(resource.table)} WHERE ${qi(resource.id)} = $1` : `UPDATE ${qi(resource.table)} SET deleted_at = NOW() WHERE ${qi(resource.id)} = $1 AND deleted_at IS NULL`; const result = await db.query(sql, [req.params.id]); if (!result.rowCount) return res.status(404).json({ message: "Record not found." }); await logAudit({ accountId: req.user.accountId, sessionId: req.user.sessionId, action: "DELETE", tableName: resource.table, recordId: Number(req.params.id), oldValues, req }); res.status(204).end(); } catch (e) { next(e); }
    });
}

const router = express.Router();

router.get("/packages", async (req, res, next) => {
    try {
        const { rows } = await db.query(`
            SELECT p.*,
                COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM review r WHERE r.package_id = p.package_id AND r.deleted_at IS NULL), 0) AS rating,
                (SELECT COUNT(*) FROM review r WHERE r.package_id = p.package_id AND r.deleted_at IS NULL) AS reviews_count
            FROM tour_package p
            WHERE p.deleted_at IS NULL
            ORDER BY p.package_id DESC
        `);
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

router.get("/packages/:id", async (req, res, next) => {
    try {
        const { rows } = await db.query(`
            SELECT p.*,
                COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM review r WHERE r.package_id = p.package_id AND r.deleted_at IS NULL), 0) AS rating,
                (SELECT COUNT(*) FROM review r WHERE r.package_id = p.package_id AND r.deleted_at IS NULL) AS reviews_count
            FROM tour_package p
            WHERE p.package_id = $1 AND p.deleted_at IS NULL
        `, [req.params.id]);
        if (!rows[0]) return res.status(404).json({ message: "Package not found." });
        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

router.get("/vehicles", async (req, res, next) => {
    try {
        const { rows } = await db.query(`
            SELECT v.*,
                COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM review r WHERE r.vehicle_id = v.vehicle_id AND r.deleted_at IS NULL), 0) AS rating,
                (SELECT COUNT(*) FROM review r WHERE r.vehicle_id = v.vehicle_id AND r.deleted_at IS NULL) AS reviews_count
            FROM vehicle v 
            WHERE v.deleted_at IS NULL 
            ORDER BY v.vehicle_id DESC
        `);
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

router.get("/vehicles/:id", async (req, res, next) => {
    try {
        const { rows } = await db.query(`
            SELECT v.*,
                COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM review r WHERE r.vehicle_id = v.vehicle_id AND r.deleted_at IS NULL), 0) AS rating,
                (SELECT COUNT(*) FROM review r WHERE r.vehicle_id = v.vehicle_id AND r.deleted_at IS NULL) AS reviews_count
            FROM vehicle v 
            WHERE v.vehicle_id = $1 AND v.deleted_at IS NULL
        `, [req.params.id]);
        if (!rows[0]) return res.status(404).json({ message: "Vehicle not found." });
        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

router.post("/vehicles", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const payload = normalizeVehiclePayload(req.body);
        if (!payload.vehicle_name || !payload.plate_number) {
            return res.status(400).json({ message: "Vehicle name and plate number are required." });
        }

        const { rows: inserted } = await db.query(
            "INSERT INTO vehicle (vehicle_name, vehicle_type, plate_number, capacity, daily_rate, image, availability_status, fuel_type, vehicle_brand, transmission) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING vehicle_id",
            [payload.vehicle_name, payload.vehicle_type, payload.plate_number, payload.capacity, payload.daily_rate, payload.image, payload.availability_status, payload.fuel_type, payload.vehicle_brand, payload.transmission]
        );

        const { rows } = await db.query("SELECT * FROM vehicle WHERE vehicle_id = $1", [inserted[0].vehicle_id]);
        await logAudit({ accountId: req.user.accountId, action: "CREATE", tableName: "vehicle", recordId: inserted[0].vehicle_id, newValues: req.body });
        res.status(201).json(rows[0]);
    } catch (error) {
        // pg unique violation error code
        if (error.code === "23505") {
            return res.status(409).json({ message: "A vehicle with that plate number already exists." });
        }
        next(error);
    }
});

router.patch("/vehicles/:id", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const payload = normalizeVehiclePayload(req.body);
        const fields = [];
        const values = [];

        if (Object.prototype.hasOwnProperty.call(req.body, "vehicle_name") || Object.prototype.hasOwnProperty.call(req.body, "vehicleName")) {
            fields.push("vehicle_name"); values.push(payload.vehicle_name);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "vehicle_type") || Object.prototype.hasOwnProperty.call(req.body, "vehicleType")) {
            fields.push("vehicle_type"); values.push(payload.vehicle_type);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "plate_number") || Object.prototype.hasOwnProperty.call(req.body, "plateNumber")) {
            fields.push("plate_number"); values.push(payload.plate_number);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "capacity") || Object.prototype.hasOwnProperty.call(req.body, "seatingCapacity")) {
            fields.push("capacity"); values.push(payload.capacity);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "daily_rate") || Object.prototype.hasOwnProperty.call(req.body, "dailyRate")) {
            fields.push("daily_rate"); values.push(payload.daily_rate);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "availability_status") || Object.prototype.hasOwnProperty.call(req.body, "availabilityStatus")) {
            fields.push("availability_status"); values.push(payload.availability_status);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "image") || Object.prototype.hasOwnProperty.call(req.body, "vehicleImage")) {
            fields.push("image"); values.push(payload.image);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "fuel_type") || Object.prototype.hasOwnProperty.call(req.body, "fuelType")) {
            fields.push("fuel_type"); values.push(payload.fuel_type);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "vehicle_brand") || Object.prototype.hasOwnProperty.call(req.body, "vehicleBrand")) {
            fields.push("vehicle_brand"); values.push(payload.vehicle_brand);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "transmission")) {
            fields.push("transmission"); values.push(payload.transmission);
        }

        if (!fields.length) return res.status(400).json({ message: "No valid vehicle fields supplied." });

        const { rows: existingRows } = await db.query("SELECT * FROM vehicle WHERE vehicle_id = $1 AND deleted_at IS NULL", [req.params.id]);
        const oldValues = existingRows[0];
        if (!oldValues) return res.status(404).json({ message: "Vehicle not found." });

        // Build SET col = $1, col2 = $2 … WHERE vehicle_id = $N
        const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
        const result = await db.query(`UPDATE vehicle SET ${setClauses} WHERE vehicle_id = $${fields.length + 1} AND deleted_at IS NULL`, [...values, req.params.id]);
        if (!result.rowCount) return res.status(404).json({ message: "Vehicle not found." });

        const { rows } = await db.query("SELECT * FROM vehicle WHERE vehicle_id = $1", [req.params.id]);
        await logAudit({ accountId: req.user.accountId, action: "UPDATE", tableName: "vehicle", recordId: Number(req.params.id), oldValues, newValues: req.body });
        res.json(rows[0]);
    } catch (error) {
        // pg unique violation error code
        if (error.code === "23505") {
            return res.status(409).json({ message: "A vehicle with that plate number already exists." });
        }
        next(error);
    }
});

router.delete("/vehicles/:id", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const { rows: existingRows } = await db.query("SELECT * FROM vehicle WHERE vehicle_id = $1 AND deleted_at IS NULL", [req.params.id]);
        const oldValues = existingRows[0];
        if (!oldValues) return res.status(404).json({ message: "Vehicle not found." });
        const result = await db.query("UPDATE vehicle SET deleted_at = NOW() WHERE vehicle_id = $1 AND deleted_at IS NULL", [req.params.id]);
        if (!result.rowCount) return res.status(404).json({ message: "Vehicle not found." });
        await logAudit({ accountId: req.user.accountId, action: "DELETE", tableName: "vehicle", recordId: Number(req.params.id), oldValues });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

Object.entries(resources).forEach(([path, resource]) => addCrud(router, path, resource));
module.exports = router;
