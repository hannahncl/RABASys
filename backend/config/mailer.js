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

async function sendPasswordResetOtp(email, otp) {
    const transporter = getMailer();

    if (!transporter) {
<<<<<<< HEAD
        console.warn(`[mailer] Email delivery is not configured. OTP for ${email}: ${otp}`);
        return false;
    }
    await transporter.sendMail({
        from: process.env.GMAIL_FROM || process.env.GMAIL_USER,
        to: email,
        subject: "RABAS password reset code",
        text: `Your RABAS password reset code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
        html: `<p>Your RABAS password reset code is:</p><h1 style="letter-spacing: 6px">${otp}</h1><p>This code expires in 10 minutes. Do not share it with anyone.</p>`
    });
    return true;
}

module.exports = { sendPasswordResetOtp };
=======
       console.warn(`[mailer] Email delivery is not configured. OTP for ${email}: ${otp}`);
        return false;
    }

    try {
        await transporter.sendMail({
            from: process.env.GMAIL_FROM || process.env.GMAIL_USER,
            to: email,
            subject: "RABAS password reset code",
            text: `Your RABAS password reset code is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`,
            html: `<p>Your RABAS password reset code is:</p><h1 style="letter-spacing: 6px">${otp}</h1><p>This code expires in 10 minutes. Do not share it with anyone.</p>`
        });
        return true;
    } catch (error) {
        console.error(`[mailer] Failed to send password reset email to ${email}:`, error.message);
        return false;
    }
}

module.exports = { sendPasswordResetOtp };

>>>>>>> 2012ceef8d31fb078cf7a95ceae1579b5ae9113a
