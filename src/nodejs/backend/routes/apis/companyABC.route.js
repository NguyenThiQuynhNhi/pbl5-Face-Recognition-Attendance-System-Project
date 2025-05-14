import express from "express";
import adminRouter from "./admin.route.js";
import employeeRouter from "./employee.route.js";
import authController from "../../controllers/authController.js";
import { validateLogin } from "../../middlewares/validate.js";

const router = (db) => {
    const mainRouter = express.Router();

    // Route đăng nhập
    mainRouter.post('/login', validateLogin, (req, res, next) => authController.login(req, res, db));

    // Route cho admin
    mainRouter.use("/admin", adminRouter(db));

    // Route cho employee
    mainRouter.use("/employee", employeeRouter(db));

    return mainRouter;
};

export default router;