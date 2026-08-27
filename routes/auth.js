const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/login', async (req, res) => {
    try {
        const { username, password, shift, group, workstation } = req.body;

        // Basic validation
        if (!username || !password || !shift || !group || !workstation) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const [rows] = await db.execute('SELECT * FROM users WHERE username = ? AND password = ? AND active = 1', [username, password]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or inactive user.' });
        }

        const user = rows[0];

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

module.exports = router;
