const getDepartments = (db) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM departments';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            resolve(results);
        });
    });
};

const getDepartmentById = (db, department_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM departments WHERE department_id = ?';
        db.query(query, [department_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            resolve(results[0]);
        });
    });
};

const addDepartment = (db, body) => {
    const { department_id, department_name } = body;
    return new Promise((resolve, reject) => {
        // Kiểm tra department_id đã tồn tại chưa
        const checkQuery = 'SELECT department_id FROM departments WHERE department_id = ?';
        db.query(checkQuery, [department_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length > 0) {
                return reject(new Error('Mã phòng ban đã tồn tại!'));
            }

            // Thêm phòng ban mới
            const insertQuery = 'INSERT INTO departments (department_id, department_name) VALUES (?, ?)';
            db.query(insertQuery, [department_id, department_name], (err) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi khi thêm phòng ban!'));
                }
                resolve({ message: 'Thêm phòng ban thành công!' });
            });
        });
    });
};

const updateDepartment = (db, department_id, body) => {
    const { department_name } = body;
    return new Promise((resolve, reject) => {
        // Kiểm tra phòng ban tồn tại
        const checkQuery = 'SELECT department_id FROM departments WHERE department_id = ?';
        db.query(checkQuery, [department_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length === 0) {
                return reject(new Error('Không tìm thấy phòng ban!'));
            }

            // Cập nhật thông tin phòng ban
            const updateQuery = 'UPDATE departments SET department_name = ? WHERE department_id = ?';
            db.query(updateQuery, [department_name, department_id], (err) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi khi cập nhật phòng ban!'));
                }
                resolve({ message: 'Cập nhật phòng ban thành công!' });
            });
        });
    });
};

const deleteDepartment = (db, department_id) => {
    return new Promise((resolve, reject) => {
        // Kiểm tra phòng ban tồn tại
        const checkQuery = 'SELECT department_id FROM departments WHERE department_id = ?';
        db.query(checkQuery, [department_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length === 0) {
                return reject(new Error('Không tìm thấy phòng ban!'));
            }

            // Kiểm tra phòng ban có nhân viên không
            const employeeQuery = 'SELECT employee_id FROM employees WHERE department_id = ? LIMIT 1';
            db.query(employeeQuery, [department_id], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                }
                if (results.length > 0) {
                    return reject(new Error('Không thể xóa phòng ban đã có nhân viên!'));
                }

                // Xóa phòng ban
                const deleteQuery = 'DELETE FROM departments WHERE department_id = ?';
                db.query(deleteQuery, [department_id], (err) => {
                    if (err) {
                        console.error('Database error:', err);
                        return reject(new Error('Lỗi khi xóa phòng ban!'));
                    }
                    resolve({ message: 'Xóa phòng ban thành công!' });
                });
            });
        });
    });
};

export default {
    getDepartments,
    getDepartmentById,
    addDepartment,
    updateDepartment,
    deleteDepartment,
};