const getEmployees = async (db, department_id) => {
    const query = department_id
        ? "SELECT * FROM employees WHERE department_id = ?"
        : "SELECT * FROM employees";
    const [rows] = await db.query(query, [department_id]);
    return rows;
};

const getEmployeeById = async (db, employee_id) => {
    const query = "SELECT * FROM employees WHERE employee_id = ?";
    const [rows] = await db.query(query, [employee_id]);
    return rows[0];
};

const addEmployee = (db, employee) => {
    const query = "INSERT INTO employees (employee_id, employee_name, employee_username, employee_password, department_id, email, phone, face_image_dir, base_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(query, [
        employee.employee_id,
        employee.employee_name,
        employee.employee_username,
        employee.employee_password,
        employee.department_id,
        employee.email,
        employee.phone,
        employee.face_image_dir,
        employee.base_salary,
    ]);
};

const updateEmployee = (db, employee_id, employee) => {
    const query = "UPDATE employees SET employee_name = ?, employee_username = ?, employee_password = ?, department_id = ?, email = ?, phone = ?, face_image_dir = ?, base_salary = ? WHERE employee_id = ?";
    db.query(query, [
        employee.employee_name,
        employee.employee_username,
        employee.employee_password,
        employee.department_id,
        employee.email,
        employee.phone,
        employee.face_image_dir,
        employee.base_salary,
        employee_id,
    ]);
};

const deleteEmployee = (db, employee_id) => {
    const query = "DELETE FROM employees WHERE employee_id = ?";
    db.query(query, [employee_id]);
};

const updateProfile = (db, employee_id, profile) => {
    const query = "UPDATE employees SET email = ?, phone = ?, employee_password = ? WHERE employee_id = ?";
    db.query(query, [profile.email, profile.phone, profile.employee_password, employee_id]);
};

export default { getEmployees, getEmployeeById, addEmployee, updateEmployee, deleteEmployee, updateProfile };