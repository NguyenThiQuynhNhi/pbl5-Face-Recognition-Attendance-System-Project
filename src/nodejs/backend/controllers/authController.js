import authService from '../services/authService.js';

const login = async (req, res, next, db) => {
    try {
        const { username, password } = req.body;
        const admin = await authService.checkAdminLogin(db, username, password);
        return res.status(200).json({
            message: "✅ Đăng nhập thành công!",
            data: { admin, secretKey: `secret_${admin.admin_id}_${admin.role}` },
        });
    } catch (error) {
        if (error.message === 'Sai username hoặc mật khẩu!') {
            return res.status(401).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại!' });
    }
};

export default { login };