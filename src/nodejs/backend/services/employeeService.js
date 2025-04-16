const getEmployees = (db) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM employees';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            resolve(results);
        });
    });
};

const getEmployeeById = (db, employee_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM employees WHERE employee_id = ?';
        db.query(query, [employee_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            resolve(results[0]);
        });
    });
};

const addEmployee = (db, body) => {
    const { employee_id, employee_name, department_id, email, phone } = body;
    return new Promise((resolve, reject) => {
        if (!employee_id || !employee_name || !department_id || !email) {
            return reject(new Error('Thiếu thông tin bắt buộc!'));
        }

        // Kiểm tra employee_id đã tồn tại chưa
        const checkQuery = 'SELECT employee_id FROM employees WHERE employee_id = ?';
        db.query(checkQuery, [employee_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length > 0) {
                return reject(new Error('Mã nhân viên đã tồn tại!'));
            }

            // Kiểm tra department_id có tồn tại
            const deptQuery = 'SELECT department_id FROM departments WHERE department_id = ?';
            db.query(deptQuery, [department_id], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                }
                if (results.length === 0) {
                    return reject(new Error('Phòng ban không tồn tại!'));
                }

                // Thêm nhân viên mới
                const insertQuery = 'INSERT INTO employees (employee_id, employee_name, department_id, email, phone) VALUES (?, ?, ?, ?, ?)';
                db.query(insertQuery, [employee_id, employee_name, department_id, email, phone || null], (err) => {
                    if (err) {
                        console.error('Database error:', err);
                        return reject(new Error('Lỗi khi thêm nhân viên!'));
                    }
                    resolve({ message: 'Thêm nhân viên thành công!' });
                });
            });
        });
    });
};

const updateEmployee = (db, employee_id, body) => {
    const { employee_name, department_id, email, phone } = body;
    return new Promise((resolve, reject) => {
        if (!employee_name || !department_id || !email) {
            return reject(new Error('Thiếu thông tin bắt buộc!'));
        }

        // Kiểm tra nhân viên tồn tại
        const checkQuery = 'SELECT employee_id FROM employees WHERE employee_id = ?';
        db.query(checkQuery, [employee_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length === 0) {
                return reject(new Error('Không tìm thấy nhân viên!'));
            }

            // Kiểm tra department_id có tồn tại
            const deptQuery = 'SELECT department_id FROM departments WHERE department_id = ?';
            db.query(deptQuery, [department_id], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                }
                if (results.length === 0) {
                    return reject(new Error('Phòng ban không tồn tại!'));
                }

                // Cập nhật thông tin nhân viên
                const updateQuery = 'UPDATE employees SET employee_name = ?, department_id = ?, email = ?, phone = ? WHERE employee_id = ?';
                db.query(updateQuery, [employee_name, department_id, email, phone || null, employee_id], (err) => {
                    if (err) {
                        console.error('Database error:', err);
                        return reject(new Error('Lỗi khi cập nhật nhân viên!'));
                    }
                    resolve({ message: 'Cập nhật nhân viên thành công!' });
                });
            });
        });
    });
};

const deleteEmployee = (db, employee_id) => {
    return new Promise((resolve, reject) => {
        // Kiểm tra nhân viên tồn tại
        const checkQuery = 'SELECT employee_id FROM employees WHERE employee_id = ?';
        db.query(checkQuery, [employee_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length === 0) {
                return reject(new Error('Không tìm thấy nhân viên!'));
            }

            // Kiểm tra nhân viên có bản ghi chấm công không
            const attendanceQuery = 'SELECT attendance_id FROM attendance WHERE employee_id = ? LIMIT 1';
            db.query(attendanceQuery, [employee_id], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                }
                if (results.length > 0) {
                    return reject(new Error('Không thể xóa nhân viên đã có bản ghi chấm công!'));
                }

                // Xóa nhân viên
                const deleteQuery = 'DELETE FROM employees WHERE employee_id = ?';
                db.query(deleteQuery, [employee_id], (err) => {
                    if (err) {
                        console.error('Database error:', err);
                        return reject(new Error('Lỗi khi xóa nhân viên!'));
                    }
                    resolve({ message: 'Xóa nhân viên thành công!' });
                });
            });
        });
    });
};

export default {
    getEmployees,
    getEmployeeById,
    addEmployee,
    updateEmployee,
    deleteEmployee,
};