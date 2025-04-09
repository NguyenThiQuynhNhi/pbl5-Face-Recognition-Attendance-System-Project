import employeeService from '../services/employeeService.js';

const getEmployees = async (req, res, next, db) => {
    try {
        const employees = await employeeService.getEmployees(db);
        return res.status(200).json({ data: employees });
    } catch (error) {
        next(error);
    }
};

const getEmployeeById = async (req, res, next, db) => {
    try {
        const employee_id = parseInt(req.params.employee_id);
        const employee = await employeeService.getEmployeeById(db, employee_id);
        if (!employee) {
            return res.status(404).json({ message: "Không tìm thấy nhân viên!" });
        }
        return res.status(200).json({ data: employee });
    } catch (error) {
        next(error);
    }
};

const addEmployee = async (req, res, next, db) => {
    try {
        const body = req.body;
        const result = await employeeService.addEmployee(db, body);
        return res.status(201).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const updateEmployee = async (req, res, next, db) => {
    try {
        const employee_id = parseInt(req.params.employee_id);
        const body = req.body;
        const result = await employeeService.updateEmployee(db, employee_id, body);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const deleteEmployee = async (req, res, next, db) => {
    try {
        const employee_id = parseInt(req.params.employee_id);
        const result = await employeeService.deleteEmployee(db, employee_id);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

export default {
    getEmployees,
    getEmployeeById,
    addEmployee,
    updateEmployee,
    deleteEmployee,
};