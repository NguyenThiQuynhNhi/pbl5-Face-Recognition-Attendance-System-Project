const getAdmins = async (db, role) => {
    const query = role ? "SELECT * FROM admins WHERE role = ?" : "SELECT * FROM admins";
    const [rows] = await db.query(query, role ? [role] : []);
    return rows;
};

const getAdminById = async (db, admin_id) => {
    const query = "SELECT * FROM admins WHERE admin_id = ?";
    const [rows] = await db.query(query, [admin_id]);
    return rows[0] || null; 
};

const addAdmin = (db, admin) => {
    const query = "INSERT INTO admins (username, password, full_name, role, email) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [admin.username, admin.password, admin.full_name, admin.role, admin.email]);
};

const updateAdmin = (db, admin_id, admin) => {
    const query = "UPDATE admins SET username = ?, password = ?, full_name = ?, role = ?, email = ? WHERE admin_id = ?";
    db.query(query, [admin.username, admin.password, admin.full_name, admin.role, admin.email, admin_id]);
};

const deleteAdmin = (db, admin_id) => {
    const query = "DELETE FROM admins WHERE admin_id = ?";
    db.query(query, [admin_id]);
};

export default { getAdmins, getAdminById, addAdmin, updateAdmin, deleteAdmin };