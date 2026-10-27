const express = require("express");
const crypto = require("crypto");
const db = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const PAYMONGO_API = "https://api.paymongo.com";

function clientOrigin() {
    return (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",")[0].trim();
}

function paymongoAuth() {
    const key = process.env.PAYMONGO_SECRET_KEY;
    if (!key) throw Object.assign(new Error("PayMongo is not configured. Set PAYMONGO_SECRET_KEY on the backend."), { status: 503 });
    return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

async function paymongoRequest(path, body) {
    const response = await fetch(`${PAYMONGO_API}${path}`, {
        method: "POST",
        headers: { Authorization: paymongoAuth(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = data?.errors?.[0]?.detail || "PayMongo could not create the checkout session.";
        throw Object.assign(new Error(message), { status: response.status >= 500 ? 502 : 422 });
    }
    return data;
}

router.post("/paymongo/checkout-session", requireAuth, async (req, res, next) => {
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

        const session = await paymongoRequest("/v2/checkout_sessions", {
            data: {
                attributes: {
                    line_items: [{ name: booking.package_name, amount: Math.round(amount * 100), currency: "PHP", quantity: 1 }],
                    payment_method_types: (process.env.PAYMONGO_PAYMENT_METHODS || "card,gcash,qrph").split(",").map((item) => item.trim()).filter(Boolean),
                    billing: {
                        name: `${booking.first_name || ""} ${booking.last_name || ""}`.trim(),
                        email: booking.email,
                        phone: booking.contact_number || undefined,
                    },
                    description: `RABAS booking ${booking.booking_reference}`,
                    reference_number: booking.booking_reference,
                    metadata: { booking_id: String(booking.booking_id) },
                    success_url: `${clientOrigin()}/profile?payment=success&booking_id=${booking.booking_id}`,
                    cancel_url: `${clientOrigin()}/profile?payment=cancelled&booking_id=${booking.booking_id}`,
                    send_email_receipt: false,
                    show_description: true,
                    show_line_items: true,
                },
            },
        });
        const sessionData = session?.data;
        const checkoutUrl = sessionData?.attributes?.checkout_url;
        if (!checkoutUrl) throw Object.assign(new Error("PayMongo did not return a checkout URL."), { status: 502 });

        await db.query(
            "UPDATE booking SET payment_method = 'PayMongo', payment_reference = $1, payment_status = 'Pending' WHERE booking_id = $2 AND account_id = $3",
            [sessionData.id, bookingId, req.user.accountId]
        );
        res.json({ checkoutUrl, sessionId: sessionData.id, bookingId });
    } catch (error) { next(error); }
});

function verifySignature(rawBody, header, secret, livemode) {
    if (!rawBody || !header || !secret) return false;
    const parts = Object.fromEntries(String(header).split(",").map((part) => part.split("=")));
    const provided = parts[livemode ? "li" : "te"];
    if (!parts.t || !provided) return false;
    const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
    return provided.length === expected.length && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

router.post("/paymongo/webhook", async (req, res) => {
    const rawBody = req.rawBody;
    const payload = req.body;
    if (!verifySignature(rawBody, req.headers["paymongo-signature"], process.env.PAYMONGO_WEBHOOK_SECRET, Boolean(payload?.data?.attributes?.livemode))) {
        return res.status(401).json({ message: "Invalid PayMongo webhook signature." });
    }

    const event = payload?.data?.attributes;
    if (event?.type === "checkout_session.payment.paid") {
        const session = event.data;
        const attrs = session?.attributes || {};
        const paidPayment = (attrs.payments || []).find((payment) => payment?.attributes?.status === "paid") || attrs.payments?.[0];
        const paymentAttrs = paidPayment?.attributes || {};
        const bookingId = Number(attrs.metadata?.booking_id);
        const reference = attrs.reference_number;
        await db.query(
            `UPDATE booking SET booking_status = 'Confirmed', payment_status = 'Paid',
                    payment_reference = $1, payment_amount = COALESCE($2, payment_amount)
             WHERE deleted_at IS NULL AND (booking_id = $3 OR booking_reference = $4)`,
            [paidPayment?.id || session?.id, Number.isFinite(Number(paymentAttrs.amount)) ? Number(paymentAttrs.amount) / 100 : null, Number.isInteger(bookingId) ? bookingId : -1, reference || ""]
        );
    }
    return res.status(200).json({ received: true });
});

module.exports = router;
