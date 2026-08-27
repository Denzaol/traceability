const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/kpi', async (req, res) => {
    try {
        const { period, date, shift, group } = req.query;
        
        let whereClause = '1=1';
        let params = [];
        
        if (date) {
            whereClause += ' AND created_date = ?';
            params.push(date);
        }
        if (shift && shift !== 'all') {
            whereClause += ' AND shift_name = ?';
            params.push(shift);
        }
        if (group && group !== 'all') {
            whereClause += ' AND group_name = ?';
            params.push(group);
        }

        const [unitRows] = await db.query(`SELECT COUNT(DISTINCT nik) as unit_check FROM cycle_records WHERE ${whereClause}`, params);
        const unitCheck = unitRows[0].unit_check || 0;

        const [defectRows] = await db.query(`SELECT COUNT(*) as total_defect, 
            SUM(CASE WHEN status = 'OPEN' THEN 1 ELSE 0 END) as open_defect,
            SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) as closed_defect
            FROM defects WHERE DATE(created_at) = ?`, [date || new Date().toISOString().split('T')[0]]); 
        
        const totalDefect = defectRows[0].total_defect || 0;
        const openDefect = defectRows[0].open_defect || 0;
        const closedDefect = defectRows[0].closed_defect || 0;

        const dpu = unitCheck > 0 ? (totalDefect / unitCheck).toFixed(3) : 0;
        
        const notDirectRun = openDefect; 
        const directRun = Math.max(0, unitCheck - notDirectRun);
        const drr = unitCheck > 0 ? ((directRun / unitCheck) * 100).toFixed(1) : 0;

        res.json({
            unitCheck,
            totalDefect,
            dpu,
            directRun,
            notDirectRun,
            drr,
            openDefect,
            closedDefect
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
