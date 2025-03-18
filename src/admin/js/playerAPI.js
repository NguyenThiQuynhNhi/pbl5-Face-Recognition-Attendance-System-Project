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

// Lấy danh sách cầu thủ
app.get('/players', (req, res) => {
    const sql = "SELECT MaCauThu, TenCauThu, HinhAnh FROM cauthu";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Lỗi truy vấn MySQL:", err);
            return res.status(500).json({ message: "Lỗi khi lấy danh sách cầu thủ." });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "⛔ Không có cầu thủ nào." });
        }
        res.json(results);
    });
});

// Thêm cầu thủ
app.post('/players', (req, res) => {
    const { MaCauThu, TenCauThu, HinhAnh } = req.body;
    if (!MaCauThu || !TenCauThu || !HinhAnh) {
        return res.status(400).json({ message: "⛔ Thiếu dữ liệu cầu thủ." });
    }
    const sql = "INSERT INTO cauthu (MaCauThu, TenCauThu, HinhAnh) VALUES (?, ?, ?)";
    db.query(sql, [MaCauThu, TenCauThu, HinhAnh], (err, result) => {
        if (err) {
            console.error("❌ Lỗi thêm cầu thủ:", err);
            return res.status(500).json({ message: "Lỗi khi thêm cầu thủ." });
        }
        res.status(201).json({ message: "✅ Cầu thủ đã được thêm!", MaCauThu });
    });
});

// Sửa cầu thủ
app.put('/players/:MaCauThu', (req, res) => {
    const { MaCauThu } = req.params;
    const { TenCauThu, HinhAnh } = req.body;
    if (!TenCauThu || !HinhAnh) {
        return res.status(400).json({ message: "⛔ Thiếu dữ liệu cập nhật." });
    }
    const sql = "UPDATE cauthu SET TenCauThu = ?, HinhAnh = ? WHERE MaCauThu = ?";
    db.query(sql, [TenCauThu, HinhAnh, MaCauThu], (err, result) => {
        if (err) {
            console.error("❌ Lỗi cập nhật cầu thủ:", err);
            return res.status(500).json({ message: "Lỗi khi cập nhật cầu thủ." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "⛔ Không tìm thấy cầu thủ để cập nhật." });
        }
        res.json({ message: "✅ Cầu thủ đã được cập nhật!", MaCauThu });
    });
});

// Xóa cầu thủ
app.delete('/players/:MaCauThu', (req, res) => {
    const { MaCauThu } = req.params;
    const sql = "DELETE FROM cauthu WHERE MaCauThu = ?";
    db.query(sql, [MaCauThu], (err, result) => {
        if (err) {
            console.error("❌ Lỗi xóa cầu thủ:", err);
            return res.status(500).json({ message: "Lỗi khi xóa cầu thủ." });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "⛔ Không tìm thấy cầu thủ để xóa." });
        }
        res.json({ message: "✅ Cầu thủ đã bị xóa!", MaCauThu });
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại: http://localhost:${PORT}`));