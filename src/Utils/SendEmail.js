import nodemailer from "nodemailer";

export async function sendEmail(to, subject, html) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAILSENDER,
            pass: process.env.PASSWORDSENDER,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
    
    const info = await transporter.sendMail({
        from: `jafar jallad <${process.env.EMAILSENDER}>`, // sender address
        to,
        subject,
        html,
    });
}
