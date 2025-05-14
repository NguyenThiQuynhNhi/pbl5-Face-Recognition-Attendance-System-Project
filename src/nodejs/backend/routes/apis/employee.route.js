import express from "express";
import employeeController from "../../controllers/employeeController.js";
import absenceController from "../../controllers/absenceController.js";
import attendanceController from "../../controllers/attendanceController.js";
import leaveController from "../../controllers/leaveController.js";
import { authenticate } from "../../middlewares/auth.js";
import { validateLeaveRequest } from "../../middlewares/validate.js";

const employeeRouter = (db) => {
  const router = express.Router();

  router.use(authenticate);

  // Quản lý thông tin cá nhân
  router.get("/profile", (req, res, next) =>
    employeeController.getProfile(req, res, next, db)
  );
  router.put("/profile", (req, res, next) =>
    employeeController.updateProfile(req, res, next, db)
  );

  // Quản lý chấm công
  router.get("/attendance", (req, res, next) =>
    attendanceController.getAttendanceByEmployee(req, res, next, db)
  );

  // Quản lý báo cáo chấm công
  router.get("/attendance-reports", (req, res, next) =>
    attendanceController.getAttendanceReportByEmployee(req, res, next, db)
  );
  router.post("/attendance-reports", (req, res, next) =>
    attendanceController.createReport(req, res, next, db)
  );

  // Quản lý đơn xin nghỉ phép
  router.post("/leave-requests", validateLeaveRequest, (req, res, next) =>
    leaveController.createLeaveRequest(req, res, next, db)
  );
  router.get("/leave-requests", (req, res, next) =>
    leaveController.getEmployeeLeaveRequests(req, res, next, db)
  );

  //Quản lý nghỉ không phép
  router.get("/absence-reports", (req, res, next) =>
    absenceController.getAbsenceReportsByEmployee(req, res, next, db)
  );

  // Quản lý lương
  router.get("/salary-report", (req, res, next) => attendanceController.calculateEmployeeMonthlySalary(req, res, next, db));

  return router;
};

export default employeeRouter;
