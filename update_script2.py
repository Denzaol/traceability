import re

with open('public/script.js', 'r', encoding='utf-8') as f:
    script_js = f.read()

# 1. Change sessionStorage to localStorage
script_js = script_js.replace("sessionStorage.setItem('sessionUser'", "localStorage.setItem('sessionUser'")
script_js = script_js.replace("sessionStorage.removeItem('sessionUser')", "localStorage.removeItem('sessionUser')")

# 2. Add master data fetching and session check to DOMContentLoaded
new_dom_content_loaded = """document.addEventListener('DOMContentLoaded', async () => {
    // Check session
    const sessionUser = JSON.parse(localStorage.getItem('sessionUser'));
    if (sessionUser) {
        document.getElementById('login-overlay').style.display = 'none';
        
        if (sessionUser.role !== 'Admin') {
            const adminLink = document.querySelector('a[href="admin.html"]');
            if (adminLink) adminLink.style.display = 'none';
        }
        
        activeUser = sessionUser.fullname;
        activeRole = sessionUser.role;
        activeShift = sessionUser.shift || '';
        activeGroup = sessionUser.group || '';
        activeStation = sessionUser.workstation || '';
        
        updateSystemInfo();
        initDashboard();
    } else {
        // Only load dropdowns if not logged in (to save time, or do it anyway)
        try {
            const [shiftsRes, groupsRes, stagesRes] = await Promise.all([
                fetch('/api/master/shifts'),
                fetch('/api/master/groups'),
                fetch('/api/master/stages')
            ]);
            
            const shifts = await shiftsRes.json();
            const groups = await groupsRes.json();
            const stages = await stagesRes.json();
            
            const shiftSelect = document.getElementById('shift');
            shifts.forEach(s => {
                if (s.active) shiftSelect.insertAdjacentHTML('beforeend', `<option value="${s.name}">${s.name}</option>`);
            });
            
            const groupSelect = document.getElementById('group');
            groups.forEach(g => {
                if (g.active) groupSelect.insertAdjacentHTML('beforeend', `<option value="${g.name}">${g.name}</option>`);
            });
            
            const stageSelect = document.getElementById('login-workstation');
            stages.forEach(s => {
                if (s.active) stageSelect.insertAdjacentHTML('beforeend', `<option value="${s.code}">${s.name}</option>`);
            });
        } catch(e) {
            console.error("Failed to load master data", e);
        }
    }
"""

script_js = script_js.replace("document.addEventListener('DOMContentLoaded', () => {", new_dom_content_loaded)

# 3. Add dynamic role check on username blur
username_event = """
document.getElementById('username').addEventListener('blur', async (e) => {
    const un = e.target.value.trim();
    if (un.length > 0) {
        try {
            const res = await fetch(`/api/auth/check-user?username=${un}`);
            const data = await res.json();
            
            const shiftEl = document.getElementById('shift');
            const groupEl = document.getElementById('group');
            const stationEl = document.getElementById('login-workstation');
            
            if (data.success && data.role === 'Admin') {
                shiftEl.disabled = true;
                groupEl.disabled = true;
                stationEl.disabled = true;
                shiftEl.value = "";
                groupEl.value = "";
                stationEl.value = "";
            } else {
                shiftEl.disabled = false;
                groupEl.disabled = false;
                stationEl.disabled = false;
            }
        } catch(err) {}
    }
});
"""
# Insert after loginForm definition
script_js = script_js.replace("const loginForm = document.getElementById('login-form');", "const loginForm = document.getElementById('login-form');\n" + username_event)


# 4. Modify loginForm submit logic to handle missing session info for admins
# Remove the old validation block in script.js (if it exists)
old_login_block = """            // Validate shift/group/station
            if (!shift || !group || !workstation) {
                showToast('error', 'Required', 'Shift, Group, and Station are required for Inspectors');
                return;
            }"""
script_js = script_js.replace(old_login_block, "")

# 5. Fix initCharts and animateCountUp to fetch from /api/dashboard/kpi
old_initCharts = """function initCharts() {
    const ctx = document.getElementById('defectChart').getContext('2d');
    
    // Simulate initial data
    const initialData = [12, 19, 3, 5, 2, 3, 9];
    const initialLabels = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00'];"""

new_initCharts = """async function initCharts() {
    const ctx = document.getElementById('defectChart').getContext('2d');
    
    // Fetch real data
    const initialData = [];
    const initialLabels = [];"""
script_js = script_js.replace(old_initCharts, new_initCharts)

old_animateCountUp = """function animateCountUp() {
    const kpiValues = document.querySelectorAll('#kpi-grid .kpi-value[data-count]');
    
    kpiValues.forEach(el => {
        const target = parseInt(el.getAttribute('data-count'));"""

new_animateCountUp = """async function animateCountUp() {
    const kpiValues = document.querySelectorAll('#kpi-grid .kpi-value[data-count]');
    
    // Fetch KPI data
    let kpiData = { unitCheck: 0, directRun: 0, notDirectRun: 0, drr: 0, openDefect: 0 };
    try {
        const res = await fetch('/api/dashboard/kpi');
        kpiData = await res.json();
    } catch(e) {}
    
    kpiValues[0].setAttribute('data-count', kpiData.unitCheck);
    kpiValues[1].setAttribute('data-count', kpiData.directRun);
    kpiValues[2].setAttribute('data-count', kpiData.notDirectRun);
    kpiValues[3].setAttribute('data-count', kpiData.drr); // Note: DRR might be float, but parsing as int for animation? Let's just use the value.
    
    kpiValues.forEach(el => {
        const target = parseFloat(el.getAttribute('data-count')) || 0;"""

script_js = script_js.replace(old_animateCountUp, new_animateCountUp)


with open('public/script.js', 'w', encoding='utf-8') as f:
    f.write(script_js)

print("script.js updated.")
