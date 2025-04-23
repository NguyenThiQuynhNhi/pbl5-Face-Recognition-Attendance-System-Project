const getAttendance = (db) => {
    return new Promise((resolve, reject) => {
        // Lấy danh sách chấm công và đường dẫn ảnh chứng minh
        const query = `
            SELECT a.*, 
                   CONCAT('http://localhost:5000', a.photo_proof) as photo_url 
            FROM attendance a 
            ORDER BY date_n_time DESC`;
        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            resolve(results);
        });
    });
};

const addAttendance = (db, body) => {
    const { employee_id, date_n_time, in_out } = body;
    return new Promise((resolve, reject) => {
        // Kiểm tra nhân viên tồn tại
        const checkEmployeeQuery = 'SELECT employee_id FROM employees WHERE employee_id = ?';
        db.query(checkEmployeeQuery, [employee_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length === 0) {
                return reject(new Error('Nhân viên không tồn tại!'));
            }

            // Kiểm tra xem đã có bản ghi chấm công trong ngày chưa
            const today = new Date(date_n_time).toISOString().split('T')[0];
            const checkAttendanceQuery = `
                SELECT * FROM attendance 
                WHERE employee_id = ? 
                AND DATE(date_n_time) = ?
                ORDER BY date_n_time DESC
                LIMIT 1`;

            db.query(checkAttendanceQuery, [employee_id, today], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                }

                let status = 'Enough';
                let shouldInsert = true;

                if (results.length > 0) {
                    const lastRecord = results[0];
                    if (in_out === lastRecord.in_out) {
                        return reject(new Error(`Nhân viên đã ${in_out === 'In' ? 'check-in' : 'check-out'} rồi!`));
                    }
                }

                // Thêm bản ghi chấm công mới
                const insertQuery = 'INSERT INTO attendance (employee_id, date_n_time, in_out, status) VALUES (?, ?, ?, ?)';
                db.query(insertQuery, [employee_id, date_n_time, in_out, status], (err) => {
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
    const { employee_id, date_n_time, in_out } = body;
    return new Promise((resolve, reject) => {
        // Kiểm tra bản ghi chấm công tồn tại
        const checkAttendanceQuery = 'SELECT * FROM attendance WHERE attendance_id = ?';
        db.query(checkAttendanceQuery, [attendance_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length === 0) {
                return reject(new Error('Không tìm thấy bản ghi chấm công!'));
            }

            const currentRecord = results[0];

            // Kiểm tra nhân viên tồn tại
            const checkEmployeeQuery = 'SELECT employee_id FROM employees WHERE employee_id = ?';
            db.query(checkEmployeeQuery, [employee_id], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                }
                if (results.length === 0) {
                    return reject(new Error('Nhân viên không tồn tại!'));
                }

                // Kiểm tra logic check-in/check-out
                const today = new Date(date_n_time).toISOString().split('T')[0];
                const checkOtherRecordsQuery = `
                    SELECT * FROM attendance 
                    WHERE employee_id = ? 
                    AND DATE(date_n_time) = ?
                    AND attendance_id != ?
                    ORDER BY date_n_time`;

                db.query(checkOtherRecordsQuery, [employee_id, today, attendance_id], (err, results) => {
                    if (err) {
                        console.error('Database error:', err);
                        return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                    }

                    // Cập nhật bản ghi chấm công
                    const updateQuery = 'UPDATE attendance SET employee_id = ?, date_n_time = ?, in_out = ? WHERE attendance_id = ?';
                    db.query(updateQuery, [employee_id, date_n_time, in_out, attendance_id], (err) => {
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
        const checkQuery = 'SELECT * FROM attendance WHERE attendance_id = ?';
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
    addAttendance,
    updateAttendance,
    deleteAttendance,
};