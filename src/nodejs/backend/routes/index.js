import express from "express";
import userRoutes from "./apis/companyABC.route.js";

const routes = (db) => {

    const routes = express.Router();
    routes.use("/companyABC", userRoutes(db));
   return routes;
};

export default routes;
