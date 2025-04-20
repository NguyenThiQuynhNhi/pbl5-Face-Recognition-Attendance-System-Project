const getAdmins = (db) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM admins';
        db.query(query, (err, results) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve(results);
        });
    });
};

const addAdmin = (db, body) => {
    const { username, password, full_name, role, email } = body;
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO admins (username, password, full_name, role, email) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [username, password, full_name, role, email], (err) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve({ message: 'Thêm admin thành công!' });
        });
    });
};

const updateAdmin = (db, admin_id, body) => {
    const { username, password, full_name, role, email } = body;
    return new Promise((resolve, reject) => {
        // Nếu có mật khẩu mới thì cập nhật cả mật khẩu
        if (password) {
            const query = 'UPDATE admins SET username = ?, password = ?, full_name = ?, role = ?, email = ? WHERE admin_id = ?';
            db.query(query, [username, password, full_name, role, email, admin_id], (err) => {
                if (err) return reject(new Error('Lỗi server!'));
                resolve({ message: 'Cập nhật admin thành công!' });
            });
        } else {
            // Nếu không có mật khẩu mới thì chỉ cập nhật các thông tin khác
            const query = 'UPDATE admins SET username = ?, full_name = ?, role = ?, email = ? WHERE admin_id = ?';
            db.query(query, [username, full_name, role, email, admin_id], (err) => {
                if (err) return reject(new Error('Lỗi server!'));
                resolve({ message: 'Cập nhật admin thành công!' });
            });
        }
    });
};

const deleteAdmin = (db, admin_id) => {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM admins WHERE admin_id = ?';
        db.query(query, [admin_id], (err) => {
            if (err) return reject(new Error('Lỗi server!'));
            resolve({ message: 'Xóa admin thành công!' });
        });
    });
};

export default {
    getAdmins,
    addAdmin,
    updateAdmin,
    deleteAdmin,
};