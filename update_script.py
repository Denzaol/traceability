import re

# 1. Update routes/auth.js
with open('routes/auth.js', 'r', encoding='utf-8') as f:
    auth_js = f.read()

if '/check-user' not in auth_js:
    check_user_route = """
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
"""
    auth_js = auth_js.replace('module.exports = router;', check_user_route + '\nmodule.exports = router;')

    # Also fix /login validation (remove strict validation)
    old_val = """        // Basic validation
        if (!username || !password || !shift || !group || !workstation) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }"""
    
    new_val = """        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }"""
    auth_js = auth_js.replace(old_val, new_val)

    old_auth_check = """        const user = rows[0];

        // In a real app, generate a JWT token here
        res.json({"""
    
    new_auth_check = """        const user = rows[0];

        if (user.role !== 'Admin') {
            if (!shift || !group || !workstation) {
                return res.status(400).json({ success: false, message: 'Shift, Group, and Station are required for non-admin users.' });
            }
        }

        // In a real app, generate a JWT token here
        res.json({"""
    auth_js = auth_js.replace(old_auth_check, new_auth_check)

    with open('routes/auth.js', 'w', encoding='utf-8') as f:
        f.write(auth_js)


# 2. Update public/index.html (remove options & required)
with open('public/index.html', 'r', encoding='utf-8') as f:
    idx = f.read()

idx = re.sub(r'<select id="shift" required>', '<select id="shift">', idx)
idx = re.sub(r'<select id="group" required>', '<select id="group">', idx)
idx = re.sub(r'<select id="login-workstation" required>', '<select id="login-workstation">', idx)

# Remove hardcoded options (just simple regex replace for the ones we know exist)
idx = re.sub(r'<option value="Shift 1">Shift 1</option>\s*<option value="Shift 2">Shift 2 / Malam</option>', '', idx)
idx = re.sub(r'<option value="Group A">Group A</option>\s*<option value="Group B">Group B</option>', '', idx)
idx = re.sub(r'<option value="STG-05">Stage 5</option>\s*<option value="STG-08">Stage 8</option>\s*<option value="STG-13">Stage 13</option>', '', idx)

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(idx)


print("Auth and HTML updated.")
