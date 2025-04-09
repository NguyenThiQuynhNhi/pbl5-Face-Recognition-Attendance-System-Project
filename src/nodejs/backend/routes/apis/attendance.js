import express from 'express';
import attendanceController from '../../controllers/attendanceController.js';
import { authenticate } from '../../middlewares/auth.js';
import { validateAttendance } from '../../middlewares/validate.js';

const attendanceRouter = (db) => {
    const router = express.Router();

    router.get('/', authenticate, (req, res, next) => attendanceController.getAttendance(req, res, next, db));
    router.post('/', authenticate, validateAttendance, (req, res, next) => attendanceController.addAttendance(req, res, next, db));
    router.put('/:attendance_id', authenticate, validateAttendance, (req, res, next) => attendanceController.updateAttendance(req, res, next, db));
    router.delete('/:attendance_id', authenticate, (req, res, next) => attendanceController.deleteAttendance(req, res, next, db));

    return router;
};

export default attendanceRouter;