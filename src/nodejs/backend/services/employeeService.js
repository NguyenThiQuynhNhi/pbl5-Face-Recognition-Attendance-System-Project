// File: src/backend/services/employeeService.js
import fs from 'fs/promises';
import path from 'path';

const getEmployees = async (db, department_id) => {
    const query = department_id
        ? "SELECT * FROM employees WHERE department_id = ?"
        : "SELECT * FROM employees";
    const [rows] = await db.query(query, [department_id]);
    return rows;
};

const getEmployeeById = async (db, employee_id) => {
    const query = `
        SELECT e.*, d.department_name 
        FROM employees e 
        JOIN departments d ON e.department_id = d.department_id 
        WHERE e.employee_id = ?
    `;
    const [rows] = await db.query(query, [employee_id]);
    return rows[0];
};

const addEmployee = async (db, employee) => {
    const query = "INSERT INTO employees (employee_id, employee_name, employee_username, employee_password, department_id, email, phone, face_image_dir, base_salary, date_of_birth, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    await db.query(query, [
        employee.employee_id,
        employee.employee_name,
        employee.employee_username,
        employee.employee_password,
        employee.department_id,
        employee.email,
        employee.phone,
        employee.face_image_dir,
        employee.base_salary,
        employee.date_of_birth,
        employee.address
    ]);
};

const updateEmployee = async (db, employee_id, employee) => {
    // Xóa ảnh cũ nếu có ảnh mới
    if (employee.face_image_dir) {
        const [existing] = await db.query("SELECT face_image_dir FROM employees WHERE employee_id = ?", [employee_id]);
        if (existing[0]?.face_image_dir) {
            try {
                await fs.unlink(path.join('public/uploads', path.basename(existing[0].face_image_dir)));
            } catch (err) {
                console.error(`Error deleting old avatar ${existing[0].face_image_dir}:`, err);
            }
        }
    }
    const query = "UPDATE employees SET employee_name = ?, employee_username = ?, employee_password = ?, department_id = ?, email = ?, phone = ?, face_image_dir = ?, base_salary = ?, date_of_birth = ?, address = ? WHERE employee_id = ?";
    await db.query(query, [
        employee.employee_name,
        employee.employee_username,
        employee.employee_password,
        employee.department_id,
        employee.email,
        employee.phone,
        employee.face_image_dir,
        employee.base_salary,
        employee.date_of_birth,
        employee.address,
        employee_id
    ]);
};

const deleteEmployee = async (db, employee_id) => {
    const [employee] = await db.query("SELECT face_image_dir FROM employees WHERE employee_id = ?", [employee_id]);
    if (employee[0]?.face_image_dir) {
        try {
            await fs.unlink(path.join('public/uploads', path.basename(employee[0].face_image_dir)));
        } catch (err) {
            console.error(`Error deleting file ${employee[0].face_image_dir}:`, err);
        }
    }
    const query = "DELETE FROM employees WHERE employee_id = ?";
    await db.query(query, [employee_id]);
};

const updateProfile = async (db, employee_id, profile) => {
    let face_image_dir = profile.face_image_dir;
    if (profile.face_image_dir) {
        const [employee] = await db.query("SELECT face_image_dir FROM employees WHERE employee_id = ?", [employee_id]);
        if (employee[0]?.face_image_dir) {
            try {
                await fs.unlink(path.join('public/uploads', path.basename(employee[0].face_image_dir)));
            } catch (err) {
                console.error(`Error deleting old avatar ${employee[0].face_image_dir}:`, err);
            }
        }
    }
    const query = "UPDATE employees SET employee_name = ?, employee_username = ?, email = ?, phone = ?, date_of_birth = ?, address = ?, face_image_dir = ? WHERE employee_id = ?";
    await db.query(query, [
        profile.employee_name,
        profile.employee_username,
        profile.email,
        profile.phone,
        profile.date_of_birth,
        profile.address,
        face_image_dir,
        employee_id
    ]);
};

const changePassword = async (db, employee_id, old_password, new_password, confirm_password) => {
    if (new_password !== confirm_password) {
        throw new Error('Mật khẩu mới và xác nhận mật khẩu không khớp!');
    }
    const checkQuery = 'SELECT employee_password FROM employees WHERE employee_id = ?';
    const [results] = await db.query(checkQuery, [employee_id]);
    if (results[0].employee_password !== old_password) {
        throw new Error('Mật khẩu cũ không đúng!');
    }
    const updateQuery = 'UPDATE employees SET employee_password = ? WHERE employee_id = ?';
    await db.query(updateQuery, [new_password, employee_id]);
    return { message: 'Đổi mật khẩu thành công!' };
};

export default { getEmployees, getEmployeeById, addEmployee, updateEmployee, deleteEmployee, updateProfile, changePassword };