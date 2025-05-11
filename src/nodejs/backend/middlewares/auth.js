const authenticate = (req, res, next) => {
    const secretKey = req.headers['secret-key'];
    if (!secretKey) {
        return res.status(401).json({ message: "⛔ Chưa đăng nhập!" });
    }

    const match = secretKey.match(/^secret_([^_]+)_(.+)$/);
    if (!match) {
        return res.status(401).json({ message: "⛔ Secret key không hợp lệ!" });
    }

    const id = match[1]; // admin_id hoặc employee_id
    const type = match[2]; // role (cho admin) hoặc 'employee' (cho employee)

    if (type === 'employee') {
        req.user = { employee_id: id, type: 'employee' };
    } else {
        req.user = { admin_id: id, role: type, type: 'admin' };
    }

    next();
};

const restrictToSuperAdmin = (req, res, next) => {
    if (req.user.type !== 'admin' || req.user.role !== 'SuperAdmin') {
        return res.status(403).json({ message: "⛔ Chỉ SuperAdmin mới có quyền thực hiện!" });
    }
    next();
};

export { authenticate, restrictToSuperAdmin };