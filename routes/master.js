const express = require('express');
const router = express.Router();
const db = require('../db');

const getTable = (tableName) => async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM ${tableName}`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createItem = (tableName, cols) => async (req, res) => {
    try {
        const data = req.body;
        const keys = cols.join(', ');
        const placeholders = cols.map(() => '?').join(', ');
        const values = cols.map(c => data[c] !== undefined ? data[c] : null);

        const [result] = await db.query(`INSERT INTO ${tableName} (${keys}) VALUES (${placeholders})`, values);
        res.json({ success: true, id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateItem = (tableName, cols) => async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const setClause = cols.map(c => `${c} = ?`).join(', ');
        const values = cols.map(c => data[c]);
        values.push(id);

        await db.query(`UPDATE ${tableName} SET ${setClause} WHERE id = ?`, values);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteItem = (tableName) => async (req, res) => {
    try {
        await db.query(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Users
router.get('/users', getTable('users'));
router.post('/users', createItem('users', ['username', 'password', 'fullname', 'role', 'default_group', 'active']));
router.put('/users/:id', updateItem('users', ['username', 'fullname', 'role', 'default_group', 'active']));
router.delete('/users/:id', deleteItem('users'));

// Shifts
router.get('/shifts', getTable('shifts'));
router.post('/shifts', createItem('shifts', ['shift_code', 'shift_name', 'start_time', 'end_time', 'is_overnight', 'active']));
router.put('/shifts/:id', updateItem('shifts', ['shift_code', 'shift_name', 'start_time', 'end_time', 'is_overnight', 'active']));
router.delete('/shifts/:id', deleteItem('shifts'));

// Groups
router.get('/groups', getTable('groups_data'));
router.post('/groups', createItem('groups_data', ['group_code', 'group_name', 'active']));
router.put('/groups/:id', updateItem('groups_data', ['group_code', 'group_name', 'active']));
router.delete('/groups/:id', deleteItem('groups_data'));

// Stages
router.get('/stages', getTable('stages'));
router.post('/stages', createItem('stages', ['code', 'name', 'active']));
router.put('/stages/:id', updateItem('stages', ['code', 'name', 'active']));
router.delete('/stages/:id', deleteItem('stages'));

// Components
router.get('/components', getTable('components'));
router.post('/components', createItem('components', ['code', 'name', 'stage_code', 'active']));
router.put('/components/:id', updateItem('components', ['code', 'name', 'stage_code', 'active']));
router.delete('/components/:id', deleteItem('components'));

// Variants
router.get('/variants', getTable('variants'));
router.post('/variants', createItem('variants', ['code', 'name', 'takt_time', 'active']));
router.put('/variants/:id', updateItem('variants', ['code', 'name', 'takt_time', 'active']));
router.delete('/variants/:id', deleteItem('variants'));

module.exports = router;
