const getAbsenceReports = async (db, filters) => {
    let query = `
        SELECT ar.*, e.employee_name, d.department_name
        FROM absence_reports ar
        JOIN employees e ON ar.employee_id = e.employee_id
        JOIN departments d ON e.department_id = d.department_id
        WHERE 1=1
    `;
    const params = [];
    if (filters.employee_id) {
        query += " AND ar.employee_id = ?";
        params.push(filters.employee_id);
    }
    if (filters.absence_date) {
        query += " AND DATE(ar.absence_date) = ?";
        params.push(filters.absence_date);
    }
    if (filters.department_id) {
        query += " AND e.department_id = ?";
        params.push(filters.department_id);
    }
    console.log('Query:', query, 'Params:', params);
    const [rows] = await db.query(query, params);
    console.log('Absence reports rows:', rows);
    return rows;
};

const getAbsenceReportsByEmployee = async (db, employee_id) => {
    const query = `
        SELECT ar.*, e.employee_name, d.department_name
        FROM absence_reports ar
        JOIN employees e ON ar.employee_id = e.employee_id
        JOIN departments d ON e.department_id = d.department_id
        WHERE ar.employee_id = ?
    `;
    const params = [employee_id];
    const [rows] = await db.query(query, params);
    return rows;
}

export default { getAbsenceReports, getAbsenceReportsByEmployee };