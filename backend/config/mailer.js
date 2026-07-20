const nodemailer = require("nodemailer");

function getMailer() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        return null;
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
}

async function sendPasswordResetOtp(email, otp) {
    const transporter = getMailer();

    if (!transporter) {
        console.warn(`[mailer] Email delivery is not configured. OTP for ${email}: ${otp}`);
        return false;
    }

    try {
        await transporter.sendMail({
            from: `"RABAS Travel & Tours" <${process.env.GMAIL_FROM || process.env.GMAIL_USER}>`,
            to: email,
            subject: "Password Reset Verification Code",

            text: `
Dear Customer,

We received a request to reset the password for your RABAS Travel & Tours account.

Your verification code is:

${otp}

This code is valid for 10 minutes.

If you did not request a password reset, please ignore this email. No changes will be made to your account unless this code is used.

For your security, do not share this verification code with anyone.

Thank you.

Sincerely,

RABAS Travel & Tours
            `,

            html: `
<div style="font-family: Arial, sans-serif; color: #fff700; line-height: 1.6; max-width: 600px; margin: auto;">

    <h2 style="color: #fff700;">Rabas Travel & Tours Services</h2>

    <p>Dear Customer,</p>

    <p>
        We received a request to reset the password for your
        <strong>RABAS Travel & Tours Services</strong> account.
    </p>

    <p>Please use the verification code below to continue:</p>

    <div style="background:#f4f4f4; border:1px solid #ddd; padding:15px; text-align:center; margin:20px 0;">
        <h1 style="margin:0; letter-spacing:6px; color:#0B4F6C;">
            ${otp}
        </h1>
    </div>

    <p>
        If you did not request a password reset, you may safely ignore this email.
        No changes will be made to your account unless this code is used.
    </p>

    <p>
        For your security, please do not share this verification code with anyone.
    </p>

    <p>
        Thank you.
    </p>

    <p>
        Sincerely,<br>
        <strong>RABAS Management</strong>
    </p>

    <hr>

    <p style="font-size:12px; color:#777;">
        This is an automated email. Please do not reply to this message.
    </p>

</div>
            `,
        });

        console.log(`[mailer] Password reset email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error(`[mailer] Failed to send password reset email to ${email}:`, error.message);
        return false;
    }
}

module.exports = {
    sendPasswordResetOtp,
};