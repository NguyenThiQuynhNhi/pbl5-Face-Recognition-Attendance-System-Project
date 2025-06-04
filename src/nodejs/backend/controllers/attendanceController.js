import attendanceService from "../services/attendanceService.js";
import employeeService from "../services/employeeService.js";

const getAttendance = async (req, res, next, db) => {
    const filters = {
        start_date: req.query.start_date,
        end_date: req.query.end_date,
        employee_id: req.query.employee_id,
        status: req.query.status,
        department_id: req.query.department_id
    };
    const records = await attendanceService.getAttendance(db, filters);
    res.status(200).json({ success: true, data: records });
};

const getAttendanceById = async (req, res, next, db) => {
    const attendance = await attendanceService.getAttendanceById(db, req.params.attendance_id);
    res.status(200).json({ success: true, data: attendance });
};

const addAttendance = async (req, res, next, db) => {
    const attendance = {
        employee_id: req.body.employee_id,
        attendance_date: req.body.attendance_date,
        time_in: req.body.time_in,
        time_out: req.body.time_out,
        photo_proof_in: req.files?.photo_proof_in?.path || null,
        photo_proof_out: req.files?.photo_proof_out?.path || null
    };
    await attendanceService.addAttendance(db, attendance);
    res.status(201).json({ success: true, message: "Thêm bản ghi chấm công thành công!" });
};

const updateAttendance = async (req, res, next, db) => {
    const attendance = {
        employee_id: req.body.employee_id,
        attendance_date: req.body.attendance_date,
        time_in: req.body.time_in,
        time_out: req.body.time_out,
        photo_proof_in: req.files?.photo_proof_in?.path || req.body.photo_proof_in || null,
        photo_proof_out: req.files?.photo_proof_out?.path || req.body.photo_proof_out || null
    };
    await attendanceService.updateAttendance(db, req.params.attendance_id, attendance);
    res.status(200).json({ success: true, message: "Cập nhật bản ghi chấm công thành công!" });
};

const deleteAttendance = async (req, res, next, db) => {
    await attendanceService.deleteAttendance(db, req.params.attendance_id);
    res.status(200).json({ success: true, message: "Xóa bản ghi chấm công thành công!" });
};

const getAttendanceByEmployee = async (req, res, next, db) => {
    const attendance = await attendanceService.getAttendanceByEmployee(
        db,
        req.user.employee_id,
        req.query
    );
    res.status(200).json({ success: true, data: attendance });
};

const createReport = async (req, res, next, db) => {
    await attendanceService.createReport(db, req.user.employee_id, req.body);
    res.status(201).json({ success: true, message: "Báo cáo đã được gửi thành công!" });
};

const getReports = async (req, res, next, db) => {
    const reports = await attendanceService.getReports(db, req.query);
    res.status(200).json({ success: true, data: reports });
};

const getAttendanceReportByEmployee = async (req, res, next, db) => {
    const reports = await attendanceService.getAttendanceReportsByEmployee(
        db,
        req.user.employee_id,
        req.query
    );
    res.status(200).json({ success: true, data: reports });
};

const updateReportStatus = async (req, res, next, db) => {
    await attendanceService.updateReportStatus(db, req.params.report_id, req.body.status);
    res.status(200).json({
        success: true,
        message: "Cập nhật trạng thái báo cáo thành công!"
    });
};

const calculateMonthlySalary = async (req, res, next, db) => {
    const filters = {
        employee_id: req.query.employee_id,
        department_id: req.query.department_id
    };
    const salaryReport = await attendanceService.calculateMonthlySalary(
        db,
        req.query.year,
        req.query.month,
        filters
    );
    res.status(200).json({ success: true, data: salaryReport });
};

const calculateEmployeeMonthlySalary = async (req, res, next, db) => {
    const { year, month } = req.query;
    const salaryReport = await attendanceService.calculateEmployeeMonthlySalary(
        db,
        req.user.employee_id,
        year,
        month
    );
    res.status(200).json({ success: true, data: salaryReport });
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
    getAttendanceReportByEmployee,
    updateReportStatus,
    calculateMonthlySalary,
    calculateEmployeeMonthlySalary,
};