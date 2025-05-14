import employeeService from "../services/employeeService.js";

const getEmployees = async (req, res, next, db) => {
    const employees = await employeeService.getEmployees(db, req.query.department_id);
    res.status(200).json({ success: true, data: employees });
};

const getEmployeeById = async (req, res, next, db) => {
    const employee = await employeeService.getEmployeeById(db, req.params.employee_id);
    res.status(200).json({ success: true, data: employee });
};

const addEmployee = (req, res, next, db) => {
    employeeService.addEmployee(db, req.body);
    res.status(201).json({ success: true, message: "Thêm nhân viên thành công!" });
};

const updateEmployee = (req, res, next, db) => {
    employeeService.updateEmployee(db, req.params.employee_id, req.body);
    res.status(200).json({ success: true, message: "Cập nhật nhân viên thành công!" });
};

const deleteEmployee = (req, res, next, db) => {
    employeeService.deleteEmployee(db, req.params.employee_id);
    res.status(200).json({ success: true, message: "Xóa nhân viên thành công!" });
};

const getProfile = async (req, res, next, db) => {
    const employee = await employeeService.getEmployeeById(db, req.user.employee_id);
    res.status(200).json({ success: true, data: employee });
};

const updateProfile = (req, res, next, db) => {
    employeeService.updateProfile(db, req.user.id, req.body);
    res.status(200).json({ success: true, message: "Cập nhật thông tin cá nhân thành công!" });
};

export default { getEmployees, getEmployeeById, addEmployee, updateEmployee, deleteEmployee, getProfile, updateProfile };