export const validateLogin = (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "⛔ Thiếu username hoặc mật khẩu!" });
    }
    next();
};

export const validateAdmin = (req, res, next) => {
    // Nếu là thêm mới (POST) thì yêu cầu đầy đủ thông tin
    if (req.method === 'POST') {
        const { username, password, full_name, role, email } = req.body;
        if (!username || !password || !full_name || !role || !email) {
            return res.status(400).json({ message: "⛔ Thiếu thông tin admin!" });
        }
    } else if (req.method === 'PUT') {
        // Nếu là cập nhật thì không yêu cầu password
        const { username, full_name, role, email } = req.body;
        if (!username || !full_name || !role || !email) {
            return res.status(400).json({ message: "⛔ Thiếu thông tin admin!" });
        }
    }
    next();
};

export const validateEmployee = (req, res, next) => {
    // Nếu là thêm mới (POST) thì mới validate đầy đủ
    if (req.method === 'POST') {
        const { employee_id, employee_name, department_id, email } = req.body;
        if (!employee_id || !employee_name || !department_id || !email) {
            return res.status(400).json({ message: "⛔ Thiếu thông tin nhân viên!" });
        }
    }
    // Nếu là cập nhật (PUT) thì bỏ qua validation
    next();
};

export const validateAttendance = (req, res, next) => {
    const { employee_id, date_n_time, in_out } = req.body;
    if (!employee_id || !date_n_time || !in_out) {
        return res.status(400).json({ message: "⛔ Thiếu thông tin chấm công!" });
    }
    next();
};

export const validateDepartment = (req, res, next) => {
    const { department_id, department_name } = req.body;
    if (!department_id || !department_name) {
        return res.status(400).json({ message: "⛔ Thiếu thông tin phòng ban!" });
    }
    next();
};