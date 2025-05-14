export const checkAdminLogin = async (db, username, password) => {
  try {
    const [results] = await db.execute(
      'SELECT * FROM admins WHERE username = ? AND password = ?',
      [username, password]
    );
    if (results.length > 0) {
      return results[0];
    } else {
      throw new Error('Sai username hoặc mật khẩu!');
    }
  } catch (err) {
    console.error('Lỗi truy vấn Admin:', err);
    throw new Error('Lỗi server!');
  }
};

export const checkEmployeeLogin = async (db, username, password) => {
  try {
    const [results] = await db.execute(
      'SELECT * FROM employees WHERE employee_username = ? AND employee_password = ?',
      [username, password]
    );
    if (results.length > 0) {
      return results[0];
    } else {
      throw new Error('Sai username hoặc mật khẩu!');
    }
  } catch (err) {
    console.error('Lỗi truy vấn Employee:', err);
    throw new Error('Lỗi server!');
  }
};

export default { checkAdminLogin, checkEmployeeLogin };