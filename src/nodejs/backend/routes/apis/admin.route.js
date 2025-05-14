import express from "express";
import departmentController from "../../controllers/departmentController.js";
import employeeController from "../../controllers/employeeController.js";
import adminController from "../../controllers/adminController.js";
import attendanceController from "../../controllers/attendanceController.js";
import leaveController from "../../controllers/leaveController.js";
import absenceController from "../../controllers/absenceController.js";
import { validateDepartment, validateEmployee, validateAdmin, validateAttendance } from "../../middlewares/validate.js";

const adminRouter = (db) => {
    const router = express.Router();

    // Quản lý phòng ban
    router.get("/departments", (req, res, next) => departmentController.getDepartments(req, res, next, db));
    router.get("/departments/:department_id", (req, res, next) => departmentController.getDepartmentById(req, res, next, db));
    router.post("/departments", validateDepartment, (req, res, next) => departmentController.addDepartment(req, res, next, db));
    router.put("/departments/:department_id", validateDepartment, (req, res, next) => departmentController.updateDepartment(req, res, next, db));
    router.delete("/departments/:department_id", (req, res, next) => departmentController.deleteDepartment(req, res, next, db));

    // Quản lý nhân viên
    router.get("/employees", (req, res, next) => employeeController.getEmployees(req, res, next, db));
    router.get("/employees/:employee_id", (req, res, next) => employeeController.getEmployeeById(req, res, next, db));
    router.post("/employees", validateEmployee, (req, res, next) => employeeController.addEmployee(req, res, next, db));
    router.put("/employees/:employee_id", validateEmployee, (req, res, next) => employeeController.updateEmployee(req, res, next, db));
    router.delete("/employees/:employee_id", (req, res, next) => employeeController.deleteEmployee(req, res, next, db));

    // Quản lý tài khoản admin (chỉ dành cho SuperAdmin)
    router.get("/admins", (req, res, next) => adminController.getAdmins(req, res, next, db));
    router.get("/admins/:admin_id", (req, res, next) => adminController.getAdminById(req, res, next, db));
    router.post("/admins", validateAdmin, (req, res, next) => adminController.addAdmin(req, res, next, db));
    router.put("/admins/:admin_id", validateAdmin, (req, res, next) => adminController.updateAdmin(req, res, next, db));
    router.delete("/admins/:admin_id", (req, res, next) => adminController.deleteAdmin(req, res, next, db));

    // Quản lý chấm công
    router.get("/attendance", (req, res, next) => attendanceController.getAttendance(req, res, next, db));
    router.get("/attendance/:attendance_id", (req, res, next) => attendanceController.getAttendanceById(req, res, next, db));
    router.post("/attendance", validateAttendance, (req, res, next) => attendanceController.addAttendance(req, res, next, db));
    router.put("/attendance/:attendance_id", validateAttendance, (req, res, next) => attendanceController.updateAttendance(req, res, next, db));
    router.delete("/attendance/:attendance_id", (req, res, next) => attendanceController.deleteAttendance(req, res, next, db));

    // Quản lý báo cáo chấm công
    router.get("/attendance-reports", (req, res, next) => attendanceController.getReports(req, res, next, db));
    router.put("/attendance-reports/:report_id", (req, res, next) => attendanceController.updateReportStatus(req, res, next, db));

    // Quản lý đơn xin nghỉ phép
    router.get("/leave-requests", (req, res, next) => leaveController.getLeaveRequests(req, res, next, db));
    router.put("/leave-requests/:request_id", (req, res, next) => leaveController.updateLeaveRequestStatus(req, res, next, db));

    // Quản lý báo cáo nghỉ không phép
    router.get("/absence-reports", (req, res, next) => absenceController.getAbsenceReports(req, res, next, db));

    // Quản lý lương
    router.get("/salary-report", (req, res, next) => attendanceController.calculateMonthlySalary(req, res, next, db));

    return router;
};

export default adminRouter;