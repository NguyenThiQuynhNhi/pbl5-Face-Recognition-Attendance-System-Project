import employeeService from '../services/employeeService.js';

const getEmployees = async (req, res, next) => {
    try {
        const employees = await employeeService.getEmployees();
        return res.status(200).json({ data: employees });
    } catch (error) {
        next(error);
    }
};

const addEmployee = async (req, res, next) => {
    try {
        const body = req.body;
        const result = await employeeService.addEmployee(body);
        return res.status(201).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const updateEmployee = async (req, res, next) => {
    try {
        const employee_id = req.params.employee_id;
        const body = req.body;
        const result = await employeeService.updateEmployee(employee_id, body);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const deleteEmployee = async (req, res, next) => {
    try {
        const employee_id = req.params.employee_id;
        const result = await employeeService.deleteEmployee(employee_id);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

export default {
    getEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
};