import attendanceService from "../services/attendanceService.js";
import employeeService from "../services/employeeService.js";

const getAttendance = async (req, res, next, db) => {
  const attendance = await attendanceService.getAttendance(db, req.query);
  res.status(200).json({ success: true, data: attendance });
};

const getAttendanceById = async (req, res, next, db) => {
  const attendance = await attendanceService.getAttendanceById(
    db,
    req.params.attendance_id
  );
  res.status(200).json({ success: true, data: attendance });
};

const addAttendance = (req, res, next, db) => {
  attendanceService.addAttendance(db, req.body);
  res
    .status(201)
    .json({ success: true, message: "Thêm bản ghi chấm công thành công!" });
};

const updateAttendance = (req, res, next, db) => {
  attendanceService.updateAttendance(db, req.params.attendance_id, req.body);
  res
    .status(200)
    .json({ success: true, message: "Cập nhật bản ghi chấm công thành công!" });
};

const deleteAttendance = (req, res, next, db) => {
  attendanceService.deleteAttendance(db, req.params.attendance_id);
  res
    .status(200)
    .json({ success: true, message: "Xóa bản ghi chấm công thành công!" });
};

const getAttendanceByEmployee = async (req, res, next, db) => {
    const attendance = await attendanceService.getAttendanceByEmployee(db, req.user.employee_id, req.query);
    res.status(200).json({ success: true, data: attendance });
};

const createReport = (req, res, next, db) => {
  attendanceService.createReport(db, req.user.id, req.body);
  res
    .status(201)
    .json({ success: true, message: "Gửi báo cáo chấm công thành công!" });
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

const updateReportStatus = (req, res, next, db) => {
  attendanceService.updateReportStatus(
    db,
    req.params.report_id,
    req.body.status
  );
  res.status(200).json({
    success: true,
    message: "Cập nhật trạng thái báo cáo thành công!",
  });
};

const calculateMonthlySalary = async (req, res, next, db) => {
  const employees = await employeeService.getEmployees(db);
  const salaryReport = await attendanceService.calculateMonthlySalary(
    db,
    req.query.year,
    req.query.month,
    employees
  );
  res.status(200).json({ success: true, data: salaryReport });
};

const calculateEmployeeMonthlySalary = async (req, res, next, db) => {
  const { month, year  } = req.query;
  const employee_id = await employeeService.getEmployeeById(db);
  const salaryReport = attendanceService.calculateEmployeeMonthlySalary(
    db,
    employee_id,
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
