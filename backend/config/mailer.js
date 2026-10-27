const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

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

function pdfEscape(value) {
    return String(value ?? "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[\r\n]+/g, " ");
}

function wrapPdfLine(value, width = 88) {
    const text = String(value ?? "");
    if (!text) return [""];
    const words = text.split(/\s+/);
    const lines = [];
    let current = "";
    for (const word of words) {
        if (!current) current = word;
        else if (`${current} ${word}`.length <= width) current += ` ${word}`;
        else { lines.push(current); current = word; }
    }
    if (current) lines.push(current);
    return lines;
}

function readRgbPng(filePath) {
    const png = fs.readFileSync(filePath);
    if (png.toString("ascii", 1, 4) !== "PNG") return null;
    let width = 0;
    let height = 0;
    let colorType = 0;
    const idat = [];
    let offset = 8;
    while (offset < png.length) {
        const length = png.readUInt32BE(offset);
        const type = png.toString("ascii", offset + 4, offset + 8);
        const data = png.subarray(offset + 8, offset + 8 + length);
        if (type === "IHDR") {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            colorType = data[9];
            if (data[8] !== 8 || colorType !== 2) return null;
        } else if (type === "IDAT") idat.push(data);
        offset += 12 + length;
        if (type === "IEND") break;
    }
    const decoded = zlib.inflateSync(Buffer.concat(idat));
    const bytesPerPixel = 3;
    const rowLength = width * bytesPerPixel;
    const rows = Buffer.alloc(height * rowLength);
    let sourceOffset = 0;
    for (let row = 0; row < height; row++) {
        const filter = decoded[sourceOffset++];
        const currentStart = row * rowLength;
        for (let column = 0; column < rowLength; column++) {
            const raw = decoded[sourceOffset++];
            const left = column >= bytesPerPixel ? rows[currentStart + column - bytesPerPixel] : 0;
            const above = row > 0 ? rows[currentStart - rowLength + column] : 0;
            const upperLeft = row > 0 && column >= bytesPerPixel ? rows[currentStart - rowLength + column - bytesPerPixel] : 0;
            let value = raw;
            if (filter === 1) value = (raw + left) & 255;
            else if (filter === 2) value = (raw + above) & 255;
            else if (filter === 3) value = (raw + Math.floor((left + above) / 2)) & 255;
            else if (filter === 4) {
                const p = left + above - upperLeft;
                const pa = Math.abs(p - left);
                const pb = Math.abs(p - above);
                const pc = Math.abs(p - upperLeft);
                value = (raw + (pa <= pb && pa <= pc ? left : pb <= pc ? above : upperLeft)) & 255;
            }
            rows[currentStart + column] = value;
        }
    }
    return { width, height, data: zlib.deflateSync(rows, { level: 9 }) };
}

function createSimplePdf(lines) {
    const entries = lines.map((line) => {
        if (line.startsWith("SECTION|")) return { type: "section", text: line.slice(8) };
        if (line.startsWith("ITEM|")) return { type: "item", text: line.slice(5) };
        if (line.startsWith("ROW|")) {
            const separator = line.indexOf("|", 4);
            return { type: "row", label: separator === -1 ? line.slice(4) : line.slice(4, separator), value: separator === -1 ? "" : line.slice(separator + 1) };
        }
        return { type: "row", label: "", value: line };
    });
    const pages = [];
    let current = [];
    let height = 700;
    for (const entry of entries) {
        const cost = entry.type === "section" ? 27 : Math.max(18, Math.ceil(wrapPdfLine(entry.value || entry.text, 64).length / 2) * 15);
        if (height - cost < 54 && current.length) { pages.push(current); current = []; height = 700; }
        current.push(entry);
        height -= cost;
    }
    if (current.length || !pages.length) pages.push(current);

    const objects = [];
    const addObject = (body) => { objects.push(body); return objects.length; };
    const catalogId = addObject("");
    const pagesId = addObject("");
    const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const boldFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
    const logo = readRgbPng(path.resolve(__dirname, "../../frontend/public/RABAS LOGO.png"));
    const logoId = logo ? addObject(`<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${logo.data.length} >>\nstream\n${logo.data.toString("binary")}\nendstream`) : null;
    const pageIds = [];

    for (const page of pages) {
        const commands = [];
        if (logoId) commands.push("q", "125 0 0 50 36 765 cm", "/Logo Do", "Q");
        commands.push("BT", "/F2 17 Tf", "175 798 Td", "(RABAS TRAVEL & TOURS SERVICES) Tj", "/F2 11 Tf", "0 -21 Td", "(TOUR ITINERARY) Tj", "ET");
        const reference = entries.find(entry => entry.type === "row" && entry.label === "Reference")?.value || "-";
        const status = entries.find(entry => entry.type === "row" && entry.label === "Status")?.value || "-";
        commands.push("BT", "/F1 9 Tf", "390 798 Td", `(${pdfEscape(`Reference: ${reference}`)}) Tj`, "0 -18 Td", `(${pdfEscape(`Status: ${status}`)}) Tj`, "ET");

        let y = 728;
        for (const entry of page) {
            if (entry.type === "row" && (entry.label === "Reference" || entry.label === "Status")) continue;
            if (entry.type === "section") {
                commands.push("0.91 0.91 0.91 rg", `36 ${y - 5} 523 19 re f`, "0 0 0 rg", "BT", "/F2 9 Tf", `46 ${y} Td`, `(${pdfEscape(entry.text)}) Tj`, "ET");
                y -= 27;
                continue;
            }
            const linesForValue = wrapPdfLine(entry.value || entry.text, 64);
            commands.push("BT", "/F2 9 Tf", `46 ${y} Td`, `(${pdfEscape(entry.label || (entry.type === "item" ? "" : "Details"))}) Tj`, "/F1 9 Tf", "185 0 Td", `(${pdfEscape(linesForValue[0] || "-")}) Tj`, "ET");
            for (let index = 1; index < linesForValue.length; index++) {
                y -= 13;
                commands.push("BT", "/F1 9 Tf", `231 ${y} Td`, `(${pdfEscape(linesForValue[index])}) Tj`, "ET");
            }
            y -= 18;
        }
        commands.push("0.55 0.55 0.55 RG", "0.6 w", `36 48 m 559 48 l S`, "0 0 0 rg", "BT", "/F1 8 Tf", "36 32 Td", "(This document is an automated booking itinerary for your records.) Tj", "ET");
        const stream = commands.join("\n");
        const contentId = addObject(`<< /Length ${Buffer.byteLength(stream, "ascii")} >>\nstream\n${stream}\nendstream`);
        const xObjects = logoId ? ` /XObject << /Logo ${logoId} 0 R >>` : "";
        const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R >>${xObjects} >> /Contents ${contentId} 0 R >>`);
        pageIds.push(pageId);
    }

    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
    let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const offsets = [0];
    objects.forEach((body, index) => { offsets.push(Buffer.byteLength(pdf, "binary")); pdf += `${index + 1} 0 obj\n${body}\nendobj\n`; });
    const xrefOffset = Buffer.byteLength(pdf, "binary");
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let index = 1; index < offsets.length; index++) pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, "binary");
}

function formatReceiptDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function createBookingReceiptPdf(booking, type, details, itineraryLines = [], breakdownLines = []) {
    const lines = [
        `ROW|Reference|${booking.booking_reference || "-"}`,
        `ROW|Status|${booking.booking_status || "Pending"}`,
        "SECTION|CUSTOMER DETAILS",
        `ROW|Name|${`${booking.first_name || ""} ${booking.last_name || ""}`.trim() || "-"}`,
        `ROW|Email|${booking.email || "-"}`,
        `ROW|Contact number|${booking.contact_number || "-"}`,
        `SECTION|TRIP DETAILS`,
        `ROW|Service|${type === "rental" ? "Car Rental" : type.startsWith("custom") ? "Customized Trip" : "Tour Package"}`,
        ...details.map(([label, value]) => `ROW|${label}|${value || "-"}`),
    ];
    if (itineraryLines.length) lines.push("SECTION|ITINERARY", ...itineraryLines.map((line, index) => `ITEM|${index + 1}. ${line}`));
    if (breakdownLines.length) lines.push("SECTION|PRICE SUMMARY", ...breakdownLines.map(line => `ROW|Item|${line}`));
    lines.push(`ROW|Total amount|PHP ${Number(booking.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`);
    return createSimplePdf(lines);
}

function normalizeItineraryLines(value) {
    if (!value) return [];
    let parsed = value;
    if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch { return parsed.split(/\r?\n/).map(line => line.trim()).filter(Boolean); }
    }
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => {
        if (typeof entry === "string") return entry.trim();
        if (!entry || typeof entry !== "object") return "";
        const day = entry.day ? `Day ${entry.day}: ` : "";
        const title = entry.title || "";
        const description = entry.desc && entry.desc !== title ? ` — ${entry.desc}` : "";
        return `${day}${title || entry.desc || ""}${description}`.trim();
    }).filter(Boolean);
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
    const isConfirmedJoiner = !isRental
        && !isCustomTrip
        && String(booking.package_type || "").toLowerCase() === "joiner"
        && booking.booking_status === "Confirmed";
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
            ["Daily rate", `PHP ${Number(booking.daily_rate || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`],
            ["Pickup date", booking.pickup_date],
            ["Return date", booking.return_date],
            ["Pickup location", booking.pickup_location],
            ["Payment method", booking.payment_method],
        ]
        : isCustomTrip
            ? [
                ["Destination", booking.destination || customDetails.destination],
                ["Destinations by day", Array.isArray(customDetails.destinationSchedule)
                    ? customDetails.destinationSchedule.map(item => `Day ${item.day}: ${(item.destinations || []).join(", ") || "Not set"}`).join("; ")
                    : "-"],
                ["Travel date", booking.travel_date],
                ["Number of persons", booking.number_of_persons],
                ["Duration", customDetails.duration],
                ["Accommodation", customDetails.hotel],
                ["Preferred guide", customDetails.preferredGuideName || "No preference"],
                ["Activities", Array.isArray(customDetails.activities) ? customDetails.activities.join(", ") : "None"],
                ["Budget", customDetails.budget],
                ["Travel style", customDetails.travelStyle],
                ["Special requests", customDetails.specialRequests || customDetails.notes],
            ]
            : [
                ["Tour package", booking.package_name],
                ["Package type", booking.package_type],
                ["Destination", booking.destination],
                ["Travel date", booking.travel_date],
                ["Number of persons", booking.number_of_persons],
                ["Duration", booking.duration],
                ["Meeting location", booking.meeting_location],
                ["Inclusions", normalizeItineraryLines(booking.inclusion).join(", ") || (booking.inclusion || "-")],
                ["Joiner trip date", booking.joiner_date],
                ["Available slots", booking.joiner_slots],
                ["Booking deadline", booking.joiner_booking_deadline],
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
                : isConfirmedJoiner
                    ? "Your Joiner booking is confirmed and your spots are reserved."
                    : "Your booking has been received.";
    const followUp = isCustomSamplePayment
        ? "This is a sample payment receipt only. No real payment was processed or money transferred."
        : isCustomAccepted
        ? "Your acceptance has been recorded. Our team will contact you with next steps and payment instructions."
        : isCustomQuote
            ? "To accept this itinerary and quote, sign in to your RABAS account and accept it from your booking details. No payment has been taken yet."
            : isCustomTrip
                ? "Our team will review your selections and email you with the final quote and updates. No payment is required until pricing is reviewed."
                : isConfirmedJoiner
                    ? "Your Joiner departure is confirmed. Please keep this email for your records."
                : "Please keep this email for your records. We will contact you with any updates.";
    const status = isCustomTrip && !hasQuote ? "Under review" : booking.booking_status || "Pending";
    const html = `<div style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;max-width:620px;margin:auto;padding:20px"><h2 style="color:#0B4F6C">RABAS Travel & Tours Services</h2><p>Dear ${escapeHtml(booking.first_name || "Customer")},</p><p>${escapeHtml(message)}</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px"><p><strong>Booking reference:</strong> ${escapeHtml(booking.booking_reference)}</p><p><strong>Status:</strong> ${escapeHtml(status)}</p><table style="width:100%;border-collapse:collapse">${detailsHtml}</table>${itineraryHtml}${breakdownHtml}${priceHtml}</div><p>${escapeHtml(followUp)}</p><p>Sincerely,<br><strong>RABAS Travel & Tours Services</strong></p><p style="font-size:12px;color:#64748b">This is an automated email. Please do not reply.</p></div>`;
    const text = `Dear ${booking.first_name || "Customer"},\n\n${message}\n\nBooking reference: ${booking.booking_reference}\nStatus: ${status}\n${detailsText}${itineraryText}${breakdownText}\n\n${priceText}\n\n${followUp}\n\nRABAS Travel & Tours Services`;
    const receiptDetails = [
        ...details,
        ["Booking date", formatReceiptDate(booking.booking_date)],
        ["Payment method", booking.payment_method || "-"],
        ["Payment status", booking.payment_status || "Pending"],
        ["Payment reference", booking.payment_transaction_reference || "-"],
        ["Total amount", `PHP ${total}`],
    ];
    const itineraryLines = isCustomTrip
        ? (Array.isArray(customDetails.quoteItinerary) ? normalizeItineraryLines(customDetails.quoteItinerary) : String(customDetails.quoteItinerary || customDetails.itinerary || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean))
        : normalizeItineraryLines(booking.itinerary);
    const receiptBreakdown = priceBreakdown.map(line => `${line.description || "Item"}: PHP ${Number(line.amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`);
    const receiptPdf = createBookingReceiptPdf(booking, type, receiptDetails, itineraryLines, receiptBreakdown);
    const receiptFilename = `RABAS-Booking-Receipt-${String(booking.booking_reference || "booking").replace(/[^a-z0-9_-]/gi, "-")}.pdf`;
    return sendEmail(email, `${title} - ${booking.booking_reference}`, text, html, "Booking email", [{
        filename: receiptFilename,
        content: receiptPdf,
        contentType: "application/pdf",
    }]);
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
