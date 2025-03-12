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

// API lấy danh sách cầu thủ
app.get("/players", (req, res) => {
    const sql = "SELECT MaCauThu, TenCauThu, HinhAnh FROM cauthu";
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "❌ Lỗi truy vấn MySQL", error: err });
        }
        res.json(results);
    });
});

// API thêm cầu thủ
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

app.listen(port, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${port}`);
});
