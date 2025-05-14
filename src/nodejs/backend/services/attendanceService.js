const getAttendance = async (db, filters) => {
  let query = "SELECT * FROM attendance WHERE 1=1";
  const params = [];
  if (filters.attendance_date) {
    query += " AND attendance_date = ?";
    params.push(filters.attendance_date);
  }
  if (filters.employee_id) {
    query += " AND employee_id = ?";
    params.push(filters.employee_id);
  }
  if (filters.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }
  if (filters.department_id) {
    query +=
      " AND employee_id IN (SELECT employee_id FROM employees WHERE department_id = ?)";
    params.push(filters.department_id);
  }
  console.log("Query:", query, "Params:", params);
  const [rows] = await db.query(query, params);
  console.log("Attendance rows:", rows);
  return rows;
};

const getAttendanceById = async (db, attendance_id) => {
  const query = "SELECT * FROM attendance WHERE attendance_id = ?";
  const [rows] = await db.query(query, [attendance_id]);
  return rows[0];
};

const addAttendance = (db, attendance) => {
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
    "INSERT INTO attendance (employee_id, attendance_date, time_in, time_out, status, late_hours) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(query, [
    attendance.employee_id,
    attendance.attendance_date,
    attendance.time_in,
    attendance.time_out,
    status,
    lateHours,
  ]);
};

const updateAttendance = (db, attendance_id, attendance) => {
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
    "UPDATE attendance SET employee_id = ?, attendance_date = ?, time_in = ?, time_out = ?, status = ?, late_hours = ? WHERE attendance_id = ?";
  db.query(query, [
    attendance.employee_id,
    attendance.attendance_date,
    attendance.time_in,
    attendance.time_out,
    status,
    lateHours,
    attendance_id,
  ]);
};

const deleteAttendance = (db, attendance_id) => {
  const query = "DELETE FROM attendance WHERE attendance_id = ?";
  db.query(query, [attendance_id]);
};

const getAttendanceByEmployee = async (db, employee_id, filters) => {
  let query = "SELECT * FROM attendance WHERE employee_id = ?";
  const params = [employee_id];
  if (filters.attendance_date) {
    query += " AND attendance_date = ?";
    params.push(filters.attendance_date);
  }
  if (filters.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }
  const [rows] = await db.query(query, params);
  return rows;
};

const createReport = (db, employee_id, report) => {
  const query =
    "INSERT INTO attendance_reports (employee_id, attendance_date, issue_type, description) VALUES (?, ?, ?, ?)";
  db.query(query, [
    employee_id,
    report.attendance_date,
    report.issue_type,
    report.description,
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
  console.log("Query:", query, "Params:", params);
  const [rows] = await db.query(query, params);
  console.log("Attendance reports rows:", rows);
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

const updateReportStatus = (db, report_id, status) => {
  const query = "UPDATE attendance_reports SET status = ? WHERE report_id = ?";
  db.query(query, [status, report_id]);
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

  // Tính ngày công chuẩn: số ngày trong tháng trừ ngày Chủ Nhật
  const lastDay = new Date(year, month, 0).getDate();
  let standardWorkDays = 0;
  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month - 1, day);
    if (date.getDay() !== 0) {
      // Không phải Chủ Nhật
      standardWorkDays++;
    }
  }

  const salaryReport = await Promise.all(
    employees.map(async (employee) => {
      const [attendanceRecords] = await db.query(
        `SELECT * FROM attendance 
         WHERE employee_id = ? 
         AND YEAR(attendance_date) = ? 
         AND MONTH(attendance_date) = ?`,
        [employee.employee_id, year, month]
      );
      const [leaveRecords] = await db.query(
        `SELECT leave_date FROM leave_requests 
         WHERE employee_id = ? 
         AND status = 'Approved' 
         AND YEAR(leave_date) = ? 
         AND MONTH(leave_date) = ?`,
        [employee.employee_id, year, month]
      );

      // Tính tổng ngày nghỉ được duyệt
      const totalLeaveDays = leaveRecords.length; // Mỗi bản ghi là 1 ngày nghỉ

      // Tính ngày công thực: số bản ghi chấm công trừ ngày nghỉ
      const totalWorkDays = attendanceRecords.length - totalLeaveDays;

      // Tính tổng giờ muộn
      const totalLateHours = attendanceRecords.reduce(
        (sum, record) => sum + (record.late_hours || 0),
        0
      );

      // Tính lương
      const hourlyRate = employee.base_salary / standardWorkDays / 8;
      const penalty = totalLateHours * hourlyRate;
      const monthlySalary =
        (employee.base_salary / standardWorkDays) * totalWorkDays - penalty;

      return {
        employee_id: employee.employee_id,
        employee_name: employee.employee_name,
        department_name: employee.department_name,
        base_salary: employee.base_salary,
        standard_work_days: standardWorkDays,
        total_work_days: totalWorkDays >= 0 ? totalWorkDays : 0, 
        total_late_hours: totalLateHours,
        penalty: penalty,
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

  const lastDay = new Date(year, month, 0).getDate();
  let standardWorkDays = 0;
  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month - 1, day);
    if (date.getDay() !== 0) {
      standardWorkDays++;
    }
  }

  const [attendanceRecords] = await db.query(
    `SELECT * FROM attendance 
     WHERE employee_id = ? 
     AND YEAR(attendance_date) = ? 
     AND MONTH(attendance_date) = ?`,
    [employee_id, year, month]
  );

  const [leaveRecords] = await db.query(
    `SELECT leave_date FROM leave_requests 
     WHERE employee_id = ? 
     AND status = 'Approved' 
     AND YEAR(leave_date) = ? 
     AND MONTH(leave_date) = ?`,
    [employee_id, year, month]
  );

  const totalLeaveDays = leaveRecords.length;
  const totalWorkDays = attendanceRecords.length - totalLeaveDays;
  const totalLateHours = attendanceRecords.reduce(
    (sum, record) => sum + (record.late_hours || 0),
    0
  );

  const hourlyRate = employee[0].base_salary / standardWorkDays / 8;
  const penalty = totalLateHours * hourlyRate;
  const monthlySalary =
    (employee[0].base_salary / standardWorkDays) * totalWorkDays - penalty;

  return {
    employee_id: employee[0].employee_id,
    employee_name: employee[0].employee_name,
    base_salary: employee[0].base_salary,
    standard_work_days: standardWorkDays,
    total_work_days: totalWorkDays >= 0 ? totalWorkDays : 0,
    total_late_hours: totalLateHours,
    penalty: penalty,
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
  updateReportStatus,
  calculateMonthlySalary,
  calculateEmployeeMonthlySalary,
};
