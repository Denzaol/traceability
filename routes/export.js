const express = require('express');
const router = express.Router();
const db = require('../db');

// Export Cycle Time Records
router.get('/cycle', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                c.created_date as Date,
                c.shift_name as Shift,
                c.group_name as GroupName,
                c.inspector as Inspector,
                c.pos as Stage,
                c.variant_code as Variant,
                c.nik as NIK,
                c.part_no as PartNoLegacy,
                GROUP_CONCAT(CONCAT(cc.component_name, ': ', cc.part_no) SEPARATOR ' | ') as Components,
                c.start_time as StartTime,
                c.end_time as EndTime,
                c.cycle_sec as CycleTimeSec,
                c.pause_sec as PauseTimeSec,
                c.status as Status
            FROM cycle_records c
            LEFT JOIN cycle_components cc ON c.id = cc.cycle_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);

        if (rows.length === 0) {
            return res.status(404).send("No data found");
        }

        const headers = Object.keys(rows[0]).join(',') + '\n';
        const csvData = rows.map(row => {
            return Object.values(row).map(val => {
                if (val === null || val === undefined) return '';
                // Escape quotes and wrap in quotes if there's a comma
                let strVal = String(val).replace(/"/g, '""');
                if (strVal.includes(',')) strVal = `"${strVal}"`;
                return strVal;
            }).join(',');
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=cycle_records_export.csv');
        res.send(headers + csvData);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Export Defects
router.get('/defects', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                created_at as Timestamp,
                shift_name as Shift,
                group_name as GroupName,
                inspector as Inspector,
                pos as Stage,
                nik as NIK,
                category as Category,
                description as Description,
                status as Status
            FROM defects
            ORDER BY created_at DESC
        `);

        if (rows.length === 0) {
            return res.status(404).send("No data found");
        }

        const headers = Object.keys(rows[0]).join(',') + '\n';
        const csvData = rows.map(row => {
            return Object.values(row).map(val => {
                if (val === null || val === undefined) return '';
                let strVal = String(val).replace(/"/g, '""');
                if (strVal.includes(',')) strVal = `"${strVal}"`;
                return strVal;
            }).join(',');
        }).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=defects_export.csv');
        res.send(headers + csvData);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
