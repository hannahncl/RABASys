const nodemailer = require("nodemailer");

function getMailer() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
}

const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
}[character]));

async function sendEmail(email, subject, text, html, label) {
    if (!email) return false;
    const transporter = getMailer();
    if (!transporter) {
        console.warn(`[mailer] ${label} not sent; email delivery is not configured (${email}).`);
        return false;
    }

    try {
        await transporter.sendMail({
            from: `"RABAS Travel & Tours Services" <${process.env.GMAIL_FROM || process.env.GMAIL_USER}>`,
            to: email,
            subject,
            text,
            html,
        });
        console.log(`[mailer] ${label} sent to ${email}`);
        return true;
    } catch (error) {
        console.error(`[mailer] Failed to send ${label} to ${email}:`, error.message);
        return false;
    }
}

async function sendPasswordResetOtp(email, otp) {
    const text = `Dear Customer,\n\nYour RABAS Travel & Tours Services password reset code is ${otp}. It is valid for 10 minutes. If you did not request this code, ignore this email. Do not share the code with anyone.`;
    const html = `<div style="font-family:Arial,sans-serif;color:#333;line-height:1.6;max-width:600px;margin:auto;padding:20px"><h2 style="color:#0B4F6C">RABAS Travel & Tours Services</h2><p>Dear Customer,</p><p>Your password reset verification code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0B4F6C">${escapeHtml(otp)}</p><p>This code is valid for 10 minutes. If you did not request it, ignore this email. Do not share the code with anyone.</p></div>`;
    return sendEmail(email, "Password Reset Verification Code", text, html, "Password reset email");
}

async function sendTwoFactorOtp(email, otp) {
    const text = `Dear Customer,\n\nYour RABAS Travel & Tours Services sign-in verification code is ${otp}. It is valid for 10 minutes. Do not share this code with anyone.`;
    const html = `<div style="font-family:Arial,sans-serif;color:#333;line-height:1.6;max-width:600px;margin:auto;padding:20px"><h2 style="color:#0B4F6C">RABAS Travel & Tours Services</h2><p>Dear Customer,</p><p>Your sign-in verification code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0B4F6C">${escapeHtml(otp)}</p><p>This code is valid for 10 minutes. Do not share it with anyone.</p></div>`;
    return sendEmail(email, "Two-Factor Authentication Verification Code", text, html, "Two-factor authentication email");
}

async function sendBookingConfirmation(booking, type = "tour") {
    const email = booking?.email;
    if (!email) return false;

    const isRental = type === "rental";
    const isCustomTrip = !isRental && Boolean(booking.customized_details);
    const isCustomQuote = type === "custom-quote";
    const isCustomAccepted = type === "custom-accepted";
    const hasQuote = isCustomQuote || isCustomAccepted;
    let customDetails = booking.customized_details;
    if (typeof customDetails === "string") {
        try { customDetails = JSON.parse(customDetails); } catch { customDetails = {}; }
    }
    customDetails = customDetails || {};

    const title = isRental
        ? "Car Rental Booking Confirmation"
        : isCustomAccepted
            ? "Customized Trip Quote Accepted"
            : isCustomQuote
                ? "Customized Trip Quote"
                : isCustomTrip
                    ? "Customized Trip Request Received"
                    : "Tour Booking Confirmation";
    const details = isRental
        ? [
            ["Vehicle", booking.vehicle_name],
            ["Plate number", booking.plate_number],
            ["Pickup date", booking.pickup_date],
            ["Return date", booking.return_date],
            ["Pickup location", booking.pickup_location],
            ["Payment method", booking.payment_method],
        ]
        : isCustomTrip
            ? [
                ["Destination", booking.destination || customDetails.destination],
                ["Travel date", booking.travel_date],
                ["Number of persons", booking.number_of_persons],
                ["Duration", customDetails.duration],
                ["Accommodation", customDetails.hotel],
                ["Preferred guide", customDetails.preferredGuideName || "No preference"],
                ["Activities", Array.isArray(customDetails.activities) ? customDetails.activities.join(", ") : "None"],
            ]
            : [
                ["Tour package", booking.package_name],
                ["Destination", booking.destination],
                ["Travel date", booking.travel_date],
                ["Number of persons", booking.number_of_persons],
            ];

    const detailsText = details.map(([label, value]) => `${label}: ${value || "-"}`).join("\n");
    const detailsHtml = details.map(([label, value]) => `<tr><td style="padding:7px 12px;color:#64748b">${escapeHtml(label)}</td><td style="padding:7px 12px;font-weight:bold">${escapeHtml(value || "-")}</td></tr>`).join("");
    const priceBreakdown = hasQuote && Array.isArray(customDetails.priceBreakdown) ? customDetails.priceBreakdown : [];
    const itinerary = hasQuote ? String(customDetails.quoteItinerary || "").trim() : "";
    const itineraryText = hasQuote ? `\n\nProposed itinerary:\n${itinerary || "-"}` : "";
    const itineraryHtml = hasQuote
        ? `<h3 style="margin:18px 0 6px">Proposed itinerary</h3><p style="white-space:pre-line">${escapeHtml(itinerary || "-")}</p>`
        : "";
    const breakdownText = hasQuote
        ? `\n\nPrice breakdown:\n${priceBreakdown.map(line => `${line.description}: PHP ${Number(line.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`).join("\n")}`
        : "";
    const breakdownHtml = hasQuote
        ? `<h3 style="margin:18px 0 6px">Price breakdown</h3><table style="width:100%;border-collapse:collapse">${priceBreakdown.map(line => `<tr><td style="padding:7px 12px;color:#64748b">${escapeHtml(line.description)}</td><td style="padding:7px 12px;text-align:right;font-weight:bold">PHP ${Number(line.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td></tr>`).join("")}</table>`
        : "";
    const total = Number(booking.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });
    const priceText = isCustomTrip && !hasQuote
        ? "Final pricing will be provided after business review. No payment is due yet."
        : `Final quote total: PHP ${total}`;
    const priceHtml = isCustomTrip && !hasQuote
        ? "<p><strong>Final pricing:</strong> To be provided after business review. No payment is due yet.</p>"
        : `<p style="font-size:16px"><strong>Final quote total: PHP ${escapeHtml(total)}</strong></p>`;
    const message = isCustomAccepted
        ? "Your acceptance of the customized trip quote is confirmed."
        : isCustomQuote
            ? "Your customized trip request has been reviewed and quoted."
            : isCustomTrip
                ? "We received your customized trip request."
                : "Your booking has been received.";
    const followUp = isCustomAccepted
        ? "Your acceptance has been recorded. Our team will contact you with next steps and payment instructions."
        : isCustomQuote
            ? "To accept this itinerary and quote, sign in to your RABAS account and accept it from your booking details. No payment has been taken yet."
            : isCustomTrip
                ? "Our team will review your selections and email you with the final quote and updates. No payment is required until pricing is reviewed."
                : "Please keep this email for your records. We will contact you with any updates.";
    const status = isCustomTrip && !hasQuote ? "Under review" : booking.booking_status || "Pending";
    const html = `<div style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;max-width:620px;margin:auto;padding:20px"><h2 style="color:#0B4F6C">RABAS Travel & Tours Services</h2><p>Dear ${escapeHtml(booking.first_name || "Customer")},</p><p>${escapeHtml(message)}</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px"><p><strong>Booking reference:</strong> ${escapeHtml(booking.booking_reference)}</p><p><strong>Status:</strong> ${escapeHtml(status)}</p><table style="width:100%;border-collapse:collapse">${detailsHtml}</table>${itineraryHtml}${breakdownHtml}${priceHtml}</div><p>${escapeHtml(followUp)}</p><p>Sincerely,<br><strong>RABAS Travel & Tours Services</strong></p><p style="font-size:12px;color:#64748b">This is an automated email. Please do not reply.</p></div>`;
    const text = `Dear ${booking.first_name || "Customer"},\n\n${message}\n\nBooking reference: ${booking.booking_reference}\nStatus: ${status}\n${detailsText}${itineraryText}${breakdownText}\n\n${priceText}\n\n${followUp}\n\nRABAS Travel & Tours Services`;
    return sendEmail(email, `${title} - ${booking.booking_reference}`, text, html, "Booking email");
}

async function sendTripReminder(booking, type = "tour") {
    const email = booking?.email;
    if (!email) return false;
    const isRental = type === "rental";
    const schedule = isRental ? booking.pickup_date : booking.travel_date;
    const scheduleLabel = new Date(schedule).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
    const tripName = isRental ? booking.vehicle_name : booking.package_name;
    const location = isRental ? booking.pickup_location : booking.destination;
    const text = `Dear ${booking.first_name || "Customer"},\n\nThis is a friendly reminder that your ${isRental ? "car rental" : "trip"} is scheduled for tomorrow.\n\nBooking reference: ${booking.booking_reference}\n${isRental ? "Vehicle" : "Tour package"}: ${tripName || "-"}\nDate: ${scheduleLabel}\n${location ? `${isRental ? "Pickup location" : "Destination"}: ${location}\n` : ""}\nIf you need to change your schedule, use the rescheduling option in your RABAS account. Cancellation is not available.\n\nRABAS Travel & Tours Services`;
    const html = `<div style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;max-width:620px;margin:auto;padding:20px"><h2 style="color:#0B4F6C">RABAS Travel & Tours Services</h2><p>Dear ${escapeHtml(booking.first_name || "Customer")},</p><p>This is a friendly reminder that your ${isRental ? "car rental" : "trip"} is scheduled for <strong>tomorrow</strong>.</p><div><p><strong>Booking reference:</strong> ${escapeHtml(booking.booking_reference)}</p><p><strong>${isRental ? "Vehicle" : "Tour package"}:</strong> ${escapeHtml(tripName || "-")}</p><p><strong>Date:</strong> ${escapeHtml(scheduleLabel)}</p>${location ? `<p><strong>${isRental ? "Pickup location" : "Destination"}:</strong> ${escapeHtml(location)}</p>` : ""}</div><p>If you need to change your schedule, use the rescheduling option in your RABAS account. Cancellation is not available.</p><p>Sincerely,<br><strong>RABAS Travel & Tours Services</strong></p></div>`;
    return sendEmail(email, `Trip Reminder - Your ${isRental ? "car rental" : "tour"} is tomorrow`, text, html, "Trip reminder email");
}

module.exports = {
    sendPasswordResetOtp,
    sendTwoFactorOtp,
    sendBookingConfirmation,
    sendTripReminder,
};
