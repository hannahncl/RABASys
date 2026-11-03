const express = require("express");
const crypto = require("crypto");
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { sendBookingConfirmation } = require("../config/mailer");
const { isJoinerDeadlineValid } = require("../utils/joinerSchedule");
const { ensurePaymentCheckoutTable } = require("../utils/paymentCheckout");
const { createInAppNotification } = require("../utils/notification");
const { findRentalConflict } = require("../utils/rentalAvailability");

const router = express.Router();
const XENDIT_API = "https://api.xendit.co";

function clientOrigin() {
    return (process.env.XENDIT_REDIRECT_ORIGIN || process.env.CLIENT_ORIGIN || "http://localhost:5173")
        .split(",")[0]
        .trim()
        .replace(/\/$/, "");
}

function xenditAuth() {
    const key = process.env.XENDIT_SECRET_KEY;
    if (!key) throw Object.assign(new Error("Xendit is not configured. Set XENDIT_SECRET_KEY on the backend."), { status: 503 });
    return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

async function xenditRequest(path, body) {
    const response = await fetch(`${XENDIT_API}${path}`, {
        method: "POST",
        headers: { Authorization: xenditAuth(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = data?.message || data?.error_code || "Xendit could not create the payment session.";
        throw Object.assign(new Error(message), { status: response.status >= 500 ? 502 : 422 });
    }
    return data;
}

async function xenditGet(path) {
    const response = await fetch(`${XENDIT_API}${path}`, {
        method: "GET",
        headers: { Authorization: xenditAuth(), "Content-Type": "application/json" },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = data?.message || data?.error_code || "Xendit could not verify the payment session.";
        throw Object.assign(new Error(message), { status: response.status >= 500 ? 502 : 422 });
    }
    return data;
}

async function sendPaidBookingConfirmation(bookingId, paymentReference) {
    const { rows } = await db.query(
        `SELECT b.*, COALESCE(p.package_name, CONCAT('Customized Trip: ', b.customized_details->>'destination')) AS package_name,
                COALESCE(p.destination, b.customized_details->>'destination') AS destination,
                COALESCE(p.package_type, CASE WHEN b.customized_details IS NOT NULL THEN 'customization' ELSE NULL END) AS package_type,
                COALESCE(b.customized_details->>'contactFirstName', a.first_name) AS first_name,
                COALESCE(b.customized_details->>'contactLastName', a.last_name) AS last_name,
                COALESCE(b.customized_details->>'contactEmail', a.email) AS email,
                COALESCE(b.customized_details->>'contactPhone', a.contact_number) AS contact_number,
                b.payment_reference AS payment_transaction_reference
         FROM booking b JOIN account a ON a.account_id = b.account_id
         LEFT JOIN tour_package p ON p.package_id = b.package_id
         WHERE b.booking_id = $1 AND b.deleted_at IS NULL`,
        [bookingId]
    );
    if (!rows[0]) return;
    const booking = { ...rows[0], payment_transaction_reference: paymentReference || rows[0].payment_reference };
    await sendBookingConfirmation(booking, booking.customized_details ? "custom-payment" : "tour");
}

async function notifyPaymentReceived(accountId, bookingId, bookingReference, bookingType = "tour") {
    try {
        await createInAppNotification({
            accountId,
            bookingId,
            title: "Payment received",
            message: `Your ${bookingType === "rental" ? "car rental " : "tour "}payment for booking ${bookingReference} was successful.`,
            type: "Booking",
        });
    } catch (error) {
        console.error("[payment] in-app payment notification error:", error.message);
    }
}

function configuredPaymentChannels() {
    return String(process.env.XENDIT_PAYMENT_CHANNELS || "")
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);
}

router.post("/xendit/checkout-session", requireAuth, async (req, res, next) => {
    let packageHoldClient = null;
    let packageHoldTransactionOpen = false;
    try {
        if (req.body?.booking_data) {
            await ensurePaymentCheckoutTable();
            const data = req.body.booking_data;
            if (data.bookingType === "rental") {
                const vehicleId = Number(data.vehicleId);
                const pickupDate = String(data.pickupDate || "");
                const returnDate = String(data.returnDate || "");
                const start = new Date(pickupDate);
                const end = new Date(returnDate);
                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                if (!Number.isInteger(vehicleId) || !/^\d{4}-\d{2}-\d{2}$/.test(pickupDate) || !/^\d{4}-\d{2}-\d{2}$/.test(returnDate) || end <= start || !data.pickupLocation) {
                    return res.status(422).json({ message: "Complete rental details are required before payment." });
                }
                const availabilityClient = await db.connect();
                let vehicle;
                try {
                    await availabilityClient.query("BEGIN");
                    const { rows: vehicles } = await availabilityClient.query(
                        "SELECT vehicle_name, daily_rate FROM vehicle WHERE vehicle_id = $1 AND availability_status = 'Available' AND deleted_at IS NULL FOR UPDATE",
                        [vehicleId]
                    );
                    vehicle = vehicles[0];
                    if (!vehicle) throw Object.assign(new Error("Available vehicle not found."), { status: 404 });
                    const conflict = await findRentalConflict(availabilityClient, vehicleId, pickupDate, returnDate);
                    if (conflict) throw Object.assign(new Error("That vehicle is already booked for one or more selected dates. Please choose different dates."), { status: 409 });
                    await availabilityClient.query("COMMIT");
                } catch (error) {
                    try { await availabilityClient.query("ROLLBACK"); } catch { /* ignore rollback failure */ }
                    throw error;
                } finally {
                    availabilityClient.release();
                }
                const amount = Number(vehicle.daily_rate) * days;
                const { rows: customerRows } = await db.query("SELECT first_name, last_name, email, contact_number FROM account WHERE account_id = $1 AND deleted_at IS NULL", [req.user.accountId]);
                const customer = customerRows[0];
                if (!customer) return res.status(404).json({ message: "Customer account not found." });
                const reference = `RBC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
                const [firstName = "Customer", ...lastNameParts] = String(customer.first_name || "Customer").trim().split(/\s+/);
                const origin = clientOrigin();
                const redirectUrls = /^https:\/\//i.test(origin)
                    ? { success_return_url: `${origin}/profile?view=history&booking_reference=${reference}`, cancel_return_url: `${origin}/profile?payment=cancelled` }
                    : {};
                const session = await xenditRequest("/sessions", {
                    reference_id: reference, session_type: "PAY", mode: "PAYMENT_LINK",
                    amount: Math.round(amount * 100) / 100, currency: "PHP", country: "PH", locale: "en",
                    customer: { reference_id: `account_${req.user.accountId}_${Date.now()}`, type: "INDIVIDUAL", email: customer.email, mobile_number: customer.contact_number || undefined, individual_detail: { given_names: firstName, surname: lastNameParts.join(" ") || firstName } },
                    items: [{ reference_id: reference, name: vehicle.vehicle_name, description: `RABAS booking ${reference}`, type: "PHYSICAL_SERVICE", category: "TRAVEL_SERVICES", net_unit_amount: Math.round(amount * 100) / 100, quantity: 1, currency: "PHP" }],
                    description: `RABAS booking ${reference}`, metadata: { booking_reference: reference, account_id: String(req.user.accountId), booking_type: "rental" },
                    ...(configuredPaymentChannels().length ? { allowed_payment_channels: configuredPaymentChannels() } : {}), ...redirectUrls,
                });
                if (!session?.payment_link_url) throw Object.assign(new Error("Xendit did not return a payment link."), { status: 502 });
                await db.query("INSERT INTO payment_checkout (session_id, account_id, booking_reference, payload) VALUES ($1, $2, $3, $4)", [session.payment_session_id, req.user.accountId, reference, JSON.stringify({ ...data, vehicleId, vehicleName: vehicle.vehicle_name, bookingReference: reference })]);
                return res.json({ checkoutUrl: session.payment_link_url, sessionId: session.payment_session_id, bookingReference: reference });
            }
            const packageId = data.packageId && data.packageId !== "custom-package" ? Number(data.packageId) : null;
            const guestsCount = Number(data.guestsCount);
            const amount = Number(data.downpaymentAmount ?? data.totalPrice);
            if (!data.tourDate || !Number.isInteger(guestsCount) || guestsCount < 1 || !Number.isFinite(amount) || amount <= 0) {
                return res.status(422).json({ message: "Complete booking details are required before payment." });
            }
            const requestedExpiry = new Date(Date.now() + 30 * 60 * 1000);

            let packageName = data.packageName || "RABAS Travel booking";
            let validatedBookingData = { ...data };
            let packageIsJoiner = false;
            if (packageId) {
                packageHoldClient = await db.connect();
                await packageHoldClient.query("BEGIN");
                packageHoldTransactionOpen = true;
                const { rows } = await packageHoldClient.query(
                    "SELECT package_name, price, max_capacity, package_type, joiner_date, joiner_slots, joiner_booking_deadline, joiner_downpayment_percent FROM tour_package WHERE package_id = $1 AND availability_status = 'Available' AND deleted_at IS NULL FOR UPDATE",
                    [packageId]
                );
                const pkg = rows[0];
                if (!pkg) return res.status(404).json({ message: "Available tour package not found." });
                packageName = pkg.package_name;
                const capacity = Number(pkg.max_capacity);
                if (!Number.isInteger(capacity) || capacity < 1 || guestsCount > capacity) {
                    return res.status(409).json({ message: `This package allows up to ${Number.isInteger(capacity) && capacity > 0 ? capacity : 0} travelers.` });
                }

                const isJoiner = String(pkg.package_type || '').toLowerCase() === 'joiner';
                packageIsJoiner = isJoiner;
                let totalAmount = Number(pkg.price || 0);
                let paymentAmount = totalAmount;
                if (isJoiner) {
                    const scheduledDate = pkg.joiner_date ? String(pkg.joiner_date).slice(0, 10) : '';
                    const deadline = pkg.joiner_booking_deadline ? String(pkg.joiner_booking_deadline).slice(0, 10) : '';
                    const { rows: [{ today }] } = await packageHoldClient.query("SELECT CURRENT_DATE::text AS today");
                    if (!scheduledDate || !deadline || scheduledDate < today || today > deadline || !isJoinerDeadlineValid(scheduledDate, deadline)) {
                        return res.status(409).json({ message: "This Joiner departure is no longer open for booking." });
                    }
                    if (String(data.tourDate).slice(0, 10) !== scheduledDate) {
                        return res.status(409).json({ message: "The selected date no longer matches this Joiner departure. Please reload the package." });
                    }
                    const joinerSlots = Math.min(Number(pkg.joiner_slots || 0), capacity);
                    const { rows: [{ reserved }] } = await packageHoldClient.query(
                        "SELECT COALESCE(SUM(number_of_persons), 0)::int AS reserved FROM booking WHERE package_id = $1 AND travel_date = $2 AND booking_status IN ('Pending', 'Confirmed', 'Rescheduled') AND deleted_at IS NULL",
                        [packageId, scheduledDate]
                    );
                    const { rows: [{ held }] } = await packageHoldClient.query(
                        "SELECT COALESCE(SUM(guests_count), 0)::int AS held FROM payment_checkout WHERE package_id = $1 AND finalized_at IS NULL AND released_at IS NULL AND expires_at > NOW()",
                        [packageId]
                    );
                    const remaining = Math.max(0, joinerSlots - Number(reserved) - Number(held));
                    if (guestsCount > remaining) return res.status(409).json({ message: `Only ${remaining} Joiner spot${remaining === 1 ? '' : 's'} remain for this departure.` });
                    if (!Array.isArray(data.participantNames) || data.participantNames.length !== guestsCount || data.participantNames.some((name) => String(name || '').trim().length < 2)) {
                        return res.status(422).json({ message: "A full name is required for every Joiner traveler." });
                    }
                    totalAmount = Math.round((Number(pkg.price || 0) / capacity) * guestsCount * 100) / 100;
                    const downpaymentPercent = Math.min(100, Math.max(1, Number(pkg.joiner_downpayment_percent || 30)));
                    paymentAmount = Math.round((totalAmount * downpaymentPercent / 100) * 100) / 100;
                }
                if (Math.abs(Number(data.totalPrice) - totalAmount) > 0.01 || Math.abs(amount - paymentAmount) > 0.01) {
                    return res.status(409).json({ message: "The package price or payment amount changed. Please review the updated booking total." });
                }
                validatedBookingData = { ...data, totalPrice: totalAmount, downpaymentAmount: paymentAmount, packageName };
            }
            const { rows: customerRows } = await db.query(
                "SELECT first_name, last_name, email, contact_number FROM account WHERE account_id = $1 AND deleted_at IS NULL",
                [req.user.accountId]
            );
            const customer = customerRows[0];
            if (!customer) return res.status(404).json({ message: "Customer account not found." });
            const reference = `RBT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
            const [firstName = "Customer", ...lastNameParts] = String(customer.first_name || "Customer").trim().split(/\s+/);
            const origin = clientOrigin();
            const redirectUrls = /^https:\/\//i.test(origin)
                ? {
                    success_return_url: `${origin}/profile?view=history&booking_reference=${reference}`,
                    cancel_return_url: `${origin}/profile?payment=cancelled`,
                }
                : {};
            const session = await xenditRequest("/sessions", {
                reference_id: reference,
                session_type: "PAY",
                mode: "PAYMENT_LINK",
                amount: Math.round(amount * 100) / 100,
                currency: "PHP",
                country: "PH",
                locale: "en",
                customer: {
                    reference_id: `account_${req.user.accountId}_${Date.now()}`,
                    type: "INDIVIDUAL",
                    email: customer.email,
                    mobile_number: customer.contact_number || undefined,
                    individual_detail: { given_names: firstName, surname: lastNameParts.join(" ") || firstName },
                },
                items: [{
                    reference_id: reference,
                    name: packageName,
                    description: `RABAS booking ${reference}`,
                    type: "PHYSICAL_SERVICE",
                    category: "TRAVEL_SERVICES",
                    net_unit_amount: Math.round(amount * 100) / 100,
                    quantity: 1,
                    currency: "PHP",
                }],
                description: `RABAS booking ${reference}`,
                metadata: { booking_reference: reference, account_id: String(req.user.accountId) },
                expires_at: requestedExpiry.toISOString(),
                ...(configuredPaymentChannels().length ? { allowed_payment_channels: configuredPaymentChannels() } : {}),
                ...redirectUrls,
            });
            const checkoutUrl = session?.payment_link_url;
            if (!checkoutUrl) throw Object.assign(new Error("Xendit did not return a payment link."), { status: 502 });
            const sessionExpiresAt = session.expires_at ? new Date(session.expires_at) : requestedExpiry;
            const expiresAt = packageIsJoiner
                ? new Date(sessionExpiresAt.getTime() + 15 * 60 * 1000)
                : sessionExpiresAt;
            const checkoutQuery = packageHoldClient || db;
            await checkoutQuery.query(
                "INSERT INTO payment_checkout (session_id, account_id, booking_reference, payload, package_id, guests_count, expires_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                [session.payment_session_id, req.user.accountId, reference, JSON.stringify({ ...validatedBookingData, packageId, packageName, bookingReference: reference }), packageIsJoiner ? packageId : null, packageIsJoiner ? guestsCount : null, expiresAt]
            );
            if (packageHoldClient) {
                await packageHoldClient.query("COMMIT");
                packageHoldTransactionOpen = false;
            }
            return res.json({ checkoutUrl, sessionId: session.payment_session_id, bookingReference: reference });
        }
        const bookingId = Number(req.body.booking_id);
        if (!Number.isInteger(bookingId)) return res.status(422).json({ message: "A valid booking_id is required." });

        const { rows } = await db.query(
            `SELECT b.booking_id, b.booking_reference, b.total_amount, b.payment_amount, b.payment_status,
                    b.payment_method, b.payment_reference, b.booking_status, b.customized_details,
                    COALESCE(p.package_name, 'RABAS Travel booking') AS package_name,
                    a.first_name, a.last_name, a.email, a.contact_number
             FROM booking b
             JOIN account a ON a.account_id = b.account_id
             LEFT JOIN tour_package p ON p.package_id = b.package_id
             WHERE b.booking_id = $1 AND b.account_id = $2 AND b.deleted_at IS NULL`,
            [bookingId, req.user.accountId]
        );
        const booking = rows[0];
        if (!booking) return res.status(404).json({ message: "Booking not found." });

        if (booking.customized_details) {
            if (!booking.customized_details.quoteItinerary || !Array.isArray(booking.customized_details.priceBreakdown) || Number(booking.total_amount) <= 0) {
                return res.status(409).json({ message: "The customized trip quote is not ready for payment." });
            }
            if (booking.booking_status !== "Quote Accepted") {
                return res.status(409).json({ message: "Accept the customized trip quote before paying." });
            }
        }

        const amount = Number(booking.payment_amount ?? booking.total_amount);
        if (!Number.isFinite(amount) || amount <= 0) return res.status(422).json({ message: "This booking has no payable amount." });
        if (booking.payment_status === "Paid") return res.status(409).json({ message: "This booking has already been paid." });
        if (booking.payment_method === "Xendit" && booking.payment_status === "Pending" && booking.payment_reference) {
            const activeSession = await xenditGet(`/sessions/${encodeURIComponent(booking.payment_reference)}`);
            if (activeSession?.status === "ACTIVE" && activeSession.payment_link_url) {
                return res.json({ checkoutUrl: activeSession.payment_link_url, sessionId: booking.payment_reference, bookingId });
            }
            if (activeSession?.status === "COMPLETED") {
                return res.status(409).json({ message: "Payment has completed and is being confirmed. Refresh your bookings shortly." });
            }
            if (!["EXPIRED", "CANCELED"].includes(activeSession?.status)) {
                return res.status(409).json({ message: "The existing payment session cannot be reopened. Contact support before trying again." });
            }
            await db.query(
                "UPDATE booking SET payment_method = NULL, payment_reference = NULL, payment_status = NULL WHERE booking_id = $1 AND account_id = $2 AND payment_status = 'Pending'",
                [bookingId, req.user.accountId]
            );
        }

        const [firstName = "Customer", ...lastNameParts] = String(booking.first_name || "Customer").trim().split(/\s+/);
        const configuredChannels = String(process.env.XENDIT_PAYMENT_CHANNELS || "")
            .split(",")
            .map((item) => item.trim().toUpperCase())
            .filter(Boolean);
        const origin = clientOrigin();
        const redirectUrls = /^https:\/\//i.test(origin)
            ? {
                    success_return_url: `${origin}/profile?view=history&booking_reference=${booking.booking_reference}`,
                cancel_return_url: `${origin}/profile?payment=cancelled&booking_id=${booking.booking_id}`,
            }
            : {};
        const session = await xenditRequest("/sessions", {
            reference_id: booking.booking_reference,
            session_type: "PAY",
            mode: "PAYMENT_LINK",
            amount: Math.round(amount * 100) / 100,
            currency: "PHP",
            country: "PH",
            locale: "en",
            customer: {
                reference_id: `account_${req.user.accountId}_${booking.booking_id}_${Date.now()}`,
                type: "INDIVIDUAL",
                email: booking.email,
                mobile_number: booking.contact_number || undefined,
                individual_detail: {
                    given_names: firstName,
                    surname: lastNameParts.join(" ") || firstName,
                },
            },
            items: [{
                reference_id: booking.booking_reference,
                name: booking.package_name,
                description: `RABAS booking ${booking.booking_reference}`,
                type: "PHYSICAL_SERVICE",
                category: "TRAVEL_SERVICES",
                net_unit_amount: Math.round(amount * 100) / 100,
                quantity: 1,
                currency: "PHP",
            }],
            ...(configuredChannels.length ? { allowed_payment_channels: configuredChannels } : {}),
            description: `RABAS booking ${booking.booking_reference}`,
            metadata: {
                booking_id: String(booking.booking_id),
                booking_reference: booking.booking_reference,
            },
            ...redirectUrls,
        });

        const checkoutUrl = session?.payment_link_url;
        if (!checkoutUrl) throw Object.assign(new Error("Xendit did not return a payment link."), { status: 502 });

        await db.query(
            "UPDATE booking SET payment_method = 'Xendit', payment_reference = $1, payment_status = 'Pending' WHERE booking_id = $2 AND account_id = $3",
            [session.payment_session_id, bookingId, req.user.accountId]
        );
        res.json({ checkoutUrl, sessionId: session.payment_session_id, bookingId });
    } catch (error) { next(error); }
    finally {
        if (packageHoldClient) {
            if (packageHoldTransactionOpen) {
                try { await packageHoldClient.query("ROLLBACK"); } catch { /* connection may already be closed */ }
            }
            packageHoldClient.release();
        }
    }
});

router.post("/xendit/finalize", requireAuth, async (req, res, next) => {
    try {
        await ensurePaymentCheckoutTable();
        const reference = String(req.body?.booking_reference || "").trim();
        if (!reference) return res.status(422).json({ message: "A booking reference is required." });
        const { rows } = await db.query("SELECT * FROM payment_checkout WHERE booking_reference = $1 AND account_id = $2", [reference, req.user.accountId]);
        const checkout = rows[0];
        if (!checkout) {
            const bookingId = Number(reference);
            if (!Number.isInteger(bookingId)) return res.status(404).json({ message: "Payment checkout was not found." });
            const { rows: bookingRows } = await db.query(
                "SELECT booking_id, booking_reference, payment_reference, payment_status, payment_amount, total_amount FROM booking WHERE booking_id = $1 AND account_id = $2 AND payment_method = 'Xendit' AND deleted_at IS NULL",
                [bookingId, req.user.accountId]
            );
            const booking = bookingRows[0];
            if (!booking?.payment_reference) return res.status(404).json({ message: "Payment checkout was not found." });
            if (booking.payment_status === "Paid") return res.json({ finalized: true });
            const session = await xenditGet(`/sessions/${encodeURIComponent(booking.payment_reference)}`);
            if (session?.status !== "COMPLETED") return res.status(409).json({ message: "Payment has not been completed yet." });
            const expectedAmount = Number(booking.payment_amount ?? booking.total_amount);
            if (Number.isFinite(Number(session.amount)) && Math.abs(Number(session.amount) - expectedAmount) > 0.01) {
                return res.status(409).json({ message: "The payment amount does not match this booking. Contact support." });
            }
            const finalized = await db.query(
                "UPDATE booking SET booking_status = 'Confirmed', payment_status = 'Paid', payment_amount = COALESCE($1, payment_amount) WHERE booking_id = $2 AND account_id = $3 AND payment_method = 'Xendit' AND payment_status IS DISTINCT FROM 'Paid' AND deleted_at IS NULL",
                [Number.isFinite(Number(session.amount)) ? Number(session.amount) : null, booking.booking_id, req.user.accountId]
            );
            if (finalized.rowCount) {
                await notifyPaymentReceived(req.user.accountId, booking.booking_id, booking.booking_reference || booking.booking_id);
                try {
                    await sendPaidBookingConfirmation(booking.booking_id, booking.payment_reference);
                } catch (error) {
                    console.error("[payment] booking confirmation email error:", error.message);
                }
            }
            return res.json({ finalized: true });
        }
        if (checkout.finalized_at) return res.json({ finalized: true });

        const session = await xenditGet(`/sessions/${encodeURIComponent(checkout.session_id)}`);
        if (session?.status !== "COMPLETED") return res.status(409).json({ message: "Payment has not been completed yet." });
        const data = checkout.payload || {};
        if (data.bookingType !== "rental") {
            const packageId = data.packageId ? Number(data.packageId) : null;
            const totalAmount = Number(data.totalPrice || session.amount || 0);
            const paymentAmount = Number(session.amount || data.downpaymentAmount || totalAmount);
            const client = await db.connect();
            let finalizedBookingId = null;
            try {
                await client.query("BEGIN");
                const claim = await client.query(
                    "UPDATE payment_checkout SET finalized_at = NOW() WHERE session_id = $1 AND finalized_at IS NULL RETURNING session_id",
                    [checkout.session_id]
                );
                if (claim.rows[0]) {
                    const inserted = await client.query(
                        `INSERT INTO booking (account_id, package_id, booking_reference, booking_date, travel_date, number_of_persons, total_amount, customized_details, participant_names, payment_method, payment_reference, payment_amount, payment_status, booking_status)
                         VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, 'Xendit', $9, $10, 'Paid', 'Confirmed') RETURNING booking_id`,
                        [checkout.account_id, packageId, checkout.booking_reference, data.tourDate, Number(data.guestsCount), totalAmount, data.customizedDetails ? JSON.stringify(data.customizedDetails) : null, Array.isArray(data.participantNames) ? JSON.stringify(data.participantNames) : null, checkout.session_id, paymentAmount]
                    );
                    finalizedBookingId = inserted.rows[0]?.booking_id || null;
                }
                await client.query("COMMIT");
            } catch (error) {
                await client.query("ROLLBACK");
                throw error;
            } finally {
                client.release();
            }
            if (finalizedBookingId) await notifyPaymentReceived(checkout.account_id, finalizedBookingId, checkout.booking_reference);
            return res.json({ finalized: true });
        }

        const client = await db.connect();
        let rentalPaymentFinalized = false;
        try {
            await client.query("BEGIN");
            const vehicleId = Number(data.vehicleId);
            const { rows: vehicles } = await client.query(
                "SELECT vehicle_id FROM vehicle WHERE vehicle_id = $1 AND availability_status = 'Available' AND deleted_at IS NULL FOR UPDATE",
                [vehicleId]
            );
            if (!vehicles[0]) throw Object.assign(new Error("Available vehicle not found."), { status: 404 });
            const conflict = await findRentalConflict(client, vehicleId, data.pickupDate, data.returnDate);
            if (conflict) throw Object.assign(new Error("That vehicle was booked before payment was finalized. The selected dates are no longer available."), { status: 409 });
            const claim = await client.query("UPDATE payment_checkout SET finalized_at = NOW() WHERE session_id = $1 AND finalized_at IS NULL RETURNING session_id", [checkout.session_id]);
            if (claim.rows[0]) {
                await client.query(
                    `INSERT INTO car_rental_booking (account_id, vehicle_id, booking_reference, booking_date, pickup_date, return_date, pickup_location, total_amount, booking_status, payment_method)
                     VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, 'Confirmed', 'Xendit')`,
                    [checkout.account_id, vehicleId, checkout.booking_reference, data.pickupDate, data.returnDate, data.pickupLocation, Number(session.amount || data.totalPrice || 0)]
                );
                rentalPaymentFinalized = true;
            }
            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }

        const { rows: rentalRows } = await db.query(
            `SELECT b.*, v.vehicle_name, v.plate_number, v.daily_rate,
                    a.first_name, a.last_name, a.email, a.contact_number
             FROM car_rental_booking b
             JOIN vehicle v ON v.vehicle_id = b.vehicle_id
             JOIN account a ON a.account_id = b.account_id
             WHERE b.booking_reference = $1 AND b.deleted_at IS NULL`,
            [checkout.booking_reference]
        );
        if (rentalRows[0]) {
            if (rentalPaymentFinalized) await notifyPaymentReceived(checkout.account_id, null, checkout.booking_reference, "rental");
            await sendBookingConfirmation({ ...rentalRows[0], payment_status: "Paid", payment_transaction_reference: checkout.session_id }, "rental");
        }
        return res.json({ finalized: true });
    } catch (error) { next(error); }
});

router.post("/xendit/webhook", async (req, res, next) => {
    try {
        const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;
        const receivedToken = req.headers["x-callback-token"];
        if (!expectedToken || !receivedToken || receivedToken !== expectedToken) {
            return res.status(401).json({ message: "Invalid Xendit webhook token." });
        }

        const event = req.body?.event;
        const session = req.body?.data;
        if (event === "payment_session.expired" && session?.status === "EXPIRED") {
            await ensurePaymentCheckoutTable();
            const expiredSessionId = session.payment_session_id || session.payment_id;
            if (expiredSessionId) {
                await db.query("UPDATE payment_checkout SET released_at = NOW() WHERE session_id = $1 AND finalized_at IS NULL AND released_at IS NULL", [expiredSessionId]);
            }
            return res.status(200).json({ received: true });
        }
        if (event === "payment_session.completed" && session?.status === "COMPLETED") {
            await ensurePaymentCheckoutTable();
            const sessionId = session.payment_session_id || session.payment_id;
            const pending = await db.query("SELECT * FROM payment_checkout WHERE session_id = $1 AND finalized_at IS NULL", [sessionId]);
            if (pending.rows[0]) {
                const checkout = pending.rows[0];
                const data = checkout.payload || {};
                const packageId = data.packageId ? Number(data.packageId) : null;
                const client = await db.connect();
                let createdPaidBookingId = null;
                let createdPaidRental = false;
                try {
                    await client.query("BEGIN");
                    const claim = await client.query("UPDATE payment_checkout SET finalized_at = NOW() WHERE session_id = $1 AND finalized_at IS NULL RETURNING session_id", [sessionId]);
                    if (claim.rows[0]) {
                        if (data.bookingType === "rental") {
                            const totalAmount = Number(session.amount || data.totalPrice || 0);
                            const vehicleId = Number(data.vehicleId);
                            const { rows: vehicles } = await client.query(
                                "SELECT vehicle_id FROM vehicle WHERE vehicle_id = $1 AND availability_status = 'Available' AND deleted_at IS NULL FOR UPDATE",
                                [vehicleId]
                            );
                            if (!vehicles[0]) throw Object.assign(new Error("Available vehicle not found."), { status: 404 });
                            const conflict = await findRentalConflict(client, vehicleId, data.pickupDate, data.returnDate);
                            if (conflict) throw Object.assign(new Error("That vehicle was booked before payment was finalized. The selected dates are no longer available."), { status: 409 });
                            await client.query(
                                `INSERT INTO car_rental_booking (account_id, vehicle_id, booking_reference, booking_date, pickup_date, return_date, pickup_location, total_amount, booking_status, payment_method)
                                 VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, 'Confirmed', 'Xendit')`,
                                [checkout.account_id, vehicleId, checkout.booking_reference, data.pickupDate, data.returnDate, data.pickupLocation, totalAmount]
                            );
                            createdPaidRental = true;
                            await client.query("COMMIT");
                            const { rows: rentalRows } = await db.query(
                                `SELECT b.*, v.vehicle_name, v.plate_number, v.daily_rate,
                                        a.first_name, a.last_name, a.email, a.contact_number
                                 FROM car_rental_booking b
                                 JOIN vehicle v ON v.vehicle_id = b.vehicle_id
                                 JOIN account a ON a.account_id = b.account_id
                                 WHERE b.booking_reference = $1 AND b.deleted_at IS NULL`,
                                [checkout.booking_reference]
                            );
                            if (createdPaidRental) await notifyPaymentReceived(checkout.account_id, null, checkout.booking_reference, "rental");
                            if (rentalRows[0]) {
                                try {
                                    await sendBookingConfirmation({
                                        ...rentalRows[0],
                                        payment_status: "Paid",
                                        payment_transaction_reference: sessionId,
                                    }, "rental");
                                } catch (error) {
                                    console.error("[payment] rental confirmation email error:", error.message);
                                }
                            }
                            return res.status(200).json({ received: true });
                        }
                        const totalAmount = Number(data.totalPrice || session.amount || 0);
                        const paymentAmount = Number(session.amount || data.downpaymentAmount || totalAmount);
                        const inserted = await client.query(
                            `INSERT INTO booking (account_id, package_id, booking_reference, booking_date, travel_date, number_of_persons, total_amount, customized_details, participant_names, payment_method, payment_reference, payment_amount, payment_status, booking_status)
                             VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, 'Xendit', $9, $10, 'Paid', 'Confirmed') RETURNING booking_id`,
                            [checkout.account_id, packageId, checkout.booking_reference, data.tourDate, Number(data.guestsCount), totalAmount, data.customizedDetails ? JSON.stringify(data.customizedDetails) : null, Array.isArray(data.participantNames) ? JSON.stringify(data.participantNames) : null, sessionId, paymentAmount]
                        );
                        createdPaidBookingId = inserted.rows[0]?.booking_id || null;
                    }
                    await client.query("COMMIT");
                } catch (error) {
                    await client.query("ROLLBACK");
                    throw error;
                } finally {
                    client.release();
                }
                if (createdPaidBookingId) await notifyPaymentReceived(checkout.account_id, createdPaidBookingId, checkout.booking_reference);
                return res.status(200).json({ received: true });
            }
            const bookingId = Number(session.metadata?.booking_id);
            const reference = session.metadata?.booking_reference || session.reference_id;
            const finalized = await db.query(
                `UPDATE booking SET booking_status = 'Confirmed', payment_status = 'Paid',
                        payment_reference = $1, payment_amount = COALESCE($2, payment_amount)
                 WHERE deleted_at IS NULL AND payment_status IS DISTINCT FROM 'Paid' AND (booking_id = $3 OR booking_reference = $4)
                 RETURNING booking_id, account_id, booking_reference`,
                [session.payment_session_id || session.payment_id || reference, Number.isFinite(Number(session.amount)) ? Number(session.amount) : null, Number.isInteger(bookingId) ? bookingId : -1, reference || ""]
            );
            if (finalized.rows[0]) {
                await notifyPaymentReceived(
                    finalized.rows[0].account_id,
                    finalized.rows[0].booking_id,
                    finalized.rows[0].booking_reference || reference || finalized.rows[0].booking_id
                );
                try {
                    await sendPaidBookingConfirmation(finalized.rows[0].booking_id, session.payment_session_id || session.payment_id || reference);
                } catch (error) {
                    console.error("[payment] booking confirmation email error:", error.message);
                }
            }
        }
        return res.status(200).json({ received: true });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
