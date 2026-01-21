import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

export const sendMail = (to, subject, text, html) => {
    transporter.sendMail({
        from: '"Kanishka Fashions" <' + process.env.EMAIL + '>', // Correct format
        to: to,
        subject: subject,
        text: text,
        html: html
    });
}