import authService from '../services/authService.js';

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

export default { login };