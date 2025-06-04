// services/leaveService.js
const getLeaveRequests = async (db, filters) => {
    if (!db || typeof db.query !== 'function') {
        throw new Error('Đối tượng cơ sở dữ liệu không hợp lệ hoặc không được khởi tạo.');
    }
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
    if (filters.leave_date) {
        query += " AND DATE(lr.leave_date) = ?";
        params.push(filters.leave_date);
    }
    if (filters.department_id) {
        query += " AND e.department_id = ?";
        params.push(filters.department_id);
    }
    const [rows] = await db.query(query, params);
    return rows;
};

// Cập nhật trạng thái đơn xin nghỉ phép (chỉ cho phép duyệt/từ chối)
const updateLeaveRequestStatus = async (db, request_id, status, approved_by) => {
    if (!db || typeof db.query !== 'function') {
        throw new Error('Đối tượng cơ sở dữ liệu không hợp lệ hoặc không được khởi tạo.');
    }
    if (!['Approved', 'Rejected'].includes(status)) {
        throw new Error('Trạng thái không hợp lệ. Chỉ chấp nhận "Approved" hoặc "Rejected".');
    }
    const query = `
        UPDATE leave_requests 
        SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP 
        WHERE request_id = ?
    `;
    const [result] = await db.query(query, [status, approved_by, request_id]);
    if (result.affectedRows === 0) {
        throw new Error('Không tìm thấy đơn xin nghỉ phép với ID này.');
    }
    return result;
};

const createLeaveRequest = async (db, employee_id, leaveRequest) => {
    if (!db || typeof db.query !== 'function') {
        throw new Error('Đối tượng cơ sở dữ liệu không hợp lệ hoặc không được khởi tạo.');
    }
    const query = `
        INSERT INTO leave_requests (employee_id, leave_date, reason) 
        VALUES (?, ?, ?)
    `;
    const [result] = await db.query(query, [employee_id, leaveRequest.leave_date, leaveRequest.reason]);
    if (result.affectedRows === 0) {
        throw new Error('Tạo đơn xin nghỉ phép thất bại.');
    }
    return result;
};

const getEmployeeLeaveRequests = async (db, employee_id, filters) => {
    if (!db || typeof db.query !== 'function') {
        throw new Error('Đối tượng cơ sở dữ liệu không hợp lệ hoặc không được khởi tạo.');
    }
    let query = "SELECT * FROM leave_requests WHERE employee_id = ?";
    const params = [employee_id];
    if (filters.status) {
        query += " AND status = ?";
        params.push(filters.status);
    }
    if (filters.month) {
        const [year, month] = filters.month.split("-");
        query += " AND YEAR(leave_date) = ? AND MONTH(leave_date) = ?";
        params.push(year, month);
    }
    const [rows] = await db.query(query, params);
    return rows;
};

const deleteLeaveRequest = async (db, request_id) => {
    if (!db || typeof db.query !== 'function') {
        throw new Error('Đối tượng cơ sở dữ liệu không hợp lệ hoặc không được khởi tạo.');
    }
    const query = "DELETE FROM leave_requests WHERE request_id = ?";
    const [result] = await db.query(query, [request_id]);
    if (result.affectedRows === 0) {
        throw new Error('Không tìm thấy đơn xin nghỉ phép với ID này.');
    }
    return result;
};

export default {
    getLeaveRequests,
    updateLeaveRequestStatus,
    createLeaveRequest,
    getEmployeeLeaveRequests,
    deleteLeaveRequest
};