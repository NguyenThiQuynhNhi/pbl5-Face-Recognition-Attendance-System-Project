import departmentService from "../services/departmentService.js";

const getDepartments = async (req, res, next, db) => {
    const departments = await departmentService.getDepartments(db, req.query.department_id);
    res.status(200).json({ success: true, data: departments });
};

const getDepartmentById = async (req, res, next, db) => {
    const department = await departmentService.getDepartmentById(db, req.params.department_id);
    res.status(200).json({ success: true, data: department });
}

const addDepartment = (req, res, next, db) => {
    departmentService.addDepartment(db, req.body);
    res.status(201).json({ success: true, message: "Thêm phòng ban thành công!" });
};

const updateDepartment = (req, res, next, db) => {
    departmentService.updateDepartment(db, req.params.department_id, req.body);
    res.status(200).json({ success: true, message: "Cập nhật phòng ban thành công!" });
};

const deleteDepartment = (req, res, next, db) => {
    departmentService.deleteDepartment(db, req.params.department_id);
    res.status(200).json({ success: true, message: "Xóa phòng ban thành công!" });
};

export default { getDepartments, getDepartmentById , addDepartment, updateDepartment, deleteDepartment };