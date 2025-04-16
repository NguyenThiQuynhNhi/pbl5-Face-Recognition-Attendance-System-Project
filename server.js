import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv'
import cors from 'cors';
import routes from './src/nodejs/backend/routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config()
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'src/nodejs/frontend')));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "employee_management",
});

// db.connect((err) => {
//     if (err) {
//         console.error("❌ Lỗi kết nối MySQL:", err);
//     } else {
//         console.log("✅ Kết nối MySQL thành công!");
//     }
// });
db.connect(); // Kết nối MySQL thành công

app.use('/', routes(db));

const Port = process.env.Port || 5000
app.listen(Port, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${Port}/auth/login.html`);
});