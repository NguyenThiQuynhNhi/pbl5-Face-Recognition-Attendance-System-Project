const getAttendance = async (db, filters) => {
    let query = `
        SELECT a.*, e.employee_name, d.department_name 
        FROM attendance a
        JOIN employees e ON a.employee_id = e.employee_id
        JOIN departments d ON e.department_id = d.department_id
        WHERE 1=1
    `;
    const params = [];
    if (filters.start_date) {
        query += " AND a.attendance_date >= ?";
        params.push(filters.start_date);
    }
    if (filters.end_date) {
        query += " AND a.attendance_date <= ?";
        params.push(filters.end_date);
    }
    if (filters.employee_id) {
        query += " AND a.employee_id = ?";
        params.push(filters.employee_id);
    }
    if (filters.status) {
        query += " AND a.status = ?";
        params.push(filters.status);
    }
    if (filters.department_id) {
        query += " AND e.department_id = ?";
        params.push(filters.department_id);
    }
    const [rows] = await db.query(query, params);
    return rows;
};

const getAttendanceById = async (db, attendance_id) => {
    const query = `
        SELECT a.*, e.employee_name, d.department_name 
        FROM attendance a
        JOIN employees e ON a.employee_id = e.employee_id
        JOIN departments d ON e.department_id = d.department_id
        WHERE a.attendance_id = ?
    `;
    const [rows] = await db.query(query, [attendance_id]);
    return rows[0];
};

const addAttendance = async (db, attendance) => {
    const timeIn = attendance.time_in
        ? new Date(`1970-01-01T${attendance.time_in}`)
        : null;
    const threshold = new Date("1970-01-01T08:10:00");
    const lateHours =
        timeIn && timeIn > threshold
            ? Math.ceil((timeIn - new Date("1970-01-01T08:00:00")) / 1000 / 60 / 60)
            : 0;
    const status = timeIn && attendance.time_out ? "Enough" : "Lack";

    const query =
        "INSERT INTO attendance (employee_id, attendance_date, time_in, time_out, status, late_hours, photo_proof_in, photo_proof_out) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    await db.query(query, [
        attendance.employee_id,
        attendance.attendance_date,
        attendance.time_in,
        attendance.time_out,
        status,
        lateHours,
        attendance.photo_proof_in,
        attendance.photo_proof_out
    ]);
};

const updateAttendance = async (db, attendance_id, attendance) => {
    const timeIn = attendance.time_in
        ? new Date(`1970-01-01T${attendance.time_in}`)
        : null;
    const threshold = new Date("1970-01-01T08:10:00");
    const lateHours =
        timeIn && timeIn > threshold
            ? Math.ceil((timeIn - new Date("1970-01-01T08:00:00")) / 1000 / 60 / 60)
            : 0;
    const status = timeIn && attendance.time_out ? "Enough" : "Lack";

    const query =
        "UPDATE attendance SET employee_id = ?, attendance_date = ?, time_in = ?, time_out = ?, status = ?, late_hours = ?, photo_proof_in = ?, photo_proof_out = ? WHERE attendance_id = ?";
    await db.query(query, [
        attendance.employee_id,
        attendance.attendance_date,
        attendance.time_in,
        attendance.time_out,
        status,
        lateHours,
        attendance.photo_proof_in,
        attendance.photo_proof_out,
        attendance_id
    ]);
};

const deleteAttendance = async (db, attendance_id) => {
    const query = "DELETE FROM attendance WHERE attendance_id = ?";
    await db.query(query, [attendance_id]);
};

const getAttendanceByEmployee = async (db, employee_id, filters) => {
    let query = "SELECT * FROM attendance WHERE employee_id = ?";
    const params = [employee_id];
    
    if (filters.month) {
        const [year, month] = filters.month.split("-");
        query += " AND YEAR(attendance_date) = ? AND MONTH(attendance_date) = ?";
        params.push(year, month);
    }
    
    if (filters.status) {
        query += " AND status = ?";
        params.push(filters.status);
    }
    
    const [rows] = await db.query(query, params);
    return rows;
};

const createReport = async (db, employee_id, report) => {
    const query =
        "INSERT INTO attendance_reports (employee_id, attendance_date, issue_type, description) VALUES (?, ?, ?, ?)";
    await db.query(query, [
        employee_id,
        report.attendance_date,
        report.issue_type,
        report.description
    ]);
};

const getReports = async (db, filters) => {
    let query = `
        SELECT ar.*, e.employee_name, d.department_name
        FROM attendance_reports ar
        JOIN employees e ON ar.employee_id = e.employee_id
        JOIN departments d ON e.department_id = d.department_id
        WHERE 1=1
    `;
    const params = [];
    if (filters.employee_id) {
        query += " AND ar.employee_id = ?";
        params.push(filters.employee_id);
    }
    if (filters.status) {
        query += " AND ar.status = ?";
        params.push(filters.status);
    }
    if (filters.attendance_date) {
        query += " AND DATE(ar.attendance_date) = ?";
        params.push(filters.attendance_date);
    }
    if (filters.department_id) {
        query += " AND e.department_id = ?";
        params.push(filters.department_id);
    }
    const [rows] = await db.query(query, params);
    return rows;
};

const getAttendanceReportsByEmployee = async (db, employeeId, query) => {
    const { year, month } = query;
    const yearNum = year ? parseInt(year) : null;
    const monthNum = month ? parseInt(month) : null;
    const sql = `
        SELECT report_id, employee_id, attendance_date, issue_type, description, status, created_at
        FROM attendance_reports
        WHERE employee_id = ?
        AND (? IS NULL OR YEAR(created_at) = ?)
        AND (? IS NULL OR MONTH(created_at) = ?)
        ORDER BY created_at DESC
    `;
    const params = [employeeId, yearNum, yearNum, monthNum, monthNum];
    const [reports] = await db.query(sql, params);
    return reports;
};

const updateAttendanceReportStatus = async (db, report_id, status) => {
    const query = "UPDATE attendance_reports SET status = ? WHERE report_id = ?";
    await db.query(query, [status, report_id]);
};

const calculateMonthlySalary = async (db, year, month, filters = {}) => {
    let employeeQuery = `
        SELECT e.employee_id, e.employee_name, e.base_salary, d.department_name
        FROM employees e
        JOIN departments d ON e.department_id = d.department_id
        WHERE 1=1
    `;
    const params = [];
    if (filters.employee_id) {
        employeeQuery += " AND e.employee_id = ?";
        params.push(filters.employee_id);
    }
    if (filters.department_id) {
        employeeQuery += " AND e.department_id = ?";
        params.push(filters.department_id);
    }
    const [employees] = await db.query(employeeQuery, params);

    // Tính ngày làm việc tiêu chuẩn (trừ Chủ Nhật)
    const lastDay = new Date(year, month, 0).getDate();
    let standardWorkDays = 0;
    for (let day = 1; day <= lastDay; day++) {
        const date = new Date(year, month - 1, day);
        if (date.getDay() !== 0) {
            standardWorkDays++;
        }
    }

    const salaryReport = await Promise.all(
        employees.map(async (employee) => {
            // Lấy bản ghi chấm công
            const [attendanceRecords] = await db.query(
                `SELECT late_hours FROM attendance 
                WHERE employee_id = ? 
                AND YEAR(attendance_date) = ? 
                AND MONTH(attendance_date) = ?`,
                [employee.employee_id, year, month]
            );

            // Lấy bản ghi nghỉ không phép
            const [absenceRecords] = await db.query(
                `SELECT absence_date FROM absence_reports 
                WHERE employee_id = ? 
                AND YEAR(absence_date) = ? 
                AND MONTH(absence_date) = ?`,
                [employee.employee_id, year, month]
            );

            // Tính tổng giờ trễ
            const totalLateHours = attendanceRecords.reduce(
                (sum, record) => sum + (record.late_hours || 0),
                0
            );

            // Tính số ngày nghỉ không phép
            const totalAbsenceDays = absenceRecords.length;

            // Tính phạt
            const latePenalty = totalLateHours * 50000; // 50,000 VNĐ/giờ
            const absencePenalty = totalAbsenceDays * 500000; // 500,000 VNĐ/ngày

            // Tính thưởng chuyên cần
            const attendanceBonus = totalAbsenceDays === 0 ? 500000 : 0; // 500,000 VNĐ nếu không nghỉ không phép

            // Tính lương tháng
            const monthlySalary = 
                employee.base_salary - latePenalty - absencePenalty + attendanceBonus;

            return {
                employee_id: employee.employee_id,
                employee_name: employee.employee_name,
                department_name: employee.department_name,
                base_salary: employee.base_salary,
                standard_work_days: standardWorkDays,
                total_late_hours: totalLateHours,
                total_absence_days: totalAbsenceDays,
                late_penalty: latePenalty,
                absence_penalty: absencePenalty,
                attendance_bonus: attendanceBonus,
                monthly_salary: monthlySalary >= 0 ? monthlySalary : 0,
                year,
                month,
            };
        })
    );

    return salaryReport;
};

const calculateEmployeeMonthlySalary = async (db, employee_id, year, month) => {
    const [employee] = await db.query(
        `SELECT e.employee_id, e.employee_name, e.base_salary 
        FROM employees e 
        WHERE e.employee_id = ?`,
        [employee_id]
    );

    if (!employee.length) {
        return null;
    }

    // Tính ngày làm việc tiêu chuẩn
    const lastDay = new Date(year, month, 0).getDate();
    let standardWorkDays = 0;
    for (let day = 1; day <= lastDay; day++) {
        const date = new Date(year, month - 1, day);
        if (date.getDay() !== 0) {
            standardWorkDays++;
        }
    }

    // Lấy bản ghi chấm công
    const [attendanceRecords] = await db.query(
        `SELECT late_hours FROM attendance 
        WHERE employee_id = ? 
        AND YEAR(attendance_date) = ? 
        AND MONTH(attendance_date) = ?`,
        [employee_id, year, month]
    );

    // Lấy bản ghi nghỉ không phép
    const [absenceRecords] = await db.query(
        `SELECT absence_date FROM absence_reports 
        WHERE employee_id = ? 
        AND YEAR(absence_date) = ? 
        AND MONTH(absence_date) = ?`,
        [employee_id, year, month]
    );

    // Tính tổng giờ trễ
    const totalLateHours = attendanceRecords.reduce(
        (sum, record) => sum + (record.late_hours || 0),
        0
    );

    // Tính số ngày nghỉ không phép
    const totalAbsenceDays = absenceRecords.length;

    // Tính phạt
    const latePenalty = totalLateHours * 50000; // 50,000 VNĐ/giờ
    const absencePenalty = totalAbsenceDays * 500000; // 500,000 VNĐ/ngày

    // Tính thưởng chuyên cần
    const attendanceBonus = totalAbsenceDays === 0 ? 500000 : 0; // 500,000 VNĐ nếu không nghỉ không phép

    // Tính lương tháng
    const monthlySalary = 
        employee[0].base_salary - latePenalty - absencePenalty + attendanceBonus;

    return {
        employee_id: employee[0].employee_id,
        employee_name: employee[0].employee_name,
        base_salary: employee[0].base_salary,
        standard_work_days: standardWorkDays,
        total_late_hours: totalLateHours,
        total_absence_days: totalAbsenceDays,
        late_penalty: latePenalty,
        absence_penalty: absencePenalty,
        attendance_bonus: attendanceBonus,
        monthly_salary: monthlySalary >= 0 ? monthlySalary : 0,
        year,
        month,
    };
};

export default {
    getAttendance,
    getAttendanceById,
    addAttendance,
    updateAttendance,
    deleteAttendance,
    getAttendanceByEmployee,
    createReport,
    getReports,
    getAttendanceReportsByEmployee,
    updateAttendanceReportStatus,
    calculateMonthlySalary,
    calculateEmployeeMonthlySalary,
};