import express from 'express';
import departmentController from '../../controllers/departmentController.js';
import { authenticate } from '../../middlewares/auth.js';
import { validateDepartment } from '../../middlewares/validate.js';

const departmentRouter = (db) => {
    const router = express.Router();

    router.get('/', authenticate, (req, res, next) => departmentController.getDepartments(req, res, next, db));
    router.get('/:department_id', authenticate, (req, res, next) => departmentController.getDepartmentById(req, res, next, db));
    router.post('/', authenticate, validateDepartment, (req, res, next) => departmentController.addDepartment(req, res, next, db));
    router.put('/:department_id', authenticate, validateDepartment, (req, res, next) => departmentController.updateDepartment(req, res, next, db));
    router.delete('/:department_id', authenticate, (req, res, next) => departmentController.deleteDepartment(req, res, next, db));

    return router;
};

export default departmentRouter;