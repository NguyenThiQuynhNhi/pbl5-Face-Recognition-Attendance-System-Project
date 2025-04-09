import departmentService from '../services/departmentService.js';

const getDepartments = async (req, res, next) => {
    try {
        const departments = await departmentService.getDepartments();
        return res.status(200).json({ data: departments });
    } catch (error) {
        next(error);
    }
};

const addDepartment = async (req, res, next) => {
    try {
        const body = req.body;
        const result = await departmentService.addDepartment(body);
        return res.status(201).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const updateDepartment = async (req, res, next) => {
    try {
        const department_id = req.params.department_id;
        const body = req.body;
        const result = await departmentService.updateDepartment(department_id, body);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const deleteDepartment = async (req, res, next) => {
    try {
        const department_id = req.params.department_id;
        const result = await departmentService.deleteDepartment(department_id);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

export default {
    getDepartments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
};