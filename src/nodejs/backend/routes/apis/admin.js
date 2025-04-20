import express from 'express';
import adminController from '../../controllers/adminController.js';
import { authenticate, restrictToSuperAdmin } from '../../middlewares/auth.js';
import { validateAdmin } from '../../middlewares/validate.js';

const adminRouter = (db) => {
    const router = express.Router();

    router.get('/', authenticate, restrictToSuperAdmin, (req, res, next) => adminController.getAdmins(req, res, next, db));
    router.get('/:admin_id', authenticate, restrictToSuperAdmin, (req, res, next) => adminController.getAdminById(req, res, next, db));
    router.post('/', authenticate, restrictToSuperAdmin, validateAdmin, (req, res, next) => adminController.addAdmin(req, res, next, db));
    router.put('/:admin_id', authenticate, restrictToSuperAdmin, validateAdmin, (req, res, next) => adminController.updateAdmin(req, res, next, db));
    router.delete('/:admin_id', authenticate, restrictToSuperAdmin, (req, res, next) => adminController.deleteAdmin(req, res, next, db));

    return router;
};

export default adminRouter;