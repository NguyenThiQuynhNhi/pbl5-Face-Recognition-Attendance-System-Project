import attendanceService from '../services/attendanceService.js';

const getAttendance = async (req, res, next, db) => {
    try {
        const attendance = await attendanceService.getAttendance(db);
        return res.status(200).json({ data: attendance });
    } catch (error) {
        next(error);
    }
};

const getAttendanceById = async (req, res, next, db) => {
    try {
        const attendance_id = parseInt(req.params.attendance_id);
        const attendance = await attendanceService.getAttendanceById(db, attendance_id);
        if (!attendance) {
            return res.status(404).json({ message: "Không tìm thấy bản ghi chấm công!" });
        }
        return res.status(200).json({ data: attendance });
    } catch (error) {
        next(error);
    }
};

const addAttendance = async (req, res, next, db) => {
    try {
        const body = req.body;
        const result = await attendanceService.addAttendance(db, body);
        return res.status(201).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const updateAttendance = async (req, res, next, db) => {
    try {
        const attendance_id = parseInt(req.params.attendance_id);
        const body = req.body;
        const result = await attendanceService.updateAttendance(db, attendance_id, body);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const deleteAttendance = async (req, res, next, db) => {
    try {
        const attendance_id = parseInt(req.params.attendance_id);
        const result = await attendanceService.deleteAttendance(db, attendance_id);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

export default {
    getAttendance,
    getAttendanceById,
    addAttendance,
    updateAttendance,
    deleteAttendance,
};