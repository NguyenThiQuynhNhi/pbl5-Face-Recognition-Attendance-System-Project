import express from 'express';
import authController from '../../controllers/authController.js';
import { validateLogin } from '../../middlewares/validate.js';

const authRouter = (db) => {
    const router = express.Router();

    router.post('/login', validateLogin, (req, res, next) => authController.login(req, res, next, db));
    router.post('/forget-password', (req, res, next) => authController.forgetPassword(req, res, next, db));
    router.post('/reset-password', (req, res, next) => authController.resetPassword(req, res, next, db));

    return router;
};

export default authRouter;