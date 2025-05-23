import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv'
import cors from 'cors';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import routes from './src/nodejs/backend/routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config()
const app = express();

// Tạo thư mục uploads nếu chưa tồn tại
const uploadsDir = path.join(__dirname, 'public/uploads/employees');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src/nodejs/frontend')));
app.use(express.static(path.join(__dirname, 'src/python/data/proofs')));
app.use(express.static(path.join(__dirname, 'public')));

// Thêm route cho đường dẫn gốc để redirect đến trang login
app.get('/', (req, res) => {
    res.redirect('/auth/login.html');
})

// Middleware xử lý upload file
app.use(fileUpload({
    createParentPath: true,
    limits: {
        fileSize: 5 * 1024 * 1024 
    },
}));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "employee_management",
});

db.connect((err) => {
    if (err) {
        console.error("❌ Lỗi kết nối MySQL:", err);
    } else {
        console.log("✅ Kết nối MySQL thành công!");
    }
});
db.connect(); 

app.use('/', routes(db));

const Port = process.env.Port || 5000;
app.listen(Port, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${Port}`);
});