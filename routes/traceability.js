const express = require('express');
const router = express.Router();
const db = require('../db');

// WIP Tracking (Units in Stage 5 but not Stage 21)
router.get('/wip', async (req, res) => {
    try {
        const query = `
            SELECT 
                c.nik,
                c.variant_code as variant,
                c.created_at as start_time,
                c.inspector
            FROM cycle_records c
            WHERE c.pos = 'STAGE 05'
            AND NOT EXISTS (
                SELECT 1 FROM cycle_records c2 
                WHERE c2.nik = c.nik 
                AND c2.pos = 'STAGE 21'
            )
            ORDER BY c.created_at DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Suggestion endpoint for NIK Search
router.get('/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) return res.json([]); // Need at least 2 chars

        const query = `
            SELECT DISTINCT nik 
            FROM cycle_records 
            WHERE nik LIKE ? 
            LIMIT 10
        `;
        const [rows] = await db.query(query, [`%${q}%`]);
        res.json(rows.map(r => r.nik));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Full Traceability History by NIK
router.get('/search/:nik', async (req, res) => {
    try {
        const { nik } = req.params;
        
        // Fetch cycle records
        const [cycleRecords] = await db.query(
            `SELECT 
                id,
                pos,
                inspector,
                shift_name as shift,
                group_name as group_name,
                start_time,
                end_time,
                cycle_sec,
                status,
                created_date as date,
                part_no
            FROM cycle_records 
            WHERE nik = ? 
            ORDER BY created_at ASC`,
            [nik]
        );

        // Fetch components
        const [components] = await db.query(
            `SELECT cycle_id, component_name, part_no FROM cycle_components WHERE nik = ?`,
            [nik]
        );

        // Attach components to cycle records
        cycleRecords.forEach(cr => {
            cr.components = components.filter(c => c.cycle_id === cr.id);
        });

        // Fetch defects
        const [defects] = await db.query(
            `SELECT 
                description,
                category,
                pos as stage,
                shift_name as shift,
                status,
                created_at,
                resolved_at
            FROM defects 
            WHERE nik = ? 
            ORDER BY created_at ASC`,
            [nik]
        );

        // Fetch basic info from the first record
        let variant = '-';
        if (cycleRecords.length > 0) {
            const [varRow] = await db.query(`SELECT variant_code FROM cycle_records WHERE nik = ? LIMIT 1`, [nik]);
            if (varRow.length) variant = varRow[0].variant_code;
        }

        res.json({
            success: true,
            nik,
            variant,
            cycleRecords,
            defects
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
