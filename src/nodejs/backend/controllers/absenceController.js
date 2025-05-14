import absenceService from "../services/absenceService.js";

const getAbsenceReports = async (req, res, next, db) => {
    const absenceReports = await absenceService.getAbsenceReports(db, req.query);
    res.status(200).json({ success: true, data: absenceReports });
};

const getAbsenceReportsByEmployee = async (req, res, next, db) => {
    const absenceReports = await absenceService.getAbsenceReportsByEmployee(db,  req.user.employee_id);
    res.status(200).json({ success: true, data: absenceReports });
}

export default { getAbsenceReports, getAbsenceReportsByEmployee };