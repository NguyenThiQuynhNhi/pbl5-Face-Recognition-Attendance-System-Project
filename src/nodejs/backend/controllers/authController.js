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
        next(error);
    }
};

export default { login };