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
    const { employee_id, employee_name, department_id, email, phone, face_image_dir } = req.body;
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
    const { department_id, department_name, dept_description } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!department_id || !department_name) {
        return res.status(400).json({ message: "⛔ Thiếu thông tin phòng ban!" });
    }

    // Kiểm tra định dạng department_id
    if (!/^[A-Z]{2,5}$/.test(department_id)) {
        return res.status(400).json({ 
            message: "⛔ Mã phòng ban không hợp lệ! Mã phải từ 2-5 ký tự chữ in hoa." 
        });
    }

    // Kiểm tra độ dài department_name
    if (department_name.length < 3 || department_name.length > 50) {
        return res.status(400).json({ 
            message: "⛔ Tên phòng ban phải từ 3-50 ký tự!" 
        });
    }

    // Kiểm tra độ dài dept_description nếu có
    if (dept_description && dept_description.length > 200) {
        return res.status(400).json({ 
            message: "⛔ Mô tả phòng ban không được vượt quá 200 ký tự!" 
        });
    }

    next();
};