const express = require('express');
const router = express.Router();
const db = require('../db');

// Users
router.get('/users', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT id, username, password, fullname, role, default_group, active FROM users`);
        res.json(rows);
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
        const [rows] = await db.query(`SELECT id, shift_code as code, shift_name as name, start_time as start, end_time as end, is_overnight as overnight, active FROM shifts`);
        res.json(rows);
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.post('/shifts', async (req, res) => {
    try {
        const { code, name, start, end, overnight, active } = req.body;
        const [result] = await db.query(`INSERT INTO shifts (shift_code, shift_name, start_time, end_time, is_overnight, active) VALUES (?, ?, ?, ?, ?, ?)`, [code, name, start, end, overnight, active]);
        res.json({ success: true, id: result.insertId });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});
router.put('/shifts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, start, end, overnight, active } = req.body;
        await db.query(`UPDATE shifts SET shift_code=?, shift_name=?, start_time=?, end_time=?, is_overnight=?, active=? WHERE id=?`, [code, name, start, end, overnight, active, id]);
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

module.exports = router;
