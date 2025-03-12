import express from 'express'; 
import sql from 'mssql';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const config = {
    user: 'sa', 
    password: '123', 
    server: 'localhost\\SQLEXPRESS02', 
    database: 'QuanLyChamCong',
    options: {
        encrypt: false, 
        trustServerCertificate: true
    }
};

const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log("✅ Kết nối SQL Server thành công!");
    } catch (err) {
        console.error("⛔ Lỗi kết nối SQL Server:", err);
    }
};
connectDB();

app.get('/players', async (req, res) => {
    try {
        const result = await sql.query("SELECT MaCauThu, TenCauThu, HinhAnh FROM CauThu");
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "⛔ Không có cầu thủ nào." });
        }
        res.json(result.recordset);
    } catch (err) {
        console.error("⛔ Lỗi truy vấn SQL:", err);
        res.status(500).json({ message: "Lỗi khi lấy danh sách cầu thủ." });
    }
});

app.post('/players', async (req, res) => {
    const { name, image } = req.body;
    if (!name || !image) return res.status(400).json({ message: "⛔ Thiếu dữ liệu cầu thủ." });

    try {
        const request = new sql.Request();
        request.input("TenCauThu", sql.NVarChar, name);
        request.input("HinhAnh", sql.NVarChar, image);
        await request.query("INSERT INTO CauThu (TenCauThu, HinhAnh) VALUES (@TenCauThu, @HinhAnh)");
        res.status(201).json({ message: "✅ Cầu thủ đã được thêm!" });
    } catch (err) {
        console.error("⛔ Lỗi thêm cầu thủ:", err);
        res.status(500).json({ message: "Lỗi khi thêm cầu thủ." });
    }
});

app.put('/players/:id', async (req, res) => {
    const { id } = req.params;
    const { name, image } = req.body;
    if (!name || !image) return res.status(400).json({ message: "⛔ Thiếu dữ liệu cập nhật." });

    try {
        const request = new sql.Request();
        request.input("id", sql.Int, id);
        request.input("TenCauThu", sql.NVarChar, name);
        request.input("HinhAnh", sql.NVarChar, image);
        const result = await request.query("UPDATE CauThu SET TenCauThu=@TenCauThu, HinhAnh=@HinhAnh WHERE MaCauThu=@id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "⛔ Không tìm thấy cầu thủ để cập nhật." });
        }
        res.json({ message: "✅ Cầu thủ đã được cập nhật!" });
    } catch (err) {
        console.error("⛔ Lỗi cập nhật cầu thủ:", err);
        res.status(500).json({ message: "Lỗi khi cập nhật cầu thủ." });
    }
});

app.delete('/players/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const request = new sql.Request();
        request.input("id", sql.Int, id);
        const result = await request.query("DELETE FROM CauThu WHERE MaCauThu=@id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "⛔ Không tìm thấy cầu thủ để xóa." });
        }
        res.json({ message: "✅ Cầu thủ đã bị xóa!" });
    } catch (err) {
        console.error("⛔ Lỗi xóa cầu thủ:", err);
        res.status(500).json({ message: "Lỗi khi xóa cầu thủ." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại: http://localhost:${PORT}`));
