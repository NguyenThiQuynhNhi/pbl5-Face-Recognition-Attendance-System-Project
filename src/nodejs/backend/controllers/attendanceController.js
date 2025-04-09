import attendanceService from '../services/attendanceService.js';

const getAttendance = async (req, res, next) => {
    try {
        const attendance = await attendanceService.getAttendance();
        return res.status(200).json({ data: attendance });
    } catch (error) {
        next(error);
    }
};

const addAttendance = async (req, res, next) => {
    try {
        const body = req.body;
        const result = await attendanceService.addAttendance(body);
        return res.status(201).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const updateAttendance = async (req, res, next) => {
    try {
        const attendance_id = parseInt(req.params.attendance_id);
        const body = req.body;
        const result = await attendanceService.updateAttendance(attendance_id, body);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const deleteAttendance = async (req, res, next) => {
    try {
        const attendance_id = parseInt(req.params.attendance_id);
        const result = await attendanceService.deleteAttendance(attendance_id);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

export default {
    getAttendance,
    addAttendance,
    updateAttendance,
    deleteAttendance,
};