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

async function sendEmail(email, subject, text, html, label, attachments = []) {
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
            attachments,
        });
        console.log(`[mailer] ${label} sent to ${email}`);
        return true;
    } catch (error) {
        console.error(`[mailer] Failed to send ${label} to ${email}:`, error.message);
        return false;
    }
}

const pdfText = (value) => String(value ?? "-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");

const pdfEscape = (value) => pdfText(value).replace(/[\\()]/g, "\\$&");

const wrapPdfText = (value, maxLength = 86) => {
    const words = pdfText(value).split(/\s+/);
    const lines = [];
    let line = "";
    for (const word of words) {
        if (!word) continue;
        if ((line + (line ? " " : "") + word).length <= maxLength) {
            line += (line ? " " : "") + word;
        } else {
            if (line) lines.push(line);
            line = word;
        }
    }
    if (line) lines.push(line);
    return lines.length ? lines : ["-"];
};

function createItineraryPdf(booking, type, customDetails, priceBreakdown, status) {
    const isRental = type === "rental";
    const isCustomTrip = !isRental && Boolean(booking.customized_details);
    const title = isRental ? "CAR RENTAL ITINERARY" : "TOUR ITINERARY";
    const customerName = booking.customer_name || `${booking.first_name || ""} ${booking.last_name || ""}`.trim() || "-";
    const sections = [
        {
            title: "CUSTOMER DETAILS",
            rows: [
                ["Name", customerName],
                ["Email", booking.email || "-"],
                ["Contact number", booking.contact_number || "-"],
            ],
        },
        {
            title: isRental ? "RENTAL DETAILS" : "TRIP DETAILS",
            rows: isRental
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
                    ],
        },
        {
            title: "PRICE SUMMARY",
            rows: [
                ...priceBreakdown.map((line) => [
                    line.description || "Item",
                    `PHP ${Number(line.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
                ]),
                ["Total amount", `PHP ${Number(booking.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`],
                ...(isCustomTrip && !priceBreakdown.length ? [["Final pricing", "To be provided after business review."]] : []),
            ],
        },
    ];

    const items = [];
    sections.forEach((section) => {
        items.push({ type: "section", value: section.title });
        section.rows.forEach(([label, value]) => items.push({ type: "row", label, value: value || "-" }));
    });
    items.push({ type: "note", value: "This document is an automated booking itinerary for your records." });

    const getItemHeight = (item) => {
        if (item.type === "section") return 24;
        if (item.type === "note") return 32;
        return Math.max(18, wrapPdfText(`${item.label}: ${item.value}`, 70).length * 14 + 4);
    };

    const pageGroups = [];
    let currentPage = [];
    let currentHeight = 0;
    items.forEach((item) => {
        const height = getItemHeight(item);
        if (currentPage.length && currentHeight + height > 650) {
            pageGroups.push(currentPage);
            currentPage = [];
            currentHeight = 0;
        }
        currentPage.push(item);
        currentHeight += height;
    });
    if (currentPage.length) pageGroups.push(currentPage);

    const objects = [];
    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
    const pageRefs = [];
    pageGroups.forEach((group, pageIndex) => {
        const pageObject = 5 + pageIndex * 2;
        const streamObject = pageObject + 1;
        pageRefs.push(`${pageObject} 0 R`);
        let y = 748;
        const commands = ["0 g"];
        commands.push("0 G 0.8 w 54 766 m 558 766 l S");
        commands.push(`BT /F2 17 Tf 1 0 0 1 54 744 Tm (${pdfEscape("RABAS TRAVEL & TOURS SERVICES")}) Tj ET`);
        commands.push(`BT /F2 11 Tf 1 0 0 1 54 725 Tm (${pdfEscape(title)}) Tj ET`);
        commands.push(`BT /F1 9 Tf 1 0 0 1 395 744 Tm (${pdfEscape(`Reference: ${booking.booking_reference || "-"}`)}) Tj ET`);
        commands.push(`BT /F1 9 Tf 1 0 0 1 395 725 Tm (${pdfEscape(`Status: ${status || "Pending"}`)}) Tj ET`);
        y = 694;
        group.forEach((item) => {
            if (item.type === "section") {
                commands.push("0.92 g 54 " + (y - 5) + " 504 17 re f 0 G 0 g");
                commands.push(`BT /F2 9 Tf 1 0 0 1 64 ${y} Tm (${pdfEscape(item.value)}) Tj ET`);
                y -= 24;
                return;
            }
            if (item.type === "note") {
                commands.push("0.6 g 54 " + (y - 8) + " 504 0.5 re f 0 G 0 g");
                wrapPdfText(item.value, 92).forEach((line, index) => {
                    commands.push(`BT /F1 8 Tf 1 0 0 1 54 ${y - 20 - index * 12} Tm (${pdfEscape(line)}) Tj ET`);
                });
                y -= 32;
                return;
            }
            const wrapped = wrapPdfText(`${item.label}: ${item.value}`, 70);
            wrapped.forEach((line, index) => {
                const label = index === 0 ? `${item.label}:` : "";
                const value = index === 0 ? String(item.value || "-") : line;
                if (index === 0) {
                    commands.push(`BT /F2 9 Tf 1 0 0 1 64 ${y} Tm (${pdfEscape(label)}) Tj ET`);
                    wrapPdfText(value, 54).forEach((valueLine, valueIndex) => {
                        commands.push(`BT /F1 9 Tf 1 0 0 1 190 ${y - valueIndex * 13} Tm (${pdfEscape(valueLine)}) Tj ET`);
                    });
                }
            });
            y -= Math.max(18, wrapPdfText(String(item.value || "-"), 54).length * 13 + 5);
        });
        const stream = commands.join("\n");
        objects[pageObject] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamObject} 0 R >>`;
        objects[streamObject] = `<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`;
    });
    objects[2] = `<< /Type /Pages /Kids [${pageRefs.join(" ")}] /Count ${pageRefs.length} >>`;

    let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const offsets = [0];
    for (let i = 1; i < objects.length; i += 1) {
        offsets[i] = Buffer.byteLength(pdf, "binary");
        pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
    }
    const xrefOffset = Buffer.byteLength(pdf, "binary");
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, "binary");
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
    const isCustomSamplePayment = type === "custom-sample-payment";
    const hasQuote = isCustomQuote || isCustomAccepted || isCustomSamplePayment;
    let customDetails = booking.customized_details;
    if (typeof customDetails === "string") {
        try { customDetails = JSON.parse(customDetails); } catch { customDetails = {}; }
    }
    customDetails = customDetails || {};

    const title = isRental
        ? "Car Rental Booking Confirmation"
        : isCustomSamplePayment
            ? "Customized Trip Sample Payment Receipt"
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
    if (isCustomSamplePayment) {
        details.push(["Payment mode", `${booking.payment_method || "Sample Payment"} (simulation)`]);
        details.push(["Payment reference", booking.payment_transaction_reference]);
    }

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
    const message = isCustomSamplePayment
        ? "Your customized trip sample payment has been recorded."
        : isCustomAccepted
        ? "Your acceptance of the customized trip quote is confirmed."
        : isCustomQuote
            ? "Your customized trip request has been reviewed and quoted."
            : isCustomTrip
                ? "We received your customized trip request."
                : "Your booking has been received.";
    const followUp = isCustomSamplePayment
        ? "This is a sample payment receipt only. No real payment was processed or money transferred."
        : isCustomAccepted
        ? "Your acceptance has been recorded. Our team will contact you with next steps and payment instructions."
        : isCustomQuote
            ? "To accept this itinerary and quote, sign in to your RABAS account and accept it from your booking details. No payment has been taken yet."
            : isCustomTrip
                ? "Our team will review your selections and email you with the final quote and updates. No payment is required until pricing is reviewed."
                : "Please keep this email for your records. We will contact you with any updates.";
    const status = isCustomTrip && !hasQuote ? "Under review" : booking.booking_status || "Pending";
    const html = `<div style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;max-width:620px;margin:auto;padding:20px"><h2 style="color:#0B4F6C">RABAS Travel & Tours Services</h2><p>Dear ${escapeHtml(booking.first_name || "Customer")},</p><p>${escapeHtml(message)}</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px"><p><strong>Booking reference:</strong> ${escapeHtml(booking.booking_reference)}</p><p><strong>Status:</strong> ${escapeHtml(status)}</p><table style="width:100%;border-collapse:collapse">${detailsHtml}</table>${itineraryHtml}${breakdownHtml}${priceHtml}</div><p>${escapeHtml(followUp)}</p><p>Sincerely,<br><strong>RABAS Travel & Tours Services</strong></p><p style="font-size:12px;color:#64748b">This is an automated email. Please do not reply.</p></div>`;
    const text = `Dear ${booking.first_name || "Customer"},\n\n${message}\n\nBooking reference: ${booking.booking_reference}\nStatus: ${status}\n${detailsText}${itineraryText}${breakdownText}\n\n${priceText}\n\n${followUp}\n\nRABAS Travel & Tours Services`;
    const itineraryPdf = createItineraryPdf(booking, type, customDetails, priceBreakdown, status);
    return sendEmail(
        email,
        `${title} - ${booking.booking_reference}`,
        text,
        html,
        "Booking email",
        [{
            filename: `RABAS-Itinerary-${booking.booking_reference || "booking"}.pdf`,
            content: itineraryPdf,
            contentType: "application/pdf",
        }],
    );
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
