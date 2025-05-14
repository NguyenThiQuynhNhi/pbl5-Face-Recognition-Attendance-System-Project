import { body, param, validationResult } from "express-validator";

// Middleware để xử lý lỗi validate
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// Validate dữ liệu đăng nhập
const validateLogin = [
    body("username").notEmpty().withMessage("Tên đăng nhập không được để trống!"),
    body("password").notEmpty().withMessage("Mật khẩu không được để trống!"),
    handleValidationErrors,
];

// Validate dữ liệu phòng ban
const validateDepartment = [
    body("department_id")
        .notEmpty()
        .withMessage("Mã phòng ban không được để trống!")
        .isLength({ max: 10 })
        .withMessage("Mã phòng ban không được dài quá 10 ký tự!"),
    body("department_name")
        .notEmpty()
        .withMessage("Tên phòng ban không được để trống!")
        .isLength({ max: 100 })
        .withMessage("Tên phòng ban không được dài quá 100 ký tự!"),
    body("dept_description")
        .optional()
        .isString()
        .withMessage("Mô tả phòng ban phải là chuỗi!"),
    handleValidationErrors,
];

// Validate dữ liệu nhân viên
const validateEmployee = [
    body("employee_id")
        .notEmpty()
        .withMessage("Mã nhân viên không được để trống!")
        .isLength({ max: 20 })
        .withMessage("Mã nhân viên không được dài quá 20 ký tự!"),
    body("employee_name")
        .notEmpty()
        .withMessage("Tên nhân viên không được để trống!")
        .isLength({ max: 100 })
        .withMessage("Tên nhân viên không được dài quá 100 ký tự!"),
    body("employee_username")
        .notEmpty()
        .withMessage("Tên đăng nhập không được để trống!")
        .isLength({ max: 100 })
        .withMessage("Tên đăng nhập không được dài quá 100 ký tự!"),
    body("employee_password")
        .notEmpty()
        .withMessage("Mật khẩu không được để trống!")
        .isLength({ max: 100 })
        .withMessage("Mật khẩu không được dài quá 100 ký tự!"),
    body("department_id")
        .notEmpty()
        .withMessage("Mã phòng ban không được để trống!")
        .isLength({ max: 10 })
        .withMessage("Mã phòng ban không được dài quá 10 ký tự!"),
    body("email")
        .optional()
        .isEmail()
        .withMessage("Email không hợp lệ!")
        .isLength({ max: 100 })
        .withMessage("Email không được dài quá 100 ký tự!"),
    body("phone")
        .optional()
        .isLength({ max: 15 })
        .withMessage("Số điện thoại không được dài quá 15 ký tự!"),
    body("face_image_dir")
        .optional()
        .isLength({ max: 255 })
        .withMessage("Đường dẫn hình ảnh không được dài quá 255 ký tự!"),
    body("base_salary")
        .isNumeric()
        .withMessage("Lương cơ bản phải là số!")
        .custom((value) => value >= 0)
        .withMessage("Lương cơ bản không được âm!"),
    handleValidationErrors,
];

// Validate dữ liệu tài khoản admin
const validateAdmin = [
    body("username")
        .notEmpty()
        .withMessage("Tên đăng nhập không được để trống!")
        .isLength({ max: 50 })
        .withMessage("Tên đăng nhập không được dài quá 50 ký tự!"),
    body("password")
        .notEmpty()
        .withMessage("Mật khẩu không được để trống!")
        .isLength({ max: 255 })
        .withMessage("Mật khẩu không được dài quá 255 ký tự!"),
    body("full_name")
        .notEmpty()
        .withMessage("Họ tên không được để trống!")
        .isLength({ max: 100 })
        .withMessage("Họ tên không được dài quá 100 ký tự!"),
    body("role")
        .isIn(["SuperAdmin", "HR"])
        .withMessage("Vai trò phải là SuperAdmin hoặc HR!"),
    body("email")
        .isEmail()
        .withMessage("Email không hợp lệ!")
        .isLength({ max: 100 })
        .withMessage("Email không được dài quá 100 ký tự!"),
    handleValidationErrors,
];

// Validate dữ liệu chấm công
const validateAttendance = [
    body("employee_id")
        .notEmpty()
        .withMessage("Mã nhân viên không được để trống!")
        .isLength({ max: 20 })
        .withMessage("Mã nhân viên không được dài quá 20 ký tự!"),
    body("attendance_date")
        .notEmpty()
        .withMessage("Ngày chấm công không được để trống!")
        .isDate()
        .withMessage("Ngày chấm công phải là định dạng ngày hợp lệ!"),
    body("time_in")
        .optional()
        .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/)
        .withMessage("Giờ vào làm phải có định dạng HH:MM:SS!"),
    body("time_out")
        .optional()
        .matches(/^([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/)
        .withMessage("Giờ ra làm phải có định dạng HH:MM:SS!"),
    handleValidationErrors,
];

// Validate dữ liệu đơn xin nghỉ phép
const validateLeaveRequest = [
    body("start_date")
        .notEmpty()
        .withMessage("Ngày bắt đầu nghỉ không được để trống!")
        .isDate()
        .withMessage("Ngày bắt đầu nghỉ phải là định dạng ngày hợp lệ!"),
    body("end_date")
        .notEmpty()
        .withMessage("Ngày kết thúc nghỉ không được để trống!")
        .isDate()
        .withMessage("Ngày kết thúc nghỉ phải là định dạng ngày hợp lệ!")
        .custom((value, { req }) => new Date(value) >= new Date(req.body.start_date))
        .withMessage("Ngày kết thúc nghỉ phải lớn hơn hoặc bằng ngày bắt đầu nghỉ!"),
    body("reason")
        .notEmpty()
        .withMessage("Lý do nghỉ không được để trống!")
        .isString()
        .withMessage("Lý do nghỉ phải là chuỗi!"),
    handleValidationErrors,
];

export {
    validateLogin,
    validateDepartment,
    validateEmployee,
    validateAdmin,
    validateAttendance,
    validateLeaveRequest,
};