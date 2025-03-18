import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "quanlychamcong",
});

db.connect((err) => {
    if (err) {
        console.error("❌ Lỗi kết nối MySQL:", err);
    } else {
        console.log("✅ Kết nối MySQL thành công!");
    }
});

// --- API cho cầu thủ ---
// Lấy danh sách cầu thủ
app.get("/players", (req, res) => {
    const sql = "SELECT MaCauThu, TenCauThu, HinhAnh FROM cauthu";
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "❌ Lỗi truy vấn MySQL", error: err });
        }
        res.json(results);
    });
});

// Thêm cầu thủ
app.post("/players", (req, res) => {
    const { MaCauThu, TenCauThu, HinhAnh } = req.body;
    const sql = "INSERT INTO cauthu (MaCauThu, TenCauThu, HinhAnh) VALUES (?, ?, ?)";
    
    db.query(sql, [MaCauThu, TenCauThu, HinhAnh], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "❌ Lỗi thêm cầu thủ", error: err });
        }
        res.json({ message: "✅ Thêm cầu thủ thành công", MaCauThu });
    });
});

// Sửa cầu thủ
app.put("/players/:MaCauThu", (req, res) => {
    const { TenCauThu, HinhAnh } = req.body;
    const { MaCauThu } = req.params;
    const sql = "UPDATE cauthu SET TenCauThu = ?, HinhAnh = ? WHERE MaCauThu = ?";
    
    db.query(sql, [TenCauThu, HinhAnh, MaCauThu], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "❌ Lỗi sửa cầu thủ", error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "❌ Không tìm thấy cầu thủ" });
        }
        res.json({ message: "✅ Sửa cầu thủ thành công", MaCauThu });
    });
});

// Xóa cầu thủ
app.delete("/players/:MaCauThu", (req, res) => {
    const { MaCauThu } = req.params;
    const sql = "DELETE FROM cauthu WHERE MaCauThu = ?";
    
    db.query(sql, [MaCauThu], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "❌ Lỗi xóa cầu thủ", error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "❌ Không tìm thấy cầu thủ" });
        }
        res.json({ message: "✅ Xóa cầu thủ thành công", MaCauThu });
    });
});

// --- API cho chấm công ---
// Lấy danh sách chấm công
app.get("/attendance", (req, res) => {
    const sql = "SELECT MaChamCong, MaCauThu, NgayChamCong, InOut, TrangThai FROM chamcong";
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "❌ Lỗi truy vấn danh sách chấm công", error: err });
        }
        res.json(results);
    });
});

// Thêm chấm công (ĐÃ SỬA)
app.post("/attendance", (req, res) => {
    const { MaChamCong, MaCauThu, NgayChamCong, InOut, TrangThai } = req.body;
    const sql = "INSERT INTO chamcong (MaChamCong, MaCauThu, NgayChamCong, InOut, TrangThai) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [MaChamCong, MaCauThu, NgayChamCong, InOut, TrangThai], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "❌ Lỗi thêm chấm công", error: err });
        }
        res.json({ message: "✅ Thêm chấm công thành công", MaChamCong });
    });
});

// Sửa chấm công (ĐÃ SỬA)
app.put("/attendance/:MaChamCong", (req, res) => {
    const { MaCauThu, NgayChamCong, InOut, TrangThai } = req.body;
    const { MaChamCong } = req.params;
    const sql = "UPDATE chamcong SET MaCauThu = ?, NgayChamCong = ?, InOut = ?, TrangThai = ? WHERE MaChamCong = ?";
    
    db.query(sql, [MaCauThu, NgayChamCong, InOut, TrangThai, MaChamCong], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "❌ Lỗi sửa chấm công", error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "❌ Không tìm thấy bản ghi chấm công" });
        }
        res.json({ message: "✅ Sửa chấm công thành công", MaChamCong });
    });
});

// Xóa chấm công
app.delete("/attendance/:MaChamCong", (req, res) => {
    const { MaChamCong } = req.params;
    const sql = "DELETE FROM chamcong WHERE MaChamCong = ?";
    
    db.query(sql, [MaChamCong], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "❌ Lỗi xóa chấm công", error: err });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "❌ Không tìm thấy bản ghi chấm công" });
        }
        res.json({ message: "✅ Xóa chấm công thành công", MaChamCong });
    });
});

app.listen(port, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${port}`);
});