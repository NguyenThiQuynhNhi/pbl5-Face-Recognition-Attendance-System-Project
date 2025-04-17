import fs from 'fs';
import path from 'path';

const getEmployees = (db) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM employees';
        db.query(query, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            resolve(results);
        });
    });
};

const getEmployeeById = (db, employee_id) => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM employees WHERE employee_id = ?';
        db.query(query, [employee_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            resolve(results[0]);
        });
    });
};

const addEmployee = (db, body, imageFile) => {
    const { employee_id, employee_name, department_id, email, phone } = body;
    return new Promise((resolve, reject) => {
        if (!employee_id || !employee_name || !department_id || !email) {
            return reject(new Error('Thiếu thông tin bắt buộc!'));
        }

        // Kiểm tra employee_id đã tồn tại chưa
        const checkQuery = 'SELECT employee_id FROM employees WHERE employee_id = ?';
        db.query(checkQuery, [employee_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length > 0) {
                return reject(new Error('Mã nhân viên đã tồn tại!'));
            }

            // Kiểm tra department_id có tồn tại
            const deptQuery = 'SELECT department_id FROM departments WHERE department_id = ?';
            db.query(deptQuery, [department_id], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                }
                if (results.length === 0) {
                    return reject(new Error('Phòng ban không tồn tại!'));
                }

                let image_path = null;
                if (imageFile && imageFile.name) {
                    // Tạo tên file duy nhất
                    const timestamp = Date.now();
                    const ext = imageFile.name.split('.').pop();
                    const filename = `${employee_id}_${timestamp}.${ext}`;
                    image_path = `/uploads/employees/${filename}`;
                    
                    // Đảm bảo thư mục uploads/employees tồn tại
                    const uploadDir = './public/uploads/employees';
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    
                    // Di chuyển file vào thư mục uploads
                    imageFile.mv(`./public${image_path}`, (err) => {
                        if (err) {
                            console.error('File upload error:', err);
                            return reject(new Error('Lỗi khi tải lên ảnh!'));
                        }
                    });
                }

                // Thêm nhân viên mới với ảnh
                const insertQuery = 'INSERT INTO employees (employee_id, employee_name, department_id, email, phone, face_image_dir) VALUES (?, ?, ?, ?, ?, ?)';
                db.query(insertQuery, [employee_id, employee_name, department_id, email, phone || null, image_path], (err) => {
                    if (err) {
                        // Nếu thêm vào database thất bại, xóa file ảnh đã upload (nếu có)
                        if (image_path) {
                            fs.unlink(`./public${image_path}`, (unlinkErr) => {
                                if (unlinkErr) console.error('Error deleting uploaded file:', unlinkErr);
                            });
                        }
                        console.error('Database error:', err);
                        return reject(new Error('Lỗi khi thêm nhân viên!'));
                    }
                    resolve({ message: 'Thêm nhân viên thành công!' });
                });
            });
        });
    });
};

const updateEmployee = (db, employee_id, body, imageFile) => {
    const { employee_name, department_id, email, phone } = body;
    return new Promise((resolve, reject) => {
        // Kiểm tra nhân viên tồn tại và lấy thông tin hiện tại
        const checkQuery = 'SELECT * FROM employees WHERE employee_id = ?';
        db.query(checkQuery, [employee_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length === 0) {
                return reject(new Error('Không tìm thấy nhân viên!'));
            }

            const currentEmployee = results[0];
            
            // Chỉ cập nhật các trường được gửi lên, giữ nguyên các trường còn lại
            const updatedEmployee = {
                employee_name: employee_name || currentEmployee.employee_name,
                department_id: department_id || currentEmployee.department_id,
                email: email || currentEmployee.email,
                phone: phone !== undefined ? phone : currentEmployee.phone,
                face_image_dir: currentEmployee.face_image_dir
            };

            // Nếu có department_id mới, kiểm tra tồn tại
            if (department_id) {
                const deptQuery = 'SELECT department_id FROM departments WHERE department_id = ?';
                db.query(deptQuery, [department_id], (err, results) => {
                    if (err) {
                        console.error('Database error:', err);
                        return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                    }
                    if (results.length === 0) {
                        return reject(new Error('Phòng ban không tồn tại!'));
                    }
                    processImageAndUpdate();
                });
            } else {
                processImageAndUpdate();
            }

            function processImageAndUpdate() {
                let image_path = currentEmployee.face_image_dir;
                
                // Chỉ xử lý ảnh nếu có file mới được upload
                if (imageFile && imageFile.name) {
                    // Xóa ảnh cũ nếu có
                    if (currentEmployee.face_image_dir) {
                        const oldImagePath = `./public${currentEmployee.face_image_dir}`;
                        if (fs.existsSync(oldImagePath)) {
                            fs.unlinkSync(oldImagePath);
                        }
                    }

                    // Tạo tên file mới
                    const timestamp = Date.now();
                    const ext = imageFile.name.split('.').pop();
                    const filename = `${employee_id}_${timestamp}.${ext}`;
                    image_path = `/uploads/employees/${filename}`;
                    
                    // Đảm bảo thư mục uploads/employees tồn tại
                    const uploadDir = './public/uploads/employees';
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    
                    // Di chuyển file mới vào thư mục uploads
                    imageFile.mv(`./public${image_path}`, (err) => {
                        if (err) {
                            console.error('File upload error:', err);
                            return reject(new Error('Lỗi khi tải lên ảnh!'));
                        }
                    });
                }

                // Cập nhật thông tin nhân viên với các thông tin mới
                const updateQuery = 'UPDATE employees SET employee_name = ?, department_id = ?, email = ?, phone = ?, face_image_dir = ? WHERE employee_id = ?';
                db.query(updateQuery, [
                    updatedEmployee.employee_name,
                    updatedEmployee.department_id,
                    updatedEmployee.email,
                    updatedEmployee.phone,
                    image_path,
                    employee_id
                ], (err) => {
                    if (err) {
                        // Nếu cập nhật database thất bại và đã upload ảnh mới, xóa ảnh mới
                        if (imageFile && imageFile.name) {
                            fs.unlink(`./public${image_path}`, (unlinkErr) => {
                                if (unlinkErr) console.error('Error deleting new file:', unlinkErr);
                            });
                        }
                        console.error('Database error:', err);
                        return reject(new Error('Lỗi khi cập nhật nhân viên!'));
                    }
                    resolve({ message: 'Cập nhật nhân viên thành công!' });
                });
            }
        });
    });
};

const deleteEmployee = (db, employee_id) => {
    return new Promise((resolve, reject) => {
        // Lấy thông tin nhân viên trước khi xóa để biết đường dẫn ảnh
        const getImageQuery = 'SELECT face_image_dir FROM employees WHERE employee_id = ?';
        db.query(getImageQuery, [employee_id], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
            }
            if (results.length === 0) {
                return reject(new Error('Không tìm thấy nhân viên!'));
            }

            const face_image_dir = results[0].face_image_dir;

            // Kiểm tra nhân viên có bản ghi chấm công không
            const attendanceQuery = 'SELECT attendance_id FROM attendance WHERE employee_id = ? LIMIT 1';
            db.query(attendanceQuery, [employee_id], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return reject(new Error('Lỗi truy vấn cơ sở dữ liệu!'));
                }
                if (results.length > 0) {
                    return reject(new Error('Không thể xóa nhân viên đã có bản ghi chấm công!'));
                }

                // Xóa nhân viên
                const deleteQuery = 'DELETE FROM employees WHERE employee_id = ?';
                db.query(deleteQuery, [employee_id], (err) => {
                    if (err) {
                        console.error('Database error:', err);
                        return reject(new Error('Lỗi khi xóa nhân viên!'));
                    }

                    // Sau khi xóa thành công từ database, xóa file ảnh nếu có
                    if (face_image_dir) {
                        const imagePath = `./public${face_image_dir}`;
                        if (fs.existsSync(imagePath)) {
                            fs.unlink(imagePath, (err) => {
                                if (err) console.error('Error deleting image file:', err);
                            });
                        }
                    }

                    resolve({ message: 'Xóa nhân viên thành công!' });
                });
            });
        });
    });
};

export default {
    getEmployees,
    getEmployeeById,
    addEmployee,
    updateEmployee,
    deleteEmployee,
};