import express from 'express';
import employeeController from '../../controllers/employeeController.js';
import { authenticate } from '../../middlewares/auth.js';
import { validateEmployee } from '../../middlewares/validate.js';

const employeeRouter = (db) => {
    const router = express.Router();

    router.get('/', authenticate, (req, res, next) => employeeController.getEmployees(req, res, next, db));
    router.post('/', authenticate, validateEmployee, (req, res, next) => employeeController.addEmployee(req, res, next, db));
    router.put('/:employee_id', authenticate, validateEmployee, (req, res, next) => employeeController.updateEmployee(req, res, next, db));
    router.delete('/:employee_id', authenticate, (req, res, next) => employeeController.deleteEmployee(req, res, next, db));

    return router;
};

export default employeeRouter;