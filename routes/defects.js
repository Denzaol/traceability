const express = require('express');
const router = express.Router();
const db = require('../db');

// Get defects
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT * FROM defects';
        let params = [];
        
        if (status && status !== 'all') {
            query += ' WHERE status = ?';
            params.push(status);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Resolve defect
router.put('/:id/resolve', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE defects SET status = "CLOSED", resolved_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
