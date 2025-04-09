import express from 'express';
import authRouter from './apis/auth.js';
import employeeRouter from './apis/employee.js';
import adminRouter from './apis/admin.js';
import attendanceRouter from './apis/attendance.js';
import departmentRouter from './apis/department.js';

const routes = (db) => {
    const router = express.Router();
    router.use('/auth', authRouter(db));
    router.use('/admins', adminRouter(db)); 
    router.use('/employees', employeeRouter(db));
    router.use('/attendance', attendanceRouter(db));
    router.use('/departments', departmentRouter(db));

    return router;
};

export default routes;