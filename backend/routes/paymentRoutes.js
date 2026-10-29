const express = require("express");
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");

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

router.post("/xendit/checkout-session", requireAuth, async (req, res, next) => {
    try {
        const bookingId = Number(req.body.booking_id);
        if (!Number.isInteger(bookingId)) return res.status(422).json({ message: "A valid booking_id is required." });

        const { rows } = await db.query(
            `SELECT b.booking_id, b.booking_reference, b.total_amount, b.payment_amount, b.payment_status,
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

        const amount = Number(booking.payment_amount ?? booking.total_amount);
        if (!Number.isFinite(amount) || amount <= 0) return res.status(422).json({ message: "This booking has no payable amount." });
        if (booking.payment_status === "Paid") return res.status(409).json({ message: "This booking has already been paid." });

        const [firstName = "Customer", ...lastNameParts] = String(booking.first_name || "Customer").trim().split(/\s+/);
        const configuredChannels = String(process.env.XENDIT_PAYMENT_CHANNELS || "")
            .split(",")
            .map((item) => item.trim().toUpperCase())
            .filter(Boolean);
        const origin = clientOrigin();
        const redirectUrls = /^https:\/\//i.test(origin)
            ? {
                success_return_url: `${origin}/profile?payment=success&booking_id=${booking.booking_id}`,
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
        if (event === "payment_session.completed" && session?.status === "COMPLETED") {
            const bookingId = Number(session.metadata?.booking_id);
            const reference = session.metadata?.booking_reference || session.reference_id;
            await db.query(
                `UPDATE booking SET booking_status = 'Confirmed', payment_status = 'Paid',
                        payment_reference = $1, payment_amount = COALESCE($2, payment_amount)
                 WHERE deleted_at IS NULL AND (booking_id = $3 OR booking_reference = $4)`,
                [session.payment_session_id || session.payment_id || reference, Number.isFinite(Number(session.amount)) ? Number(session.amount) : null, Number.isInteger(bookingId) ? bookingId : -1, reference || ""]
            );
        }
        return res.status(200).json({ received: true });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
