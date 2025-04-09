const getAdmins = (db) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT admin_id, username, fullname, email, role FROM admins';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            resolve(results);
        });
    });
};

const getAdminById = (db, admin_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT admin_id, username, fullname, email, role FROM admins WHERE admin_id = ?';
        db.query(query, [admin_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            resolve(results[0]);
        });
    });
};

const addAdmin = (db, body) => {
    const { username, password, fullname, email, role } = body;
    return new Promise((resolve, reject) => {
        // Kiểm tra username đã tồn tại chưa
        const checkQuery = 'SELECT admin_id FROM admins WHERE username = ?';
        db.query(checkQuery, [username], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length > 0) {
                return reject(new Error('Username đã tồn tại!'));
            }

            // Thêm admin mới
            const insertQuery = 'INSERT INTO admins (username, password, fullname, email, role) VALUES (?, ?, ?, ?, ?)';
            db.query(insertQuery, [username, password, fullname, email, role], (err) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi khi thêm admin!'));
                }
                resolve({ message: 'Thêm admin thành công!' });
            });
        });
    });
};

const updateAdmin = (db, admin_id, body) => {
    const { username, password, fullname, email, role } = body;
    return new Promise((resolve, reject) => {
        // Kiểm tra admin tồn tại
        const checkQuery = 'SELECT admin_id FROM admins WHERE admin_id = ?';
        db.query(checkQuery, [admin_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length === 0) {
                return reject(new Error('Không tìm thấy admin!'));
            }

            // Kiểm tra username mới có trùng với admin khác không
            const usernameQuery = 'SELECT admin_id FROM admins WHERE username = ? AND admin_id != ?';
            db.query(usernameQuery, [username, admin_id], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                }
                if (results.length > 0) {
                    return reject(new Error('Username đã tồn tại!'));
                }

                // Cập nhật thông tin admin
                const updateQuery = password 
                    ? 'UPDATE admins SET username = ?, password = ?, fullname = ?, email = ?, role = ? WHERE admin_id = ?'
                    : 'UPDATE admins SET username = ?, fullname = ?, email = ?, role = ? WHERE admin_id = ?';
                const params = password 
                    ? [username, password, fullname, email, role, admin_id]
                    : [username, fullname, email, role, admin_id];

                db.query(updateQuery, params, (err) => {
                    if (err) {
                        console.error('Database error:', err);
                        return reject(new Error('Lỗi khi cập nhật admin!'));
                    }
                    resolve({ message: 'Cập nhật admin thành công!' });
                });
            });
        });
    });
};

const deleteAdmin = (db, admin_id) => {
    return new Promise((resolve, reject) => {
        // Kiểm tra admin tồn tại
        const checkQuery = 'SELECT role FROM admins WHERE admin_id = ?';
        db.query(checkQuery, [admin_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length === 0) {
                return reject(new Error('Không tìm thấy admin!'));
            }
            if (results[0].role === 'SuperAdmin') {
                return reject(new Error('Không thể xóa tài khoản SuperAdmin!'));
            }

            // Xóa admin
            const deleteQuery = 'DELETE FROM admins WHERE admin_id = ?';
            db.query(deleteQuery, [admin_id], (err) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi khi xóa admin!'));
                }
                resolve({ message: 'Xóa admin thành công!' });
            });
        });
    });
};

export default {
    getAdmins,
    getAdminById,
    addAdmin,
    updateAdmin,
    deleteAdmin,
};