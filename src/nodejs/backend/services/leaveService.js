const getLeaveRequests = async (db, filters) => {
    let query = `
        SELECT lr.*, e.employee_name, d.department_name
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.employee_id
        JOIN departments d ON e.department_id = d.department_id
        WHERE 1=1
    `;
    const params = [];
    if (filters.employee_id) {
        query += " AND lr.employee_id = ?";
        params.push(filters.employee_id);
    }
    if (filters.status) {
        query += " AND lr.status = ?";
        params.push(filters.status);
    }
    if (filters.start_date) {
        query += " AND DATE(lr.start_date) = ?";
        params.push(filters.start_date);
    }
    if (filters.department_id) {
        query += " AND e.department_id = ?";
        params.push(filters.department_id);
    }
    console.log('Query:', query, 'Params:', params);
    const [rows] = await db.query(query, params);
    console.log('Leave requests rows:', rows);
    return rows;
};

const updateLeaveRequestStatus = (db, request_id, status, approved_by) => {
  const query =
    "UPDATE leave_requests SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE request_id = ?";
  db.query(query, [status, approved_by, request_id]);
};

const createLeaveRequest = (db, employee_id, leaveRequest) => {
  const query =
    "INSERT INTO leave_requests (employee_id, leave_date, reason) VALUES (?, ?, ?, ?)";
  db.query(query, [employee_id, leaveRequest.leave_date, leaveRequest.reason]);
};

const getEmployeeLeaveRequests = async (db, employee_id, filters) => {
  let query = "SELECT * FROM leave_requests WHERE employee_id = ?";
  const params = [employee_id];
  if (filters.status) {
    query += " AND status = ?";
    params.push(filters.status);
  }
  if (filters.month) {
    const [year, month] = filters.month.split("-");
    query += " AND YEAR(leave_date) = ? AND MONTH(leave_date) = ?";
    params.push(year, month, year, month);
  }
  const [rows] = await db.query(query, params);
  return rows;
};

export default {
  getLeaveRequests,
  updateLeaveRequestStatus,
  createLeaveRequest,
  getEmployeeLeaveRequests,
};
