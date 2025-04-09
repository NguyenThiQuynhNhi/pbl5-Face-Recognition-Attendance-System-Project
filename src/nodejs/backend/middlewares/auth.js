// src/middlewares/auth.js
const authenticate = (req, res, next) => {
    const secretKey = req.headers['secret-key'];
    if (!secretKey) {
        return res.status(401).json({ message: "⛔ Chưa đăng nhập!" });
    }

    const match = secretKey.match(/^secret_(\d+)_(.+)$/);
    if (!match) {
        return res.status(401).json({ message: "⛔ Secret key không hợp lệ!" });
    }

    const adminId = match[1];
    const role = match[2];
    req.admin = { admin_id: adminId, role };
    next();
};

const restrictToSuperAdmin = (req, res, next) => {
    const role = req.admin.role;
    if (role !== 'SuperAdmin') {
        return res.status(403).json({ message: "⛔ Chỉ SuperAdmin mới có quyền thực hiện!" });
    }
    next();
};

export { authenticate, restrictToSuperAdmin };