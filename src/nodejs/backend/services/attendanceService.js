const getAttendance = (db) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM attendance';
        db.query(query, (err, results) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve(results);
        });
    });
};

const addAttendance = (db, body) => {
    const { employee_id, date_n_time, in_out, status, photo_proof } = body;
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO attendance (employee_id, date_n_time, in_out, status, photo_proof) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [employee_id, date_n_time, in_out, status, photo_proof], (err) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve({ message: 'Thêm chấm công thành công!' });
        });
    });
};

const updateAttendance = (db, attendance_id, body) => {
    const { employee_id, date_n_time, in_out, status, photo_proof } = body;
    return new Promise((resolve, reject) => {
        const query = 'UPDATE attendance SET employee_id = ?, date_n_time = ?, in_out = ?, status = ?, photo_proof = ? WHERE attendance_id = ?';
        db.query(query, [employee_id, date_n_time, in_out, status, photo_proof, attendance_id], (err) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve({ message: 'Cập nhật chấm công thành công!' });
        });
    });
};

const deleteAttendance = (db, attendance_id) => {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM attendance WHERE attendance_id = ?';
        db.query(query, [attendance_id], (err) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve({ message: 'Xóa chấm công thành công!' });
        });
    });
};

export default {
    getAttendance,
    addAttendance,
    updateAttendance,
    deleteAttendance,
};