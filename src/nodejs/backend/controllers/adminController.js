import adminService from "../services/adminService.js";

const getAdmins = async (req, res, next, db) => {
    const admins = await adminService.getAdmins(db, req.query.role);
    res.status(200).json({ success: true, data: admins });
};

const getAdminById = async (req, res, next, db) => {
    const admin = await adminService.getAdminById(db, req.params.admin_id);
    res.status(200).json({ success: true, data: admin });
};

const addAdmin = (req, res, next, db) => {
    adminService.addAdmin(db, req.body);
    res.status(201).json({ success: true, message: "Thêm tài khoản admin thành công!" });
};

const updateAdmin = (req, res, next, db) => {
    adminService.updateAdmin(db, req.params.admin_id, req.body);
    res.status(200).json({ success: true, message: "Cập nhật tài khoản admin thành công!" });
};

const deleteAdmin = (req, res, next, db) => {
    adminService.deleteAdmin(db, req.params.admin_id);
    res.status(200).json({ success: true, message: "Xóa tài khoản admin thành công!" });
};

export default { getAdmins, getAdminById, addAdmin, updateAdmin, deleteAdmin };