import authService from '../services/authService.js';
import crypto from 'crypto';
import { sendResetPasswordMail } from '../services/mailService.js';

const login = async (req, res, next, db) => {
    try {
        const { accountType, username, password } = req.body;

        if (!accountType || !username || !password) {
            return res.status(400).json({ message: 'Thiếu thông tin đăng nhập' });
        }

        let user;
        if (accountType === 'admin') {
            user = await authService.checkAdminLogin(db, username, password);
            return res.status(200).json({
                message: "✅ Đăng nhập thành công!",
                data: { user, secretKey: `secret_${user.admin_id}_${user.role}` }
            });
        } else if (accountType === 'employee') {
            user = await authService.checkEmployeeLogin(db, username, password);
            return res.status(200).json({
                message: "✅ Đăng nhập thành công!",
                data: { user, secretKey: `secret_${user.employee_id}_employee` }
            });
        } else {
            return res.status(400).json({ message: 'Loại tài khoản không hợp lệ' });
        }
    } catch (error) {
        if (error.message === 'Sai username hoặc mật khẩu!') {
            return res.status(401).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại!' });
    }
};

const forgetPassword = async (req, res, next, db) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Vui lòng nhập email!' });
        // Tìm admin theo email
        db.query('SELECT * FROM admins WHERE email = ?', [email], async (err, adminResults) => {
            if (err) return res.status(500).json({ message: 'Lỗi server!' });
            if (adminResults.length > 0) {
                // Nếu là admin
                const token = crypto.randomBytes(32).toString('hex');
                const expires = new Date(Date.now() + (parseInt(process.env.TOKEN_EXPIRES_MINUTES || '30') * 60000));
                db.query('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)', [email, token, expires], async (err2) => {
                    if (err2) return res.status(500).json({ message: 'Lỗi server!' });
                    const resetLink = `${process.env.FRONTEND_URL}?token=${token}&email=${encodeURIComponent(email)}&type=admin`;
                    try {
                        await sendResetPasswordMail(email, resetLink);
                        return res.json({ message: 'Đã gửi hướng dẫn đặt lại mật khẩu!' });
                    } catch (e) {
                        return res.status(500).json({ message: 'Không gửi được email!' });
                    }
                });
            } else {
                // Nếu không phải admin, kiểm tra employee
                db.query('SELECT * FROM employees WHERE employee_email = ?', [email], async (errEmp, empResults) => {
                    if (errEmp) return res.status(500).json({ message: 'Lỗi server!' });
                    if (empResults.length === 0) return res.status(404).json({ message: 'Email không tồn tại!' });
                    // Nếu là employee
                    const token = crypto.randomBytes(32).toString('hex');
                    const expires = new Date(Date.now() + (parseInt(process.env.TOKEN_EXPIRES_MINUTES || '30') * 60000));
                    db.query('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)', [email, token, expires], async (err2) => {
                        if (err2) return res.status(500).json({ message: 'Lỗi server!' });
                        const resetLink = `${process.env.FRONTEND_URL}?token=${token}&email=${encodeURIComponent(email)}&type=employee`;
                        try {
                            await sendResetPasswordMail(email, resetLink);
                            return res.json({ message: 'Đã gửi hướng dẫn đặt lại mật khẩu!' });
                        } catch (e) {
                            return res.status(500).json({ message: 'Không gửi được email!' });
                        }
                    });
                });
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server!' });
    }
};

const resetPassword = async (req, res, next, db) => {
    try {
        const { email, token, newPassword } = req.body;
        if (!email || !token || !newPassword) return res.status(400).json({ message: 'Thiếu thông tin!' });
        // Kiểm tra token
        db.query('SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()', [email, token], (err, results) => {
            if (err) return res.status(500).json({ message: 'Lỗi server!' });
            if (results.length === 0) return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
            // Đặt lại mật khẩu
            db.query('UPDATE admins SET password = ? WHERE email = ?', [newPassword, email], (err2) => {
                if (err2) return res.status(500).json({ message: 'Lỗi server!' });
                // Xóa token
                db.query('DELETE FROM password_resets WHERE email = ?', [email]);
                return res.json({ message: 'Đặt lại mật khẩu thành công!' });
            });
        });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi server!' });
    }
};

export default { login, forgetPassword, resetPassword };