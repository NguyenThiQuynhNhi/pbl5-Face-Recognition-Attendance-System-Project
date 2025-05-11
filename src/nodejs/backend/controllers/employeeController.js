import employeeService from '../services/employeeService.js';

const getEmployees = async (req, res, next, db) => {
    try {
        const employees = await employeeService.getEmployees(db);
        return res.status(200).json({ data: employees });
    } catch (error) {
        next(error);
    }
};

const getEmployeeById = async (req, res, next, db) => {
    try {
        const employee_id = req.params.employee_id;
        const employee = await employeeService.getEmployeeById(db, employee_id);
        if (!employee) {
            return res.status(404).json({ message: "Không tìm thấy nhân viên!" });
        }
        return res.status(200).json({ data: employee });
    } catch (error) {
        next(error);
    }
};

const addEmployee = async (req, res, next, db) => {
    try {
        let imageFile = null;
        if (req.files && req.files.image) {
            imageFile = req.files.image;
        }
        const result = await employeeService.addEmployee(db, req.body, imageFile);
        return res.status(201).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const updateEmployee = async (req, res, next, db) => {
    try {
        const employee_id = req.params.employee_id;
        let imageFile = null;
        if (req.files && req.files.image) {
            imageFile = req.files.image;
        }
        const result = await employeeService.updateEmployee(db, employee_id, req.body, imageFile);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const deleteEmployee = async (req, res, next, db) => {
    try {
        const employee_id = req.params.employee_id;
        const result = await employeeService.deleteEmployee(db, employee_id);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next, db) => {
    try {
        const employee_id = req.params.employee_id;
        const { old_password, new_password } = req.body;
        // Lấy thông tin nhân viên
        const employee = await employeeService.getEmployeeById(db, employee_id);
        if (!employee) {
            return res.status(404).json({ message: "Không tìm thấy nhân viên!" });
        }
        if (employee.employee_password !== old_password) {
            return res.status(400).json({ message: "Mật khẩu cũ không đúng!" });
        }
        await employeeService.changePassword(db, employee_id, new_password);
        return res.json({ message: "Đổi mật khẩu thành công!" });
    } catch (error) {
        next(error);
    }
};

export default {
    getEmployees,
    getEmployeeById,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    changePassword,
};