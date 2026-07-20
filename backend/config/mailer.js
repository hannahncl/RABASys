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

// PASSWORD RESET OTP EMAIL
async function sendPasswordResetOtp(email, otp) {
    const transporter = getMailer();

    if (!transporter) {
        console.warn(`[mailer] Email delivery is not configured. OTP for ${email}: ${otp}`);
        return false;
    }

    try {
        await transporter.sendMail({
            from: `"RABAS Travel & Tours Services" <${process.env.GMAIL_FROM || process.env.GMAIL_USER}>`,
            to: email,
            subject: "RABAS password reset code",
            text: `Your RABAS password reset code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
            html: `
            <div style="font-family: Arial, sans-serif; color:#333; line-height:1.6; max-width:600px; margin:auto; padding:20px;">
                <h2 style="color:#0B4F6C; margin-bottom:20px;">RABAS Travel & Tours Services</h2>
                <p>Dear Customer,</p>
                <p>We received a request to reset the password for your account.</p>
                <div style="background:#f4f4f4; border:1px solid #dddddd; border-radius:8px; padding:20px; text-align:center; margin:25px 0;">
                    <h1 style="margin:0; letter-spacing:8px; color:#0B4F6C; font-size:32px;">${otp}</h1>
                </div>
                <p><strong>Note:</strong> This verification code is valid for <strong>10 minutes</strong>.</p>
                <p>If you did not request a password reset, you may safely ignore this email.</p>
                <hr style="margin-top:30px;">
                <p style="font-size:12px; color:#777;">This is an automated email. Please do not reply to this message.</p>
            </div>
            `
        });
        return true;
    } catch (error) {
        console.error(
            `[mailer] Failed to send password reset email to ${email}:`,
            error.message
        );

        return false;
    }
}

// TWO-FACTOR AUTHENTICATION EMAIL
async function sendTwoFactorOtp(email, otp) {
    const transporter = getMailer();

    if (!transporter) {
        console.warn(`[mailer] Email delivery is not configured. Two-Factor Authentication OTP for ${email}: ${otp}`);
        return false;
    }

    try {
        await transporter.sendMail({
            from: `"RABAS Travel & Tours Services" <${process.env.GMAIL_FROM || process.env.GMAIL_USER}>`,
            to: email,
            subject: "Two-Factor Authentication Verification Code",
            text: `A sign-in attempt to your RABAS account requires verification. Your code is ${otp}. It expires in 10 minutes.`,
            html: `
            <div style="font-family: Arial, sans-serif; color:#333; line-height:1.6; max-width:600px; margin:auto; padding:20px;">
                <h2 style="color:#0B4F6C; margin-bottom:20px;">RABAS Travel & Tours Services</h2>
                <p>Dear Customer,</p>
                <p>A sign-in attempt to your account requires additional verification.</p>
                <div style="background:#f4f4f4; border:1px solid #dddddd; border-radius:8px; padding:20px; text-align:center; margin:25px 0;">
                    <h1 style="margin:0; letter-spacing:8px; color:#0B4F6C; font-size:32px;">${otp}</h1>
                </div>
                <p><strong>Note:</strong> This verification code is valid for <strong>10 minutes</strong>.</p>
                <p>If you did not attempt to sign in to your account, we recommend changing your password immediately.</p>
                <hr style="margin-top:30px;">
                <p style="font-size:12px; color:#777;">This is an automated email. Please do not reply to this message.</p>
            </div>
            `
        });
        return true;
    } catch (error) {
        console.error(`[mailer] Failed to send Two-Factor Authentication email to ${email}:`, error.message);
        return false;
    }
}

module.exports = {
    sendPasswordResetOtp,
    sendTwoFactorOtp,
};
