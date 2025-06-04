// File: src/backend/controllers/employeeController.js
import employeeService from '../services/employeeService.js';
import path from 'path';

const getEmployees = async (req, res, next, db) => {
    try {
        const employees = await employeeService.getEmployees(db, req.query.department_id);
        res.status(200).json({ success: true, data: employees });
    } catch (err) {
        next(err);
    }
};

const getEmployeeById = async (req, res, next, db) => {
    try {
        const employee = await employeeService.getEmployeeById(db, req.params.employee_id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên!' });
        }
        res.status(200).json({ success: true, data: employee });
    } catch (err) {
        next(err);
    }
};

const addEmployee = async (req, res, next, db) => {
    try {
        let face_image_dir = null;
        if (req.files && req.files.face_image) {
            const file = req.files.face_image;
            if (!file.name.toLowerCase().endsWith('.jpg')) {
                return res.status(400).json({ success: false, message: 'Chỉ cho phép file .jpg!' });
            }
            const fileName = `${req.body.employee_id}.jpg`;
            const filePath = path.join('public/uploads', fileName);
            await file.mv(filePath);
            face_image_dir = `/uploads/${fileName}`;
        }

        const employee = {
            employee_id: req.body.employee_id,
            employee_name: req.body.employee_name,
            employee_username: req.body.employee_username,
            employee_password: req.body.employee_password,
            department_id: req.body.department_id,
            email: req.body.email || null,
            phone: req.body.phone || null,
            date_of_birth: req.body.date_of_birth || null,
            address: req.body.address || null,
            base_salary: parseFloat(req.body.base_salary),
            face_image_dir
        };
        await employeeService.addEmployee(db, employee);
        res.status(201).json({ success: true, message: 'Thêm nhân viên thành công!' });
    } catch (err) {
        next(err);
    }
};

const updateEmployee = async (req, res, next, db) => {
    try {
        let face_image_dir = req.body.face_image_dir || null;
        if (req.files && req.files.face_image) {
            const file = req.files.face_image;
            if (!file.name.toLowerCase().endsWith('.jpg')) {
                return res.status(400).json({ success: false, message: 'Chỉ cho phép file .jpg!' });
            }
            const fileName = `${req.params.employee_id}.jpg`;
            const filePath = path.join('public/uploads', fileName);
            await file.mv(filePath);
            face_image_dir = `/uploads/${fileName}`;
        }

        const employee = {
            employee_name: req.body.employee_name,
            employee_username: req.body.employee_username,
            employee_password: req.body.employee_password || null,
            department_id: req.body.department_id,
            email: req.body.email || null,
            phone: req.body.phone || null,
            date_of_birth: req.body.date_of_birth || null,
            address: req.body.address || null,
            base_salary: parseFloat(req.body.base_salary),
            face_image_dir
        };
        await employeeService.updateEmployee(db, req.params.employee_id, employee);
        res.status(200).json({ success: true, message: 'Cập nhật nhân viên thành công!' });
    } catch (err) {
        next(err);
    }
};

const deleteEmployee = async (req, res, next, db) => {
    try {
        await employeeService.deleteEmployee(db, req.params.employee_id);
        res.status(200).json({ success: true, message: 'Xóa nhân viên thành công!' });
    } catch (err) {
        next(err);
    }
};

const getProfile = async (req, res, next, db) => {
    try {
        const employee = await employeeService.getEmployeeById(db, req.user.employee_id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin cá nhân!' });
        }
        res.status(200).json({ success: true, data: employee });
    } catch (err) {
        next(err);
    }
};

const updateProfile = async (req, res, next, db) => {
    try {
        let face_image_dir = null;
        if (req.files && req.files.face_image) {
            const file = req.files.face_image;
            if (!file.name.toLowerCase().endsWith('.jpg')) {
                return res.status(400).json({ success: false, message: 'Chỉ cho phép file .jpg!' });
            }
            const fileName = `${req.user.employee_id}.jpg`;
            const filePath = path.join('public/uploads', fileName);
            await file.mv(filePath);
            face_image_dir = `/uploads/${fileName}`;
        }

        const profile = {
            employee_name: req.body.employee_name,
            employee_username: req.body.employee_username,
            email: req.body.email,
            phone: req.body.phone,
            date_of_birth: req.body.date_of_birth,
            address: req.body.address,
            face_image_dir
        };
        await employeeService.updateProfile(db, req.user.employee_id, profile);
        res.status(200).json({ success: true, message: 'Cập nhật thông tin cá nhân thành công!' });
    } catch (err) {
        next(err);
    }
};

const changePassword = async (req, res, next, db) => {
    try {
        const { old_password, new_password, confirm_password } = req.body;
        await employeeService.changePassword(db, req.user.employee_id, old_password, new_password, confirm_password);
        res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
        next(err);
    }
};

export default { getEmployees, getEmployeeById, addEmployee, updateEmployee, deleteEmployee, getProfile, updateProfile, changePassword };