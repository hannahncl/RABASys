const express = require("express");
const db = require("../config/db");
const { requireAuth, allowRoles } = require("../middleware/auth");

// Only these known tables/columns can be used. This avoids dynamic SQL from request input.
const resources = {
    accounts: { table: "account", id: "account_id", fields: ["first_name", "last_name", "email", "contact_number", "role", "account_status"] },
    packages: { table: "tour_package", id: "package_id", fields: ["package_name", "destination", "description", "price", "duration", "inclusion", "max_capacity", "meeting_location", "itinerary", "availability_status"] },
    vehicles: { table: "vehicle", id: "vehicle_id", fields: ["media_id", "vehicle_name", "vehicle_type", "plate_number", "capacity", "daily_rate", "image", "availability_status"] },
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

function normalizeVehiclePayload(input = {}) {
    const vehicleName = input.vehicle_name || input.vehicleName || input.name || "";
    const vehicleType = input.vehicle_type || input.vehicleType || "Car";
    const plateNumber = input.plate_number || input.plateNumber || "";
    const capacity = Number(input.capacity ?? input.seatingCapacity ?? input.seating_capacity ?? 1);
    const dailyRate = Number(input.daily_rate ?? input.dailyRate ?? input.price ?? 0);
    const availabilityStatus = input.availability_status || input.availabilityStatus || "Available";
    const image = input.image || input.vehicleImage || input.vehicle_image || null;

    return {
        vehicle_name: String(vehicleName).trim(),
        vehicle_type: String(vehicleType).trim() || "Car",
        plate_number: String(plateNumber).trim(),
        capacity: Number.isFinite(capacity) && capacity > 0 ? Math.floor(capacity) : 1,
        daily_rate: Number.isFinite(dailyRate) && dailyRate >= 0 ? dailyRate : 0,
        availability_status: ["Available", "Unavailable", "Maintenance"].includes(availabilityStatus) ? availabilityStatus : "Available",
        image: image ? String(image) : null,
    };
}

function addCrud(router, path, resource) {
    const whereActive = resource.softDelete === false ? "" : " WHERE deleted_at IS NULL";
    const readMiddleware = path === "packages" ? [] : [requireAuth];
    router.get(`/${path}`, ...readMiddleware, async (req, res, next) => {
        try { const [rows] = await db.query(`SELECT * FROM \`${resource.table}\`${whereActive} ORDER BY \`${resource.id}\` DESC`); res.json(rows); } catch (e) { next(e); }
    });
    router.get(`/${path}/:id`, ...readMiddleware, async (req, res, next) => {
        try { const [rows] = await db.execute(`SELECT * FROM \`${resource.table}\` WHERE \`${resource.id}\` = ?${resource.softDelete === false ? "" : " AND deleted_at IS NULL"}`, [req.params.id]); if (!rows[0]) return res.status(404).json({ message: "Record not found." }); res.json(rows[0]); } catch (e) { next(e); }
    });
    router.post(`/${path}`, requireAuth, allowRoles("Admin"), async (req, res, next) => {
        try { const fields = selected(resource, req.body); if (!fields.length) return res.status(400).json({ message: "No valid fields supplied." }); const [result] = await db.execute(`INSERT INTO \`${resource.table}\` (${fields.map(f => `\`${f}\``).join(", ")}) VALUES (${fields.map(() => "?").join(", ")})`, fields.map(f => req.body[f])); const [rows] = await db.execute(`SELECT * FROM \`${resource.table}\` WHERE \`${resource.id}\` = ?`, [result.insertId]); res.status(201).json(rows[0]); } catch (e) { next(e); }
    });
    router.patch(`/${path}/:id`, requireAuth, allowRoles("Admin"), async (req, res, next) => {
        try { const fields = selected(resource, req.body); if (!fields.length) return res.status(400).json({ message: "No valid fields supplied." }); const [result] = await db.execute(`UPDATE \`${resource.table}\` SET ${fields.map(f => `\`${f}\` = ?`).join(", ")} WHERE \`${resource.id}\` = ?${resource.softDelete === false ? "" : " AND deleted_at IS NULL"}`, [...fields.map(f => req.body[f]), req.params.id]); if (!result.affectedRows) return res.status(404).json({ message: "Record not found." }); const [rows] = await db.execute(`SELECT * FROM \`${resource.table}\` WHERE \`${resource.id}\` = ?`, [req.params.id]); res.json(rows[0]); } catch (e) { next(e); }
    });
    router.delete(`/${path}/:id`, requireAuth, allowRoles("Admin"), async (req, res, next) => {
        try { const sql = resource.softDelete === false ? `DELETE FROM \`${resource.table}\` WHERE \`${resource.id}\` = ?` : `UPDATE \`${resource.table}\` SET deleted_at = NOW() WHERE \`${resource.id}\` = ? AND deleted_at IS NULL`; const [result] = await db.execute(sql, [req.params.id]); if (!result.affectedRows) return res.status(404).json({ message: "Record not found." }); res.status(204).end(); } catch (e) { next(e); }
    });
}

const router = express.Router();

router.get("/vehicles", async (req, res, next) => {
    try {
        const [rows] = await db.query("SELECT * FROM vehicle WHERE deleted_at IS NULL ORDER BY vehicle_id DESC");
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

router.get("/vehicles/:id", async (req, res, next) => {
    try {
        const [rows] = await db.execute("SELECT * FROM vehicle WHERE vehicle_id = ? AND deleted_at IS NULL", [req.params.id]);
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

        const [result] = await db.execute(
            "INSERT INTO vehicle (vehicle_name, vehicle_type, plate_number, capacity, daily_rate, image, availability_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [payload.vehicle_name, payload.vehicle_type, payload.plate_number, payload.capacity, payload.daily_rate, payload.image, payload.availability_status]
        );

        const [rows] = await db.execute("SELECT * FROM vehicle WHERE vehicle_id = ?", [result.insertId]);
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
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
            fields.push("vehicle_name = ?"); values.push(payload.vehicle_name);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "vehicle_type") || Object.prototype.hasOwnProperty.call(req.body, "vehicleType")) {
            fields.push("vehicle_type = ?"); values.push(payload.vehicle_type);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "plate_number") || Object.prototype.hasOwnProperty.call(req.body, "plateNumber")) {
            fields.push("plate_number = ?"); values.push(payload.plate_number);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "capacity") || Object.prototype.hasOwnProperty.call(req.body, "seatingCapacity")) {
            fields.push("capacity = ?"); values.push(payload.capacity);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "daily_rate") || Object.prototype.hasOwnProperty.call(req.body, "dailyRate")) {
            fields.push("daily_rate = ?"); values.push(payload.daily_rate);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "availability_status") || Object.prototype.hasOwnProperty.call(req.body, "availabilityStatus")) {
            fields.push("availability_status = ?"); values.push(payload.availability_status);
        }
        if (Object.prototype.hasOwnProperty.call(req.body, "image") || Object.prototype.hasOwnProperty.call(req.body, "vehicleImage")) {
            fields.push("image = ?"); values.push(payload.image);
        }

        if (!fields.length) return res.status(400).json({ message: "No valid vehicle fields supplied." });

        const [result] = await db.execute(`UPDATE vehicle SET ${fields.join(", ")} WHERE vehicle_id = ? AND deleted_at IS NULL`, [...values, req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ message: "Vehicle not found." });

        const [rows] = await db.execute("SELECT * FROM vehicle WHERE vehicle_id = ?", [req.params.id]);
        res.json(rows[0]);
    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "A vehicle with that plate number already exists." });
        }
        next(error);
    }
});

router.delete("/vehicles/:id", requireAuth, allowRoles("Admin"), async (req, res, next) => {
    try {
        const [result] = await db.execute("UPDATE vehicle SET deleted_at = NOW() WHERE vehicle_id = ? AND deleted_at IS NULL", [req.params.id]);
        if (!result.affectedRows) return res.status(404).json({ message: "Vehicle not found." });
        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

Object.entries(resources).forEach(([path, resource]) => addCrud(router, path, resource));
module.exports = router;
