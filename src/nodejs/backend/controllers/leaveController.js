import leaveService from "../services/leaveService.js";

const getLeaveRequests = async (req, res, next, db) => {
    const leaveRequests = await leaveService.getLeaveRequests(db, req.query);
    res.status(200).json({ success: true, data: leaveRequests });
};

const updateLeaveRequestStatus = (req, res, next, db) => {
    leaveService.updateLeaveRequestStatus(db, req.params.request_id, req.body.status, req.user.id);
    res.status(200).json({ success: true, message: "Cập nhật trạng thái đơn xin nghỉ thành công!" });
};

const createLeaveRequest = (req, res, next, db) => {
    leaveService.createLeaveRequest(db, req.user.id, req.body);
    res.status(201).json({ success: true, message: "Gửi đơn xin nghỉ thành công!" });
};

const getEmployeeLeaveRequests = async (req, res, next, db) => {
    const leaveRequests = await leaveService.getEmployeeLeaveRequests(db, req.user.employee_id, req.query);
    res.status(200).json({ success: true, data: leaveRequests });
};

export default { getLeaveRequests, updateLeaveRequestStatus, createLeaveRequest, getEmployeeLeaveRequests };