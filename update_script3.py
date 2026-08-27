import re

with open('public/admin.js', 'r', encoding='utf-8') as f:
    admin_js = f.read()

# 1. Inject Auth check
auth_check = """
    // --- Session Auth Check ---
    const sessionUser = JSON.parse(localStorage.getItem('sessionUser'));
    if (!sessionUser || sessionUser.role !== 'Admin') {
        alert('Unauthorized access. Please login as Admin.');
        window.location.href = 'index.html';
        return;
    }
    document.querySelector('.user-name').textContent = sessionUser.fullname;
"""
admin_js = admin_js.replace("document.addEventListener('DOMContentLoaded', () => {", "document.addEventListener('DOMContentLoaded', () => {\n" + auth_check)

# 2. Update initAdminCharts
old_chart_init = """    async function initAdminCharts() {
        if (dpuChartAdmin) dpuChartAdmin.destroy();
        if (drrChartAdmin) drrChartAdmin.destroy();
        
        const ctxDpu = document.getElementById('dpuChartAdmin')?.getContext('2d');
        const ctxDrr = document.getElementById('drrChartAdmin')?.getContext('2d');
        if (!ctxDpu || !ctxDrr) return;

        // Simulated data
        const labels = ['06:00', '08:00', '10:00', '12:00', '14:00'];
        const dpuData = [0.03, 0.05, 0.045, 0.040, 0.042];
        const drrData = [98.5, 96.0, 97.2, 98.0, 97.8];"""

new_chart_init = """    async function initAdminCharts() {
        if (dpuChartAdmin) dpuChartAdmin.destroy();
        if (drrChartAdmin) drrChartAdmin.destroy();
        
        const ctxDpu = document.getElementById('dpuChartAdmin')?.getContext('2d');
        const ctxDrr = document.getElementById('drrChartAdmin')?.getContext('2d');
        if (!ctxDpu || !ctxDrr) return;

        // Fetch KPI Data
        let kpiData = { unitCheck: 0, totalDefect: 0, dpu: 0, drr: 0, directRun: 0, notDirectRun: 0, openDefect: 0, closedDefect: 0 };
        try {
            const res = await fetch('/api/dashboard/kpi');
            kpiData = await res.json();
        } catch(e) {}
        
        // Update DOM elements (Assuming order matches HTML structure exactly)
        const kpiValues = document.querySelectorAll('#dashboard-view .kpi-value');
        if (kpiValues.length >= 8) {
            kpiValues[0].textContent = kpiData.unitCheck;
            kpiValues[1].textContent = kpiData.totalDefect;
            kpiValues[2].textContent = kpiData.dpu;
            kpiValues[3].textContent = kpiData.drr + '%';
            kpiValues[4].textContent = kpiData.directRun;
            kpiValues[5].textContent = kpiData.notDirectRun;
            kpiValues[6].textContent = kpiData.openDefect;
            kpiValues[7].textContent = kpiData.closedDefect;
        }

        // Empty chart arrays for now since we don't have historical points
        const labels = [];
        const dpuData = [];
        const drrData = [];"""

admin_js = admin_js.replace(old_chart_init, new_chart_init)

with open('public/admin.js', 'w', encoding='utf-8') as f:
    f.write(admin_js)

print("admin.js updated.")
