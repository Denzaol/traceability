const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/login', async (req, res) => {
    try {
        const { username, password, shift, group, workstation } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }

        const [rows] = await db.execute('SELECT * FROM users WHERE username = ? AND password = ? AND active = 1', [username, password]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or inactive user.' });
        }

        const user = rows[0];

        if (user.role !== 'Admin') {
            if (!shift || !group || !workstation) {
                return res.status(400).json({ success: false, message: 'Shift, Group, and Station are required for non-admin users.' });
            }
        }

        // In a real app, generate a JWT token here
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                fullname: user.fullname,
                role: user.role
            },
            context: {
                shift,
                group,
                workstation
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


router.get('/check-user', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.json({ success: false });
        
        const [rows] = await db.query('SELECT role FROM users WHERE username = ? AND active = 1', [username]);
        if (rows.length > 0) {
            res.json({ success: true, role: rows[0].role });
        } else {
            res.json({ success: false });
        }
    } catch(e) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;
