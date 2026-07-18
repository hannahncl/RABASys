const nodemailer = require("nodemailer");

function getMailer() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;
    return nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
}

async function sendPasswordResetOtp(email, otp) {
    const transporter = getMailer();
    if (!transporter) {
        console.warn(`[mailer] Email delivery is not configured. OTP for ${email}: ${otp}`);
        return false;
    }
    await transporter.sendMail({ from: process.env.GMAIL_FROM || process.env.GMAIL_USER, to: email, subject: "RABAS password reset code", text: `Your RABAS password reset code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`, html: `<p>Your RABAS password reset code is:</p><h1 style="letter-spacing: 6px">${otp}</h1><p>This code expires in 10 minutes. Do not share it with anyone.</p>` });
    return true;
}

module.exports = { sendPasswordResetOtp };