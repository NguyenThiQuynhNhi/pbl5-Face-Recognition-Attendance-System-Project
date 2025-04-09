import departmentService from '../services/departmentService.js';

const getDepartments = async (req, res, next, db) => {
    try {
        const departments = await departmentService.getDepartments(db);
        return res.status(200).json({ data: departments });
    } catch (error) {
        next(error);
    }
};

const getDepartmentById = async (req, res, next, db) => {
    try {
        const department_id = parseInt(req.params.department_id);
        const department = await departmentService.getDepartmentById(db, department_id);
        if (!department) {
            return res.status(404).json({ message: "Không tìm thấy phòng ban!" });
        }
        return res.status(200).json({ data: department });
    } catch (error) {
        next(error);
    }
};

const addDepartment = async (req, res, next, db) => {
    try {
        const body = req.body;
        const result = await departmentService.addDepartment(db, body);
        return res.status(201).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const updateDepartment = async (req, res, next, db) => {
    try {
        const department_id = parseInt(req.params.department_id);
        const body = req.body;
        const result = await departmentService.updateDepartment(db, department_id, body);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const deleteDepartment = async (req, res, next, db) => {
    try {
        const department_id = parseInt(req.params.department_id);
        const result = await departmentService.deleteDepartment(db, department_id);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

export default {
    getDepartments,
    getDepartmentById,
    addDepartment,
    updateDepartment,
    deleteDepartment,
};