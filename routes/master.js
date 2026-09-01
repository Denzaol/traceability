const express = require('express');
const router = express.Router();
const db = require('../db');

// Users
router.get('/users', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM users`);
        const mapped = rows.map(u => ({
            id: u.id,
            username: u.username,
            password: u.password,
            fullname: u.full_name || u.fullname || u.username,
            role: String(u.role).toLowerCase() === 'admin' ? 'Admin' : 'Inspector',
            default_group: u.default_group || '',
            active: u.is_active !== undefined ? u.is_active : (u.active !== undefined ? u.active : 1)
        }));
        res.json(mapped);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.post('/users', async (req, res) => {
    try {
        const { username, password, fullname, role, default_group, active } = req.body;
        const [result] = await db.query(`INSERT INTO users (username, password, fullname, role, default_group, active) VALUES (?, ?, ?, ?, ?, ?)`, [username, password, fullname, role, default_group, active]);
        res.json({ success: true, id: result.insertId });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, fullname, role, default_group, active, password } = req.body;
        if (password) {
            await db.query(`UPDATE users SET username=?, password=?, fullname=?, role=?, default_group=?, active=? WHERE id=?`, [username, password, fullname, role, default_group, active, id]);
        } else {
            await db.query(`UPDATE users SET username=?, fullname=?, role=?, default_group=?, active=? WHERE id=?`, [username, fullname, role, default_group, active, id]);
        }
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.delete('/users/:id', async (req, res) => {
    try {
        await db.query(`DELETE FROM users WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Shifts
router.get('/shifts', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT id, shift_code as code, shift_name as name, start_time as start, end_time as end, overtime_hours, is_overnight as overnight, active FROM shifts`);
        res.json(rows);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.post('/shifts', async (req, res) => {
    try {
        const { code, name, start, end, overtime_hours, overnight, active } = req.body;
        const [result] = await db.query(`INSERT INTO shifts (shift_code, shift_name, start_time, end_time, overtime_hours, is_overnight, active) VALUES (?, ?, ?, ?, ?, ?, ?)`, [code, name, start, end, overtime_hours || 0, overnight, active]);
        res.json({ success: true, id: result.insertId });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.put('/shifts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, start, end, overtime_hours, overnight, active } = req.body;
        await db.query(`UPDATE shifts SET shift_code=?, shift_name=?, start_time=?, end_time=?, overtime_hours=?, is_overnight=?, active=? WHERE id=?`, [code, name, start, end, overtime_hours || 0, overnight, active, id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.delete('/shifts/:id', async (req, res) => {
    try {
        await db.query(`DELETE FROM shifts WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Groups
router.get('/groups', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT id, group_code as code, group_name as name, active FROM groups_data`);
        res.json(rows);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.post('/groups', async (req, res) => {
    try {
        const { code, name, active } = req.body;
        const [result] = await db.query(`INSERT INTO groups_data (group_code, group_name, active) VALUES (?, ?, ?)`, [code, name, active]);
        res.json({ success: true, id: result.insertId });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.put('/groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, active } = req.body;
        await db.query(`UPDATE groups_data SET group_code=?, group_name=?, active=? WHERE id=?`, [code, name, active, id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.delete('/groups/:id', async (req, res) => {
    try {
        await db.query(`DELETE FROM groups_data WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Stages
router.get('/stages', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT id, code, name, active FROM stages`);
        res.json(rows);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.post('/stages', async (req, res) => {
    try {
        const { code, name, active } = req.body;
        const [result] = await db.query(`INSERT INTO stages (code, name, active) VALUES (?, ?, ?)`, [code, name, active]);
        res.json({ success: true, id: result.insertId });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.put('/stages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, active } = req.body;
        await db.query(`UPDATE stages SET code=?, name=?, active=? WHERE id=?`, [code, name, active, id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.delete('/stages/:id', async (req, res) => {
    try {
        await db.query(`DELETE FROM stages WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Components
router.get('/components', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT id, code, name, stage_code as stage, active FROM components`);
        res.json(rows);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.post('/components', async (req, res) => {
    try {
        const { code, name, stage, active } = req.body;
        const [result] = await db.query(`INSERT INTO components (code, name, stage_code, active) VALUES (?, ?, ?, ?)`, [code, name, stage, active]);
        res.json({ success: true, id: result.insertId });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.put('/components/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, stage, active } = req.body;
        await db.query(`UPDATE components SET code=?, name=?, stage_code=?, active=? WHERE id=?`, [code, name, stage, active, id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.delete('/components/:id', async (req, res) => {
    try {
        await db.query(`DELETE FROM components WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Variants
router.get('/variants', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT id, code, name, takt_time as takt, active FROM variants`);
        res.json(rows);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.post('/variants', async (req, res) => {
    try {
        const { code, name, takt, active } = req.body;
        const [result] = await db.query(`INSERT INTO variants (code, name, takt_time, active) VALUES (?, ?, ?, ?)`, [code, name, takt, active]);
        res.json({ success: true, id: result.insertId });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.put('/variants/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, takt, active } = req.body;
        await db.query(`UPDATE variants SET code=?, name=?, takt_time=?, active=? WHERE id=?`, [code, name, takt, active, id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.delete('/variants/:id', async (req, res) => {
    try {
        await db.query(`DELETE FROM variants WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Cycle Time Records (JSON for admin panel)
router.get('/cycle-records', async (req, res) => {
    try {
        const { date, shift, stage } = req.query;
        let where = '1=1';
        let params = [];
        if (date) { where += ' AND created_date = ?'; params.push(date); }
        if (shift && shift !== 'all') { where += ' AND shift_name = ?'; params.push(shift); }
        if (stage && stage !== 'all') { where += ' AND pos = ?'; params.push(stage); }
        const [rows] = await db.query(`SELECT id, nik, variant_code as variant, pos, shift_name as shift, group_name as 'group', inspector, start_time as startTime, end_time as endTime, cycle_sec as cycleSec, pause_sec as pauseSec, part_no, status, created_date as date FROM cycle_records WHERE ${where} ORDER BY created_at DESC`, params);
        
        if (rows.length > 0) {
            const ids = rows.map(r => r.id);
            const [components] = await db.query(`SELECT cycle_id, component_name, part_no FROM cycle_components WHERE cycle_id IN (?)`, [ids]);
            
            rows.forEach(r => {
                r.components = components.filter(c => c.cycle_id === r.id);
            });
        }

        res.json(rows);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Checked NIK list (all unique NIKs that have been inspected)
router.get('/checked-niks', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT nik, COUNT(*) as check_count, MAX(created_date) as last_check, GROUP_CONCAT(DISTINCT pos ORDER BY pos) as stages FROM cycle_records GROUP BY nik ORDER BY MAX(created_at) DESC`);
        res.json(rows);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
