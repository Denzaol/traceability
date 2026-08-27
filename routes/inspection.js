const express = require('express');
const router = express.Router();
const db = require('../db');

// Get components for a specific stage
router.get('/components', async (req, res) => {
    try {
        const { pos } = req.query;
        let query = 'SELECT * FROM components WHERE active = 1';
        let params = [];

        if (pos && pos !== 'Unknown POS') {
            query += ' AND stage_code = ?';
            params.push(pos);
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Submit inspection (cycle record + defects)
router.post('/submit', async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const { cycleRecord, defects } = req.body;

        // Insert cycle record
        const [cycleRes] = await conn.query(
            `INSERT INTO cycle_records 
            (nik, variant_code, pos, shift_name, group_name, inspector, start_time, end_time, cycle_sec, pause_sec, status, created_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                cycleRecord.nik, cycleRecord.variant, cycleRecord.pos, cycleRecord.shift, cycleRecord.group, 
                cycleRecord.inspector, cycleRecord.startTime, cycleRecord.endTime, cycleRecord.cycleSec, 
                cycleRecord.pauseSec, cycleRecord.status, cycleRecord.date
            ]
        );

        // Insert defects if any
        if (defects && defects.length > 0) {
            const defectValues = defects.map(d => [
                d.id, d.nik, d.desc, d.category, d.pos, d.shift, d.group, d.inspector, d.status
            ]);
            
            await conn.query(
                `INSERT INTO defects (id, nik, description, category, pos, shift_name, group_name, inspector, status) VALUES ?`,
                [defectValues]
            );
        }

        await conn.commit();
        res.json({ success: true, message: 'Inspection saved' });
    } catch (error) {
        await conn.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;
