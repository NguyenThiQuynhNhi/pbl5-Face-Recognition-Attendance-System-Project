import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendResetPasswordMail = async (to, resetLink) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: 'Đặt lại mật khẩu hệ thống chấm công',
        html: `<p>Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu.</p>
               <p>Nhấn vào link sau để đặt lại mật khẩu: <a href="${resetLink}">${resetLink}</a></p>
               <p>Nếu không phải bạn, hãy bỏ qua email này.</p>`
    };
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('Lỗi gửi mail:', err);
        throw err;
    }
};

export default { sendResetPasswordMail }; 