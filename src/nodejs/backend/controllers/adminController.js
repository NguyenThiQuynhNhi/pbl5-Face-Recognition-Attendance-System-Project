import adminService from '../services/adminService.js';

const getAdmins = async (req, res, next, db) => {
    try {
        const admins = await adminService.getAdmins(db);
        return res.status(200).json({ data: admins });
    } catch (error) {
        next(error);
    }
};

const addAdmin = async (req, res, next, db) => {
    try {
        const body = req.body;
        const result = await adminService.addAdmin(db, body);
        return res.status(201).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const updateAdmin = async (req, res, next, db) => {
    try {
        const admin_id = parseInt(req.params.admin_id);
        const body = req.body;
        const result = await adminService.updateAdmin(db, admin_id, body);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

const deleteAdmin = async (req, res, next, db) => {
    try {
        const admin_id = parseInt(req.params.admin_id);
        const result = await adminService.deleteAdmin(db, admin_id);
        return res.status(200).json({ data: result });
    } catch (error) {
        next(error);
    }
};

export default {
    getAdmins,
    addAdmin,
    updateAdmin,
    deleteAdmin,
};