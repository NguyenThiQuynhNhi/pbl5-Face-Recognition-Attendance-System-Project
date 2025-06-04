import cron from 'node-cron';
import absenceService from '../services/absenceService.js';

const checkAndRecordAbsences = async (db) => {
    const today = new Date().toISOString().split('T')[0];
    try {
        const query = `
            SELECT e.employee_id
            FROM employees e
            LEFT JOIN attendance a ON e.employee_id = a.employee_id AND a.attendance_date = ?
            LEFT JOIN leave_requests lr ON e.employee_id = lr.employee_id AND lr.leave_date = ? AND lr.status = 'Approved'
            WHERE a.employee_id IS NULL AND lr.employee_id IS NULL
        `;
        const [rows] = await db.query(query, [today, today]);
        
        // Ghi từng bản ghi vào absence_reports
        for (const row of rows) {
            await absenceService.recordAbsence(db, row.employee_id, today);
        }
    } catch (error) {
        console.error(`Error in absence check for ${today}:`, error);
    }
};

const startAbsenceScheduler = (db) => {
    cron.schedule('0 17 * * *', async () => {
        console.log('Running absence check at 17:00');
        await checkAndRecordAbsences(db);
    }, {
        timezone: 'Asia/Ho_Chi_Minh'
    });
};

export default { startAbsenceScheduler };