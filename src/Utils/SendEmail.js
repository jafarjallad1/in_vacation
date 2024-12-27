import nodemailer from "nodemailer";

export async function sendEmail(to, subject, html) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "testinvacation@gmail.com",
            pass: "invacation11223344",
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
    
    const info = await transporter.sendMail({
        from: `IN VACATION <${process.env.EMAILSENDER}>`, // sender address
        to,
        subject,
        html,
    });
}
