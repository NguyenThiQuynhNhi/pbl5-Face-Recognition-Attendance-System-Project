const getEmployees = (db) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM employees';
        db.query(query, (err, results) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve(results);
        });
    });
};

const addEmployee = (db, body) => {
    const { employee_id, employee_name, department_id, email, phone, face_image_dir } = body;
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO employees (employee_id, employee_name, department_id, email, phone, face_image_dir) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [employee_id, employee_name, department_id, email, phone, face_image_dir], (err) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve({ message: 'Thêm nhân viên thành công!' });
        });
    });
};

const updateEmployee = (db, employee_id, body) => {
    const { employee_name, department_id, email, phone, face_image_dir } = body;
    return new Promise((resolve, reject) => {
        const query = 'UPDATE employees SET employee_name = ?, department_id = ?, email = ?, phone = ?, face_image_dir = ? WHERE employee_id = ?';
        db.query(query, [employee_name, department_id, email, phone, face_image_dir, employee_id], (err) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve({ message: 'Cập nhật nhân viên thành công!' });
        });
    });
};

const deleteEmployee = (db, employee_id) => {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM employees WHERE employee_id = ?';
        db.query(query, [employee_id], (err) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve({ message: 'Xóa nhân viên thành công!' });
        });
    });
};

export default {
    getEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
};