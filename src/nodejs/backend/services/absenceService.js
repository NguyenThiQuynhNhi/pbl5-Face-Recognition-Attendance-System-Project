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
    const [rows] = await db.query(query, params);
    return rows;
};

const getAbsenceReportsByEmployee = async (db, employee_id, filters = {}) => {
    let query = `
        SELECT ar.*, e.employee_name, d.department_name
        FROM absence_reports ar
        JOIN employees e ON ar.employee_id = e.employee_id
        JOIN departments d ON e.department_id = d.department_id
        WHERE ar.employee_id = ?
    `;
    const params = [employee_id];
    if (filters.year && filters.month) {
        query += " AND YEAR(ar.absence_date) = ? AND MONTH(ar.absence_date) = ?";
        params.push(filters.year, filters.month);
    }
    const [rows] = await db.query(query, params);
    return rows;
};

const recordAbsence = async (db, employee_id, absence_date) => {
    try {
        await db.query(
            'INSERT INTO absence_reports (employee_id, absence_date) VALUES (?, ?)',
            [employee_id, absence_date]
        );
        console.log(`Recorded absence for ${employee_id} on ${absence_date}`);
    } catch (error) {
        console.error(`Error recording absence for ${employee_id} on ${absence_date}:`, error);
        throw error; 
    }
};

export default { getAbsenceReports, getAbsenceReportsByEmployee, recordAbsence };