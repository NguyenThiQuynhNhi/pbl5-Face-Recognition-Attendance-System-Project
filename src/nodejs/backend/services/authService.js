export const checkAdminLogin = (db, username, password) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM admins WHERE username = ? AND password = ?';
        db.query(query, [username, password], (err, results) => {
            if (err) return reject(new Error('Lỗi server!'));
            if (results.length > 0) {
                resolve(results[0]);
            } else {
                reject(new Error('Sai username hoặc mật khẩu!'));
            }
        });
    });
};

export const checkEmployeeLogin = (db, username, password) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM employees WHERE employee_username = ? AND employee_password = ?';
        db.query(query, [username, password], (err, results) => {
            if (err) return reject(new Error('Lỗi server!'));
            if (results.length > 0) {
                resolve(results[0]);
            } else {
                reject(new Error('Sai username hoặc mật khẩu!'));
            }
        });
    });
};

export default { checkAdminLogin, checkEmployeeLogin };