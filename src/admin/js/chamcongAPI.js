import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", // Thay bằng mật khẩu MySQL của bạn nếu có
    database: "quanlychamcong"
});

db.connect((err) => {
    if (err) {
        console.error("❌ Lỗi kết nối MySQL:", err);
    } else {
        console.log("✅ Kết nối MySQL thành công!");
    }
});

// Lấy danh sách chấm công
app.get('/attendance', (req, res) => {
    const sql = "SELECT MaChamCong, MaCauThu, NgayChamCong, `InOut`, TrangThai FROM chamcong";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Lỗi truy vấn MySQL:", err);
            return res.status(500).json({ message: "Lỗi khi lấy danh sách chấm công." });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "⛔ Không có bản ghi chấm công nào." });
        }
        res.json(results);
    });
});

// Thêm bản ghi chấm công
app.post('/attendance', (req, res) => {
    const { MaChamCong, MaCauThu, NgayChamCong, InOut, TrangThai } = req.body;
    if (!MaChamCong || !MaCauThu || !NgayChamCong || !InOut || !TrangThai) {
        return res.status(400).json({ message: "⛔ Thiếu dữ liệu chấm công." });
    }
    const sql = "INSERT INTO chamcong (MaChamCong, MaCauThu, NgayChamCong, `InOut`, TrangThai) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [MaChamCong, MaCauThu, NgayChamCong, InOut, TrangThai], (err, result) => {
        if (err) {
            console.error("❌ Lỗi thêm chấm công:", err);
            return res.status(500).json({ message: "Lỗi khi thêm chấm công." });
        }
        res.status(201).json({ message: "✅ Bản ghi chấm công đã được thêm!", MaChamCong });
    });
});

// Sửa bản ghi chấm công
app.put('/attendance/:MaChamCong', (req, res) => {
    const { MaChamCong } = req.params;
    const { MaCauThu, NgayChamCong, InOut, TrangThai } = req.body;
    if (!MaCauThu || !NgayChamCong || !InOut || !TrangThai) {
        return res.status(400).json({ message: "⛔ Thiếu dữ liệu cập nhật chấm công." });
    }
    const sql = "UPDATE chamcong SET MaCauThu = ?, NgayChamCong = ?, `InOut` = ?, TrangThai = ? WHERE MaChamCong = ?";
    db.query(sql, [MaCauThu, NgayChamCong, InOut, TrangThai, MaChamCong], (err, result) => {
        if (err) {
            console.error("❌ Lỗi cập nhật chấm công:", err);
            return res.status(500).json({ message: "Lỗi khi cập nhật chấm công." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "⛔ Không tìm thấy bản ghi chấm công để cập nhật." });
        }
        res.json({ message: "✅ Bản ghi chấm công đã được cập nhật!", MaChamCong });
    });
});

// Xóa bản ghi chấm công
app.delete('/attendance/:MaChamCong', (req, res) => {
    const { MaChamCong } = req.params;
    const sql = "DELETE FROM chamcong WHERE MaChamCong = ?";
    db.query(sql, [MaChamCong], (err, result) => {
        if (err) {
            console.error("❌ Lỗi xóa chấm công:", err);
            return res.status(500).json({ message: "Lỗi khi xóa chấm công." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "⛔ Không tìm thấy bản ghi chấm công để xóa." });
        }
        res.json({ message: "✅ Bản ghi chấm công đã bị xóa!", MaChamCong });
    });
});

const PORT = 5001;
app.listen(PORT, () => console.log(`🚀 Server chạy tại: http://localhost:${PORT}`));