import re

with open('public/script.js', 'r', encoding='utf-8') as f:
    script_js = f.read()

old_login_start = """    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const shift = document.getElementById('shift').value;
        const group = document.getElementById('group').value;
        const workstation = document.getElementById('login-workstation').value;

        if (username && shift && group && workstation) {"""

new_login = """    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const shift = document.getElementById('shift').value;
        const group = document.getElementById('group').value;
        const workstation = document.getElementById('login-workstation').value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, shift, group, workstation })
            });
            const data = await res.json();
            
            if (!data.success) {
                showToast('error', 'Login Failed', data.message || 'Invalid credentials');
                return;
            }

            const user = data.user;
            const context = data.context;

            localStorage.setItem('sessionUser', JSON.stringify({
                fullname: user.fullname,
                role: user.role,
                shift: context.shift || '',
                group: context.group || '',
                workstation: context.workstation || ''
            }));

            if (user.role === 'Admin') {
                window.location.href = 'admin.html';
                return;
            }

            // For Inspectors:
            displayUser.textContent = user.fullname.toUpperCase();
            displayShift.textContent = context.shift;
            displayGroup.textContent = context.group;
            if (displayPosHeader) displayPosHeader.textContent = context.workstation;
            
            window.activeWorkstation = context.workstation;
            window.activeShift = context.shift;
            window.activeGroup = context.group;
            window.activeUser = user.fullname.toUpperCase();
            window.activeRole = user.role;

            document.getElementById('login-overlay').style.display = 'none';
            const adminLink = document.querySelector('a[href="admin.html"]');
            if (adminLink) adminLink.style.display = 'none';
            
            appWrapper.classList.remove('hidden');
            initDashboard();
            loginForm.reset();
        } catch (err) {
            showToast('error', 'Login Error', 'Failed to connect to server');
        }
    });

    // Dummy block to overwrite the rest of the old logic
    if(false) {"""

script_js = script_js.replace(old_login_start, new_login)

with open('public/script.js', 'w', encoding='utf-8') as f:
    f.write(script_js)
