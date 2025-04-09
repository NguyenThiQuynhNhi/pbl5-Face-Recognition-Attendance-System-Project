const getDepartments = (db) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM departments';
        db.query(query, (err, results) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve(results);
        });
    });
};

const addDepartment = (db, body) => {
    const { department_id, department_name, dept_description } = body;
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO departments (department_id, department_name, dept_description) VALUES (?, ?, ?)';
        db.query(query, [department_id, department_name, dept_description], (err) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve({ message: 'Thêm phòng ban thành công!' });
        });
    });
};

const updateDepartment = (db, department_id, body) => {
    const { department_name, dept_description } = body;
    return new Promise((resolve, reject) => {
        const query = 'UPDATE departments SET department_name = ?, dept_description = ? WHERE department_id = ?';
        db.query(query, [department_name, dept_description, department_id], (err) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve({ message: 'Cập nhật phòng ban thành công!' });
        });
    });
};

const deleteDepartment = (db, department_id) => {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM departments WHERE department_id = ?';
        db.query(query, [department_id], (err) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve({ message: 'Xóa phòng ban thành công!' });
        });
    });
};

export default {
    getDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
};