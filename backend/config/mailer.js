const nodemailer = require("nodemailer");

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
function getMailer() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        return null;
    }

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
}

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
// PASSWORD RESET OTP EMAIL
async function sendPasswordResetOtp(email, otp) {
    const transporter = getMailer();

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    if (!transporter) {
        console.warn(
            `[mailer] Email delivery is not configured. Password Reset OTP for ${email}: ${otp}`
        );
        return false;
    }

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    try {
        await transporter.sendMail({
            from: `"RABAS Travel & Tours Services" <${process.env.GMAIL_FROM || process.env.GMAIL_USER}>`,
            to: email,
            subject: "Password Reset Verification Code",

<<<<<<< HEAD







            text: `
Dear Customer,








We received a request to reset the password for your RABAS Travel & Tours Services account.








Your verification code is:








${otp}








This code is valid for 10 minutes.








If you did not request a password reset, please ignore this email. No changes will be made to your account unless this verification code is used.








For your security, please do not share this verification code with anyone.








Thank you.








Sincerely,








RABAS Travel & Tours Services
            `,








            html: `
<div style="font-family: Arial, sans-serif; color:#333; line-height:1.6; max-width:600px; margin:auto; padding:20px;">








=======
            text: `
Dear Customer,

We received a request to reset the password for your RABAS Travel & Tours Services account.

Your verification code is:

${otp}

This code is valid for 10 minutes.

If you did not request a password reset, please ignore this email. No changes will be made to your account unless this verification code is used.

For your security, please do not share this verification code with anyone.

Thank you.

Sincerely,

RABAS Travel & Tours Services
            `,

            html: `
<div style="font-family: Arial, sans-serif; color:#333; line-height:1.6; max-width:600px; margin:auto; padding:20px;">

>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <h2 style="color:#0B4F6C; margin-bottom:20px;">
        RABAS Travel & Tours Services
    </h2>

<<<<<<< HEAD







    <p>Dear Customer,</p>








=======
    <p>Dear Customer,</p>

>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        We received a request to reset the password for your
        <strong>RABAS Travel & Tours Services</strong> account.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        Please use the verification code below to continue with your password reset request.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <div style="
        background:#f4f4f4;
        border:1px solid #dddddd;
        border-radius:8px;
        padding:20px;
        text-align:center;
        margin:25px 0;
    ">
        <h1 style="
            margin:0;
            letter-spacing:8px;
            color:#0B4F6C;
            font-size:32px;
        ">
            ${otp}
        </h1>
    </div>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        <strong>Note:</strong> This verification code is valid for
        <strong>10 minutes</strong>.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        If you did not request a password reset, you may safely ignore this email.
        No changes will be made to your account unless this verification code is used.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        For your security, please do not share this verification code with anyone.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        Thank you for choosing RABAS Travel & Tours Services.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        Sincerely,<br>
        <strong>RABAS Travel & Tours Services</strong>
    </p>

<<<<<<< HEAD







    <hr style="margin-top:30px;">








=======
    <hr style="margin-top:30px;">

>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p style="font-size:12px; color:#777;">
        This is an automated email. Please do not reply to this message.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
</div>
            `,
        });

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
        console.log(
            `[mailer] Password reset email sent successfully to ${email}`
        );

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
        return true;
    } catch (error) {
        console.error(
            `[mailer] Failed to send password reset email to ${email}:`,
            error.message
        );

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
        return false;
    }
}

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
// TWO-FACTOR AUTHENTICATION EMAIL
async function sendTwoFactorOtp(email, otp) {
    const transporter = getMailer();

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    if (!transporter) {
        console.warn(
            `[mailer] Email delivery is not configured. Two-Factor Authentication OTP for ${email}: ${otp}`
        );
        return false;
    }

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    try {
        await transporter.sendMail({
            from: `"RABAS Travel & Tours Services" <${process.env.GMAIL_FROM || process.env.GMAIL_USER}>`,
            to: email,
            subject: "Two-Factor Authentication Verification Code",

<<<<<<< HEAD







            text: `
Dear Customer,








A sign-in attempt to your RABAS Travel & Tours Services account requires additional verification.








Your verification code is:








${otp}








This code is valid for 10 minutes.








If you did not attempt to sign in to your account, we recommend changing your password immediately and securing your account.








For your security, please do not share this verification code with anyone.








Thank you.








Sincerely,








RABAS Travel & Tours Services
            `,








            html: `
<div style="font-family: Arial, sans-serif; color:#333; line-height:1.6; max-width:600px; margin:auto; padding:20px;">








=======
            text: `
Dear Customer,

A sign-in attempt to your RABAS Travel & Tours Services account requires additional verification.

Your verification code is:

${otp}

This code is valid for 10 minutes.

If you did not attempt to sign in to your account, we recommend changing your password immediately and securing your account.

For your security, please do not share this verification code with anyone.

Thank you.

Sincerely,

RABAS Travel & Tours Services
            `,

            html: `
<div style="font-family: Arial, sans-serif; color:#333; line-height:1.6; max-width:600px; margin:auto; padding:20px;">

>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <h2 style="color:#0B4F6C; margin-bottom:20px;">
        RABAS Travel & Tours Services
    </h2>

<<<<<<< HEAD







    <p>Dear Customer,</p>








=======
    <p>Dear Customer,</p>

>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        A sign-in attempt to your
        <strong>RABAS Travel & Tours Services</strong> account requires additional verification.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        Please use the verification code below to complete the authentication process.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <div style="
        background:#f4f4f4;
        border:1px solid #dddddd;
        border-radius:8px;
        padding:20px;
        text-align:center;
        margin:25px 0;
    ">
        <h1 style="
            margin:0;
            letter-spacing:8px;
            color:#0B4F6C;
            font-size:32px;
        ">
            ${otp}
        </h1>
    </div>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        <strong>Note:</strong> This verification code is valid for
        <strong>10 minutes</strong>.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        If you did not attempt to sign in to your account, we recommend changing your password immediately and securing your account.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        For your security, please do not share this verification code with anyone.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        Thank you for choosing RABAS Travel & Tours Services.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p>
        Sincerely,<br>
        <strong>RABAS Travel & Tours Services</strong>
    </p>

<<<<<<< HEAD







    <hr style="margin-top:30px;">








=======
    <hr style="margin-top:30px;">

>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
    <p style="font-size:12px; color:#777;">
        This is an automated email. Please do not reply to this message.
    </p>

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
</div>
            `,
        });

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
        console.log(
            `[mailer] Two-Factor Authentication email sent successfully to ${email}`
        );

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
        return true;
    } catch (error) {
        console.error(
            `[mailer] Failed to send Two-Factor Authentication email to ${email}:`,
            error.message
        );

<<<<<<< HEAD







=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
        return false;
    }
}

// BOOKING CONFIRMATION EMAIL
// Email delivery is intentionally best-effort: a temporary Gmail outage must
// not undo a booking that was already saved to the database.
async function sendBookingConfirmation(booking, type = "tour") {
    const email = booking?.email;
    if (!email) return false;

    const transporter = getMailer();
    if (!transporter) {
        console.warn(`[mailer] Booking confirmation not sent; email delivery is not configured (${email}).`);
        return false;
    }

    const esc = (value) => String(value ?? "").replace(/[&<>\"']/g, (char) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
    }[char]));
    const money = Number(booking.total_amount || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });
    const isRental = type === "rental";
    const title = isRental ? "Car Rental Booking Confirmation" : "Tour Booking Confirmation";
    const details = isRental
        ? [
            ["Vehicle", booking.vehicle_name],
            ["Plate number", booking.plate_number],
            ["Pickup date", booking.pickup_date],
            ["Return date", booking.return_date],
            ["Pickup location", booking.pickup_location],
            ["Payment method", booking.payment_method],
        ]
        : [
            ["Tour package", booking.package_name],
            ["Destination", booking.destination],
            ["Travel date", booking.travel_date],
            ["Number of persons", booking.number_of_persons],
        ];
    const detailText = details.map(([label, value]) => `${label}: ${value || "-"}`).join("\n");
    const detailHtml = details.map(([label, value]) => `<tr><td style="padding:7px 12px;color:#64748b">${esc(label)}</td><td style="padding:7px 12px;font-weight:bold">${esc(value || "-")}</td></tr>`).join("");
    try {
        await transporter.sendMail({
            from: `"RABAS Travel & Tours Services" <${process.env.GMAIL_FROM || process.env.GMAIL_USER}>`,
            to: email,
            subject: `${title} - ${booking.booking_reference}`,
            text: `Dear ${booking.first_name || "Customer"},\n\nThank you for booking with RABAS Travel & Tours Services. Your booking has been received.\n\nBooking reference: ${booking.booking_reference}\nStatus: ${booking.booking_status || "Pending"}\n${detailText}\nTotal amount: PHP ${money}\n\nPlease keep this email for your records. We will contact you with any updates.\n\nRABAS Travel & Tours Services`,
            html: `<div style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6;max-width:620px;margin:auto;padding:20px"><h2 style="color:#0B4F6C">RABAS Travel & Tours Services</h2><p>Dear ${esc(booking.first_name || "Customer")},</p><p>Thank you for booking with us. Your booking has been received and is currently <strong>${esc(booking.booking_status || "Pending")}</strong>.</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px"><p style="margin:0 0 8px"><strong>Booking reference:</strong> ${esc(booking.booking_reference)}</p><table style="width:100%;border-collapse:collapse">${detailHtml}</table><p style="margin:12px 0 0"><strong>Total amount:</strong> PHP ${esc(money)}</p></div><p>Please keep this email for your records. We will contact you with any updates.</p><p>Sincerely,<br><strong>RABAS Travel & Tours Services</strong></p><p style="font-size:12px;color:#64748b">This is an automated email. Please do not reply.</p></div>`
        });
        console.log(`[mailer] Booking confirmation sent to ${email}`);
        return true;
    } catch (error) {
        console.error(`[mailer] Failed to send booking confirmation to ${email}:`, error.message);
        return false;
    }
}





module.exports = {
    sendPasswordResetOtp,
    sendTwoFactorOtp,
    sendBookingConfirmation,
};
<<<<<<< HEAD












=======
>>>>>>> 723e337ae6472e21c5ff03761d2c74ee76f40625
