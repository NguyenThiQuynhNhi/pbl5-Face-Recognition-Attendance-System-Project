const getAttendance = (db) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT a.*, e.employee_name 
            FROM attendance a
            JOIN employees e ON a.employee_id = e.employee_id
            ORDER BY a.date_n_time DESC
        `;
        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            resolve(results);
        });
    });
};

const getAttendanceById = (db, attendance_id) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT a.*, e.employee_name 
            FROM attendance a
            JOIN employees e ON a.employee_id = e.employee_id
            WHERE a.attendance_id = ?
        `;
        db.query(query, [attendance_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            resolve(results[0]);
        });
    });
};

const addAttendance = (db, body) => {
    const { employee_id, date_n_time, in_out, status, photo_proof } = body;
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

            // Kiểm tra trùng lặp chấm công
            const duplicateQuery = 'SELECT attendance_id FROM attendance WHERE employee_id = ? AND date_n_time = ? AND in_out = ?';
            db.query(duplicateQuery, [employee_id, date_n_time, in_out], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                }
                if (results.length > 0) {
                    return reject(new Error('Đã tồn tại bản ghi chấm công cho nhân viên này!'));
                }

                // Thêm bản ghi chấm công mới
                const insertQuery = 'INSERT INTO attendance (employee_id, date_n_time, in_out, status, photo_proof) VALUES (?, ?, ?, ?, ?)';
                db.query(insertQuery, [employee_id, date_n_time, in_out, status, photo_proof], (err) => {
                    if (err) {
                        console.error('Database error:', err);
                        return reject(new Error('Lỗi khi thêm bản ghi chấm công!'));
                    }
                    resolve({ message: 'Thêm chấm công thành công!' });
                });
            });
        });
    });
};

const updateAttendance = (db, attendance_id, body) => {
    const { employee_id, date_n_time, in_out, status, photo_proof } = body;
    return new Promise((resolve, reject) => {
        // Kiểm tra bản ghi chấm công tồn tại
        const checkQuery = 'SELECT attendance_id FROM attendance WHERE attendance_id = ?';
        db.query(checkQuery, [attendance_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length === 0) {
                return reject(new Error('Không tìm thấy bản ghi chấm công!'));
            }

            // Kiểm tra nhân viên tồn tại
            const employeeQuery = 'SELECT employee_id FROM employees WHERE employee_id = ?';
            db.query(employeeQuery, [employee_id], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                }
                if (results.length === 0) {
                    return reject(new Error('Không tìm thấy nhân viên!'));
                }

                // Kiểm tra trùng lặp chấm công (ngoại trừ bản ghi hiện tại)
                const duplicateQuery = 'SELECT attendance_id FROM attendance WHERE employee_id = ? AND date_n_time = ? AND in_out = ? AND attendance_id != ?';
                db.query(duplicateQuery, [employee_id, date_n_time, in_out, attendance_id], (err, results) => {
                    if (err) {
                        console.error('Database error:', err);
                        return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                    }
                    if (results.length > 0) {
                        return reject(new Error('Đã tồn tại bản ghi chấm công cho nhân viên này!'));
                    }

                    // Cập nhật bản ghi chấm công
                    const updateQuery = 'UPDATE attendance SET employee_id = ?, date_n_time = ?, in_out = ?, status = ?, photo_proof = ? WHERE attendance_id = ?';
                    db.query(updateQuery, [employee_id, date_n_time, in_out, status, photo_proof, attendance_id], (err) => {
                        if (err) {
                            console.error('Database error:', err);
                            return reject(new Error('Lỗi khi cập nhật bản ghi chấm công!'));
                        }
                        resolve({ message: 'Cập nhật chấm công thành công!' });
                    });
                });
            });
        });
    });
};

const deleteAttendance = (db, attendance_id) => {
    return new Promise((resolve, reject) => {
        // Kiểm tra bản ghi chấm công tồn tại
        const checkQuery = 'SELECT attendance_id FROM attendance WHERE attendance_id = ?';
        db.query(checkQuery, [attendance_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length === 0) {
                return reject(new Error('Không tìm thấy bản ghi chấm công!'));
            }

            // Xóa bản ghi chấm công
            const deleteQuery = 'DELETE FROM attendance WHERE attendance_id = ?';
            db.query(deleteQuery, [attendance_id], (err) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi khi xóa bản ghi chấm công!'));
                }
                resolve({ message: 'Xóa chấm công thành công!' });
            });
        });
    });
};

export default {
    getAttendance,
    getAttendanceById,
    addAttendance,
    updateAttendance,
    deleteAttendance,
};