const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/login', async (req, res) => {
    try {
        const { username, password, shift, group, workstation } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }

        // Query user by username and password (without referencing active/is_active in WHERE clause)
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        const user = rows[0];

        // Check if user is active (supports both is_active and active column names)
        const isActive = user.is_active !== undefined ? user.is_active : (user.active !== undefined ? user.active : 1);
        if (!isActive) {
            return res.status(401).json({ success: false, message: 'User account is inactive.' });
        }

        // Case-insensitive role check
        const roleStr = String(user.role || '').toLowerCase();
        const isAdmin = roleStr === 'admin';

        if (!isAdmin) {
            if (!shift || !group || !workstation) {
                return res.status(400).json({ success: false, message: 'Shift, Group, and Station are required for non-admin users.' });
            }
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                fullname: user.full_name || user.fullname || user.username,
                role: isAdmin ? 'Admin' : 'Inspector'
            },
            context: {
                shift: shift || '',
                group: group || '',
                workstation: workstation || ''
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

router.get('/check-user', async (req, res) => {
    try {
        const { username } = req.query;
        if (!username) return res.json({ success: false });
        
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length > 0) {
            const user = rows[0];
            const isActive = user.is_active !== undefined ? user.is_active : (user.active !== undefined ? user.active : 1);
            if (!isActive) return res.json({ success: false, message: 'Inactive user' });

            const roleStr = String(user.role || '').toLowerCase();
            const isAdmin = roleStr === 'admin';
            res.json({ success: true, role: isAdmin ? 'Admin' : 'Inspector' });
        } else {
            res.json({ success: false });
        }
    } catch(e) {
        console.error('Check user error:', e);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
