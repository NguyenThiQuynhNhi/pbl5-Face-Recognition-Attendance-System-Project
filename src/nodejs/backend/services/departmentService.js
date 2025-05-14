const getDepartments = async (db, department_id) => {
    const query = department_id
        ? "SELECT * FROM departments WHERE department_id = ?"
        : "SELECT * FROM departments";

    const [rows] = await db.query(query, department_id ? [department_id] : []);
    return rows;
};

const getDepartmentById = async (db, department_id) => {
    const query = "SELECT * FROM departments WHERE department_id = ?";
    const [rows] = await db.query(query, [department_id]);
    return rows[0];
}

const addDepartment = (db, department) => {
    const query = "INSERT INTO departments (department_id, department_name, dept_description) VALUES (?, ?, ?)";
    db.query(query, [department.department_id, department.department_name, department.dept_description]);
};

const updateDepartment = (db, department_id, department) => {
    const query = "UPDATE departments SET department_name = ?, dept_description = ? WHERE department_id = ?";
    db.query(query, [department.department_name, department.dept_description, department_id]);
};

const deleteDepartment = (db, department_id) => {
    const query = "DELETE FROM departments WHERE department_id = ?";
    db.query(query, [department_id]);
};

export default { getDepartments, getDepartmentById , addDepartment, updateDepartment, deleteDepartment };