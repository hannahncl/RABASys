const nodemailer = require("nodemailer");

function getMailer() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });
}

async function sendOtpEmail(email, otp, { subject, title, body, footer }) {
    const transporter = getMailer();

    if (!transporter) {
        console.warn(`[mailer] Email delivery is not configured. OTP for ${email}: ${otp}`);
        return false;
    }

    try {
        await transporter.sendMail({
            from: process.env.GMAIL_FROM || process.env.GMAIL_USER,
            to: email,
            subject,
            text: `${body} ${otp}. ${footer}`,
            html: `<p>${title}</p><h1 style="letter-spacing: 6px">${otp}</h1><p>${body}</p><p>${footer}</p>`
        });
        return true;
    } catch (error) {
        console.error(`[mailer] Failed to send email to ${email}:`, error.message);
        return false;
    }
}

async function sendPasswordResetOtp(email, otp) {
    return sendOtpEmail(email, otp, {
        subject: "RABAS password reset code",
        title: "Your RABAS password reset code is:",
        body: "This code expires in 10 minutes.",
        footer: "Do not share this code with anyone."
    });
}

async function sendTwoFactorOtp(email, otp) {
    return sendOtpEmail(email, otp, {
        subject: "RABAS sign-in verification code",
        title: "Your RABAS sign-in verification code is:",
        body: "Enter this code to finish signing in.",
        footer: "This code expires in 10 minutes."
    });
}

module.exports = { sendPasswordResetOtp, sendTwoFactorOtp };

