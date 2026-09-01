document.addEventListener('DOMContentLoaded', async () => {
    // Load Variants for the Inspection dropdown
    try {
        const variantsRes = await fetch('/api/master/variants');
        const variants = await variantsRes.json();
        const selectVariant = document.getElementById('select-variant');
        if (selectVariant) {
            variants.forEach(v => {
                if (v.active) selectVariant.insertAdjacentHTML('beforeend', `<option value="${v.code}">${v.name}</option>`);
            });
        }
    } catch(e) {
        console.error("Failed to load variants", e);
    }

    // Check session
    const sessionUser = JSON.parse(localStorage.getItem('sessionUser'));
    if (sessionUser) {
        if (sessionUser.role === 'Admin') {
            window.location.href = 'admin.html';
            return;
        }
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
        
        document.getElementById('app-wrapper').classList.remove('hidden');
        const dUser = document.getElementById('display-user');
        const dShift = document.getElementById('display-shift');
        const dGroup = document.getElementById('display-group');
        const dPos = document.getElementById('display-pos-header');
        
        if (dUser) dUser.textContent = activeUser.toUpperCase();
        if (dShift) dShift.textContent = activeShift;
        if (dGroup) dGroup.textContent = activeGroup;
        if (dPos) dPos.textContent = activeStation;
        initDashboard();
        pollShiftSettings(); // Start polling
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


    // ============================================================
    // TOAST NOTIFICATION SYSTEM
    // ============================================================
    const toastContainer = document.getElementById('toast-container');

    function showToast(type, title, message, duration = 4000) {
        const icons = { success: 'fa-check', error: 'fa-xmark', warning: 'fa-exclamation', info: 'fa-info' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon"><i class="fa-solid ${icons[type] || icons.info}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.closest('.toast').remove()"><i class="fa-solid fa-xmark"></i></button>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ============================================================
    // LOGIN SYSTEM
    // ============================================================
    const loginOverlay = document.getElementById('login-overlay');
    const appWrapper = document.getElementById('app-wrapper');
    const loginForm = document.getElementById('login-form');

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

    const logoutBtn = document.getElementById('logout-btn');
    const displayUser = document.getElementById('display-user');
    const displayShift = document.getElementById('display-shift');
    const displayGroup = document.getElementById('display-group');
    const displayPosHeader = document.getElementById('display-pos-header');
    const timeDisplay = document.getElementById('current-time');
    const pageTitleText = document.getElementById('page-title-text');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
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
            pollShiftSettings(); // Start polling
            loginForm.reset();
        } catch (err) {
            showToast('error', 'Login Error', 'Failed to connect to server');
        }
    });

    logoutBtn.addEventListener('click', () => {
        if (!confirm('End current shift session?')) return;
        localStorage.removeItem('sessionUser');
        appWrapper.classList.add('hidden');
        setTimeout(() => {
            window.location.reload();
        }, 400);
    });

    // ============================================================
    // LIVE CLOCK & POLLING
    // ============================================================
    function updateTime() {
        const now = new Date();
        timeDisplay.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }
    setInterval(updateTime, 1000);
    updateTime();

    async function pollShiftSettings() {
        if (!window.activeShift) return;
        try {
            const res = await fetch('/api/master/shifts');
            if (res.ok) {
                const shifts = await res.json();
                const myShift = shifts.find(s => s.name === window.activeShift);
                if (myShift) {
                    const shiftEndBadge = document.getElementById('display-shift-end');
                    if (shiftEndBadge) {
                        shiftEndBadge.style.display = 'inline-block';
                        let endStr = myShift.end;
                        if (myShift.overtime_hours > 0) {
                            // Calculate new end time
                            const [eh, em] = myShift.end.split(':').map(Number);
                            let newEh = eh + myShift.overtime_hours;
                            if (newEh >= 24) newEh -= 24;
                            endStr = `${String(newEh).padStart(2, '0')}:${String(em).padStart(2, '0')} (+${myShift.overtime_hours}h OT)`;
                            shiftEndBadge.style.background = 'var(--gradient-red)'; // Highlight if OT
                        } else {
                            shiftEndBadge.style.background = 'var(--gradient-amber)';
                        }
                        shiftEndBadge.innerHTML = `<i class="fa-solid fa-hourglass-end"></i> Ends: ${endStr}`;
                    }
                }
            }
        } catch(e) {}
    }
    // Poll every 60 seconds
    setInterval(pollShiftSettings, 60000);
    if(localStorage.getItem('sessionUser')) pollShiftSettings();

    // ============================================================
    // SPA NAVIGATION
    // ============================================================
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const viewSections = document.querySelectorAll('.view-section');

    const pageTitles = {
        'view-dashboard': 'Quality KPI Dashboard',
        'view-inspection': 'Inspection Station',
        'view-traceability': 'Traceability Search',
        'view-defect': 'Defect Management',
        'view-export': 'Export Data'
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            if (!targetId) return;

            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            viewSections.forEach(section => {
                section.classList.remove('active');
                section.style.display = 'none';
            });

            const target = document.getElementById(targetId);
            if (target) {
                target.style.display = 'block';
                // Trigger reflow
                void target.offsetWidth;
                target.classList.add('active');
            }

            if (pageTitleText && pageTitles[targetId]) {
                pageTitleText.textContent = pageTitles[targetId];
            }

            if (targetId === 'view-dashboard') initDashboard();
            if (targetId === 'view-defect') renderDefects();
        });
    });

    // ============================================================
    // DASHBOARD
    // ============================================================
    Chart.defaults.color = '#8b95b0';
    Chart.defaults.font.family = "'Inter', sans-serif";

    let dpuChartInstance = null;
    let drrChartInstance = null;

    function animateCountUp() {
        const kpiValues = document.querySelectorAll('#kpi-grid .kpi-value[data-count]');
        kpiValues.forEach(el => {
            const target = parseFloat(el.getAttribute('data-count'));
            const decimals = parseInt(el.getAttribute('data-decimal') || '0');
            const suffix = el.getAttribute('data-suffix') || '';
            const duration = 1200;
            const start = performance.now();

            function tick(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const ease = 1 - Math.pow(1 - progress, 3);
                const current = target * ease;

                if (decimals > 0) {
                    el.textContent = current.toFixed(decimals) + suffix;
                } else {
                    el.textContent = Math.floor(current).toLocaleString() + suffix;
                }

                if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        });
    }

    function initCharts() {
        if (dpuChartInstance) dpuChartInstance.destroy();
        if (drrChartInstance) drrChartInstance.destroy();

        const ctxDpu = document.getElementById('dpuChart')?.getContext('2d');
        const ctxDrr = document.getElementById('drrChart')?.getContext('2d');
        if (!ctxDpu || !ctxDrr) return;

        const gradDpu = ctxDpu.createLinearGradient(0, 0, 0, 300);
        gradDpu.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
        gradDpu.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

        const gradDrr = ctxDrr.createLinearGradient(0, 0, 0, 300);
        gradDrr.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
        gradDrr.addColorStop(1, 'rgba(34, 197, 94, 0.0)');

        const labels = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

        const chartOptions = (yMin, yMax) => ({
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 26, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    titleFont: { weight: '600' },
                    bodyFont: { size: 13 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true,
                    boxPadding: 4
                }
            },
            scales: {
                y: {
                    min: yMin, max: yMax,
                    grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
                    ticks: { font: { size: 11 }, padding: 8 },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 11 }, padding: 8 },
                    border: { display: false }
                }
            },
            animation: { duration: 1000, easing: 'easeOutQuart' }
        });

        dpuChartInstance = new Chart(ctxDpu, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'DPU',
                    data: [0.03, 0.04, 0.035, 0.05, 0.045, 0.06, 0.045, 0.045],
                    borderColor: '#f59e0b',
                    backgroundColor: gradDpu,
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0a0e1a',
                    pointBorderColor: '#f59e0b',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: chartOptions(0, undefined)
        });

        drrChartInstance = new Chart(ctxDrr, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'DRR (%)',
                    data: [99, 98.5, 99.2, 97.5, 98.0, 96.0, 97.2, 97.2],
                    borderColor: '#22c55e',
                    backgroundColor: gradDrr,
                    borderWidth: 2.5,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0a0e1a',
                    pointBorderColor: '#22c55e',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: chartOptions(90, 100)
        });
    }

    async function initDashboard() {
        // Get active period and filter values
        const activePeriod = document.querySelector('#period-tabs .tab-btn.active')?.dataset?.period || 'daily';
        const filterDate = document.getElementById('filter-date')?.value || new Date().toISOString().split('T')[0];
        const filterShift = document.getElementById('filter-shift')?.value || 'all';
        const filterGroup = document.getElementById('filter-group')?.value || 'all';

        // Fetch KPI data from API
        let kpiData = {};
        try {
            let params = `?period=${activePeriod}&date=${filterDate}`;
            if (filterShift && filterShift !== 'all') params += `&shift=${filterShift}`;
            if (filterGroup && filterGroup !== 'all') params += `&group=${filterGroup}`;

            const res = await fetch(`/api/dashboard/kpi${params}`);
            if (res.ok) kpiData = await res.json();
        } catch(e) { console.error('Dashboard fetch error:', e); }

        // Update KPI cards
        const kpiGrid = document.getElementById('kpi-grid');
        if (kpiGrid) {
            const setValue = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
            // Find and update kpi-values by their data attributes or direct content
            const kpiValues = kpiGrid.querySelectorAll('.kpi-value[data-count]');
            // Update data-count attributes for animation
            kpiValues.forEach(el => {
                const label = el.closest('.kpi-card')?.querySelector('h3')?.textContent?.trim();
                if (label === 'Unit Check') { el.setAttribute('data-count', kpiData.unitCheck || 0); }
                else if (label === 'Total Defect') { el.setAttribute('data-count', kpiData.totalDefect || 0); }
                else if (label === 'DPU') { el.setAttribute('data-count', kpiData.dpu || 0); el.setAttribute('data-decimal', '3'); }
                else if (label === 'DRR') { el.setAttribute('data-count', kpiData.drr || 0); el.setAttribute('data-decimal', '1'); el.setAttribute('data-suffix', '%'); }
                else if (label === 'Direct Run') { el.setAttribute('data-count', kpiData.directRun || 0); }
                else if (label === 'Not Direct Run') { el.setAttribute('data-count', kpiData.notDirectRun || 0); }
            });
        }

        animateCountUp();
        initCharts();
        loadDashboardComparisons(activePeriod, filterDate, filterShift, filterGroup);
        loadDashboardExceptions();
    }

    async function loadDashboardComparisons(period, date, shift, group) {
        // Shift Comparison
        try {
            const shiftsRes = await fetch('/api/master/shifts');
            if (shiftsRes.ok) {
                const shiftsData = await shiftsRes.json();
                const activeShifts = shiftsData.filter(s => s.active).slice(0, 2);
                const shiftTbody = document.getElementById('dash-shift-comparison');
                if (shiftTbody && activeShifts.length >= 2) {
                    const today = date || new Date().toISOString().split('T')[0];
                    let baseParams = `period=${period}&date=${today}`;
                    if (group && group !== 'all') baseParams += `&group=${group}`;
                    const [kpi1Res, kpi2Res] = await Promise.all([
                        fetch(`/api/dashboard/kpi?${baseParams}&shift=${activeShifts[0].name}`),
                        fetch(`/api/dashboard/kpi?${baseParams}&shift=${activeShifts[1].name}`)
                    ]);
                    const kpi1 = kpi1Res.ok ? await kpi1Res.json() : {};
                    const kpi2 = kpi2Res.ok ? await kpi2Res.json() : {};
                    const thead = shiftTbody.closest('table').querySelector('thead tr');
                    if (thead) thead.innerHTML = `<th>KPI</th><th>${activeShifts[0].name}</th><th>${activeShifts[1].name}</th>`;
                    shiftTbody.innerHTML = `
                        <tr><td>Unit Check</td><td>${kpi1.unitCheck||0}</td><td>${kpi2.unitCheck||0}</td></tr>
                        <tr><td>Total Defect</td><td>${kpi1.totalDefect||0}</td><td>${kpi2.totalDefect||0}</td></tr>
                        <tr><td>DPU</td><td>${Number(kpi1.dpu||0).toFixed(3)}</td><td>${Number(kpi2.dpu||0).toFixed(3)}</td></tr>
                        <tr><td>Direct Run</td><td>${kpi1.directRun||0}</td><td>${kpi2.directRun||0}</td></tr>
                        <tr><td>DRR</td><td style="color:var(--accent-green)">${Number(kpi1.drr||0).toFixed(1)}%</td><td style="color:var(--accent-amber)">${Number(kpi2.drr||0).toFixed(1)}%</td></tr>
                    `;
                }
            }
        } catch(e) { console.error('Shift comparison error:', e); }

        // Group Comparison
        try {
            const groupsRes = await fetch('/api/master/groups');
            if (groupsRes.ok) {
                const groupsData = await groupsRes.json();
                const activeGroups = groupsData.filter(g => g.active).slice(0, 2);
                const groupTbody = document.getElementById('dash-group-comparison');
                if (groupTbody && activeGroups.length >= 2) {
                    const today = date || new Date().toISOString().split('T')[0];
                    let baseParams = `period=${period}&date=${today}`;
                    if (shift && shift !== 'all') baseParams += `&shift=${shift}`;
                    const [kpi1Res, kpi2Res] = await Promise.all([
                        fetch(`/api/dashboard/kpi?${baseParams}&group=${activeGroups[0].name}`),
                        fetch(`/api/dashboard/kpi?${baseParams}&group=${activeGroups[1].name}`)
                    ]);
                    const kpi1 = kpi1Res.ok ? await kpi1Res.json() : {};
                    const kpi2 = kpi2Res.ok ? await kpi2Res.json() : {};
                    const thead = groupTbody.closest('table').querySelector('thead tr');
                    if (thead) thead.innerHTML = `<th>KPI</th><th>${activeGroups[0].name}</th><th>${activeGroups[1].name}</th>`;
                    groupTbody.innerHTML = `
                        <tr><td>Unit Check</td><td>${kpi1.unitCheck||0}</td><td>${kpi2.unitCheck||0}</td></tr>
                        <tr><td>Total Defect</td><td>${kpi1.totalDefect||0}</td><td>${kpi2.totalDefect||0}</td></tr>
                        <tr><td>DPU</td><td>${Number(kpi1.dpu||0).toFixed(3)}</td><td>${Number(kpi2.dpu||0).toFixed(3)}</td></tr>
                        <tr><td>Direct Run</td><td>${kpi1.directRun||0}</td><td>${kpi2.directRun||0}</td></tr>
                        <tr><td>DRR</td><td style="color:var(--accent-green)">${Number(kpi1.drr||0).toFixed(1)}%</td><td style="color:var(--accent-amber)">${Number(kpi2.drr||0).toFixed(1)}%</td></tr>
                    `;
                }
            }
        } catch(e) { console.error('Group comparison error:', e); }
    }

    async function loadDashboardExceptions() {
        const tbody = document.getElementById('dash-exception-tbody');
        if (!tbody) return;
        try {
            const res = await fetch('/api/defects?status=OPEN');
            if (res.ok) {
                const defects = await res.json();
                tbody.innerHTML = '';
                if (defects.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--text-muted);padding:20px;text-align:center;"><i class="fa-solid fa-check-circle" style="margin-right:6px;color:var(--accent-green);"></i> No open defects</td></tr>';
                } else {
                    defects.forEach(d => {
                        tbody.innerHTML += `<tr>
                            <td><span class="tag">${d.nik}</span></td>
                            <td>${d.description||'-'}</td>
                            <td>${d.pos||'-'}</td>
                            <td>${d.shift_name||'-'}</td>
                            <td>${d.group_name||'-'}</td>
                            <td>${d.inspector||'-'}</td>
                            <td><span class="status-badge error">OPEN</span></td>
                        </tr>`;
                    });
                }
            }
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="7" style="color:var(--text-muted);padding:20px;">Failed to load</td></tr>';
        }
    }

    // Period Tab Switching
    const periodTabs = document.getElementById('period-tabs');
    if (periodTabs) {
        periodTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                periodTabs.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                initDashboard(); // Re-fetch data with new period
                showToast('info', 'Period Changed', `Viewing ${e.target.textContent} data`);
            }
        });
    }

    // Dashboard Apply Filter Button
    const btnApplyFilter = document.getElementById('btn-apply-filter');
    if (btnApplyFilter) {
        btnApplyFilter.addEventListener('click', () => {
            initDashboard();
            showToast('info', 'Filter Applied', 'Dashboard data updated.');
        });
    }

    // ============================================================
    // INSPECTION — Sequential Scanning Workflow + Embedded Timer
    // ============================================================
    const selectVariant = document.getElementById('select-variant');
    const btnScan = document.getElementById('btn-scan');
    const nikInput = document.getElementById('nik-input');
    const inspectionForm = document.getElementById('inspection-form-container');
    const btnCancelInspection = document.getElementById('btn-cancel-inspection');
    const btnSubmitInspection = document.getElementById('btn-submit-inspection');
    const displayNik = document.getElementById('display-nik');
    const displayVariant = document.getElementById('display-variant');
    const displayPos = document.getElementById('display-pos');
    const componentScanList = document.getElementById('component-scan-list');
    const scanProgressBadge = document.getElementById('scan-progress-badge');
    const btnAddDefectNote = document.getElementById('btn-add-defect-note');

    let componentScannedCount = 0;
    let componentTotalCount = 0;
    let defectNoteCounter = 1;

    // Enable NIK input when variant is selected
    function checkContextSelection() {
        if (selectVariant && nikInput && btnScan) {
            if (selectVariant.value !== '') {
                nikInput.disabled = false;
                nikInput.removeAttribute('title');
                btnScan.disabled = false;
                btnScan.style.opacity = '1';
                btnScan.style.cursor = 'pointer';
                const stepNum = document.getElementById('step-nik-num');
                if (stepNum) { stepNum.style.background = 'var(--gradient-primary)'; stepNum.style.color = 'white'; }
            } else {
                nikInput.disabled = true;
                nikInput.title = 'Pilih Variant terlebih dahulu';
                btnScan.disabled = true;
                btnScan.style.opacity = '0.4';
                btnScan.style.cursor = 'not-allowed';
            }
        }
    }

    if (selectVariant) selectVariant.addEventListener('change', checkContextSelection);

    // Update Inspection Station badge info
    function updateInsBadges() {
        const bp = document.getElementById('ins-badge-pos');
        const bs = document.getElementById('ins-badge-shift');
        const bg = document.getElementById('ins-badge-group');
        if (bp) bp.textContent = window.activeWorkstation || '-';
        if (bs) bs.textContent = window.activeShift || '-';
        if (bg) bg.textContent = window.activeGroup || '-';
    }

    // Generate component scan inputs based on variant + stage
    async function renderComponentScanInputs(pos) {
        let stageComps = [];
        try {
            const response = await fetch(`/api/inspection/components?pos=${encodeURIComponent(pos)}`);
            if (response.ok) {
                stageComps = await response.json();
            }
        } catch(e) {
            console.error('Error fetching components:', e);
        }
        componentTotalCount = stageComps.length;
        componentScannedCount = 0;
        updateScanProgress();

        if (!componentScanList) return;
        componentScanList.innerHTML = '';

        stageComps.forEach((comp, idx) => {
            const stepNum = idx + 1;
            const card = document.createElement('div');
            card.className = 'glass-panel component-scan-card';
            card.id = `comp-card-${comp.id}`;
            card.style.cssText = 'padding: 16px 24px; margin-bottom: 8px; transition: all 0.3s ease; border-left: 3px solid rgba(255,255,255,0.06);';
            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="comp-step-num" style="width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--text-muted); flex-shrink: 0;">${stepNum}</span>
                    <div style="flex: 1;">
                        <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">${comp.name} <span style="color: var(--text-muted); font-weight: 400;">(${comp.code})</span></div>
                        <input type="text" class="comp-scan-input" id="comp-${comp.id}" data-comp-id="${comp.id}" data-comp-code="${comp.code}" data-comp-name="${comp.name}" data-index="${idx}" placeholder="Scan ${comp.name} barcode..." style="font-size: 14px; padding: 10px 14px;">
                    </div>
                    <div class="comp-check-icon" style="font-size: 18px; color: var(--text-muted);">
                        <i class="fa-regular fa-circle"></i>
                    </div>
                </div>
            `;
            componentScanList.appendChild(card);
        });

        // Wire up auto-advance and completion tracking
        const compInputs = componentScanList.querySelectorAll('.comp-scan-input');
        compInputs.forEach((input, idx) => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (input.value.trim() !== '') {
                        markComponentScanned(input, idx);
                        if (idx < compInputs.length - 1) {
                            compInputs[idx + 1].focus();
                        } else {
                            // Last component scanned — auto-stop timer
                            stopInsTimerAuto();
                        }
                    }
                }
            });
            input.addEventListener('blur', () => {
                if (input.value.trim() !== '' && !input.dataset.scanned) {
                    markComponentScanned(input, idx);
                    checkAllComponentsScanned();
                }
            });
        });

        // Auto-focus first input
        setTimeout(() => compInputs[0]?.focus(), 100);
    }

    function markComponentScanned(input, idx) {
        if (input.dataset.scanned) return;
        input.dataset.scanned = 'true';
        componentScannedCount++;
        updateScanProgress();

        const card = input.closest('.component-scan-card');
        if (card) {
            card.style.borderLeftColor = 'var(--accent-green)';
            const icon = card.querySelector('.comp-check-icon');
            if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check" style="color: var(--accent-green);"></i>';
            const stepNum = card.querySelector('.comp-step-num');
            if (stepNum) { stepNum.style.background = 'rgba(34, 197, 94, 0.15)'; stepNum.style.color = 'var(--accent-green)'; }
        }
    }

    function updateScanProgress() {
        if (scanProgressBadge) {
            scanProgressBadge.textContent = `${componentScannedCount} / ${componentTotalCount} Scanned`;
            if (componentScannedCount === componentTotalCount && componentTotalCount > 0) {
                scanProgressBadge.className = 'status-badge success';
            } else {
                scanProgressBadge.className = 'status-badge warning';
            }
        }
    }

    function checkAllComponentsScanned() {
        if (componentScannedCount >= componentTotalCount && componentTotalCount > 0) {
            stopInsTimerAuto();
        }
    }

    // Add Defect Note button
    if (btnAddDefectNote) {
        btnAddDefectNote.addEventListener('click', () => {
            defectNoteCounter++;
            const container = document.getElementById('defect-notes-container');
            if (!container) return;
            const row = document.createElement('div');
            row.className = 'defect-note-row';
            row.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start;';
            row.innerHTML = `
                <textarea id="defect-note-${defectNoteCounter}" placeholder="Describe defect..." style="flex: 1; min-height: 60px;"></textarea>
                <select id="defect-status-${defectNoteCounter}" style="width: 130px; padding: 11px 14px;">
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                </select>
                <button type="button" class="btn-ghost" style="width: auto; padding: 10px 12px; color: var(--accent-red);" onclick="this.closest('.defect-note-row').remove()">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;
            container.appendChild(row);
            row.querySelector('textarea').focus();
        });
    }

    // Scan NIK Button — starts timer + shows component scanning area
    if (btnScan) {
        btnScan.addEventListener('click', async () => {
            if (nikInput.value.trim() !== '') {
                const pos = window.activeWorkstation || 'Unknown POS';
                if (displayNik) displayNik.textContent = nikInput.value.trim();
                if (displayVariant) displayVariant.textContent = selectVariant.value;
                if (displayPos) displayPos.textContent = pos;

                // Show component scanning area
                inspectionForm.style.display = 'block';
                await renderComponentScanInputs(pos);

                // Reset defect notes
                defectNoteCounter = 1;
                const dnContainer = document.getElementById('defect-notes-container');
                if (dnContainer) {
                    dnContainer.innerHTML = `
                        <div class="defect-note-row" style="display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start;">
                            <textarea id="defect-note-1" placeholder="Describe defect... (e.g., Baut longgar pada bracket A)" style="flex: 1; min-height: 60px;"></textarea>
                            <select id="defect-status-1" style="width: 130px; padding: 11px 14px;">
                                <option value="OPEN">OPEN</option>
                                <option value="CLOSED">CLOSED</option>
                            </select>
                        </div>
                    `;
                }

                // AUTO-START cycle timer
                startInsTimer();

                showToast('info', 'Timer Started', `Scanning started for ${nikInput.value.trim()} — timer is running`);
            } else {
                showToast('warning', 'Invalid Input', 'Please enter a valid NIK');
            }
        });
    }

    if (nikInput) {
        nikInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); btnScan.click(); }
        });
    }

    if (btnCancelInspection) {
        btnCancelInspection.addEventListener('click', () => {
            stopInsTimerReset();
            inspectionForm.style.display = 'none';
            nikInput.value = '';
            if (displayNik) displayNik.textContent = '-';
            if (displayVariant) displayVariant.textContent = '-';
            if (displayPos) displayPos.textContent = '-';
        });
    }

    if (btnSubmitInspection) {
        btnSubmitInspection.addEventListener('click', async () => {
            // Validate all component inputs
            const compInputs = document.querySelectorAll('#component-scan-list .comp-scan-input');
            let scannedParts = [];
            for (let i = 0; i < compInputs.length; i++) {
                if (compInputs[i].value.trim() === '') {
                    showToast('warning', 'Missing Scan', `Please scan all components before submitting.`);
                    compInputs[i].focus();
                    return;
                }
                
                // We need to extract the component name and code. 
                // The structure is: input -> parent -> parent -> previousSibling text? 
                // Wait, renderComponentScanInputs adds data-comp-id but not code/name to the input.
                // But we can get it from the label. The label is in the previous sibling div or just sibling div.
                // Let's modify renderComponentScanInputs later to inject data-comp-code and data-comp-name.
                scannedParts.push({
                    id: compInputs[i].dataset.compId,
                    code: compInputs[i].dataset.compCode,
                    name: compInputs[i].dataset.compName,
                    partNo: compInputs[i].value.trim()
                });
            }

            // Stop timer if still running
            stopInsTimerAuto();

            // Collect defect notes
            const defectRows = document.querySelectorAll('.defect-note-row');
            let defectsCollected = [];
            defectRows.forEach(row => {
                const textarea = row.querySelector('textarea');
                const statusSel = row.querySelector('select');
                if (textarea && textarea.value.trim() !== '') {
                    defectsCollected.push({
                        desc: textarea.value.trim(),
                        status: statusSel ? statusSel.value : 'OPEN'
                    });
                }
            });            // Prepare defects payload
            const defectsPayload = defectsCollected.map((d, index) => ({
                id: `DEF-${Date.now()}-${index}`,
                nik: nikInput.value.trim(),
                desc: d.desc,
                category: 'Inspector Note',
                pos: window.activeWorkstation || '-',
                shift: window.activeShift || '-',
                group: window.activeGroup || '-',
                inspector: window.activeUser || '-',
                status: d.status
            }));

            // Save cycle time record
            const cycleRecord = {
                nik: nikInput.value.trim(),
                variant: selectVariant.value,
                pos: window.activeWorkstation || '-',
                shift: window.activeShift || '-',
                group: window.activeGroup || '-',
                inspector: window.activeUser || '-',
                startTime: insTimerStartTime ? insTimerStartTime.toLocaleTimeString('en-US', {hour12:false}) : '-',
                endTime: new Date().toLocaleTimeString('en-US', {hour12:false}),
                cycleSec: insTimerSeconds,
                pauseSec: insPauseDuration,
                status: insTimerSeconds <= TAKT_TIME ? 'OK' : 'OVER',
                date: new Date().toLocaleDateString('en-CA'),
                partNo: '-' // kept for legacy
            };

            try {
                const response = await fetch('/api/inspection/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cycleRecord, defects: defectsPayload, components: scannedParts })
                });

                if (response.ok) {
                    if (defectsPayload.length > 0) {
                        showToast('warning', `${defectsPayload.length} Defect(s) Recorded`, `Unit ${nikInput.value.trim()} has ${defectsPayload.length} defect note(s).`);
                    } else {
                        showToast('success', 'No Defect', `Unit ${nikInput.value.trim()} — no defect found. Direct Run candidate.`);
                    }
                    showToast('success', 'Inspection Submitted', `Unit ${nikInput.value.trim()} — cycle: ${insTimerSeconds}s, components: ${componentScannedCount}/${componentTotalCount}`);
                } else {
                    const err = await response.json();
                    showToast('error', 'Submission Failed', err.message);
                }
            } catch (error) {
                console.error('Error submitting inspection:', error);
                showToast('error', 'Submission Failed', 'Failed to submit inspection data');
            }

            // Reset form
            stopInsTimerReset();
            inspectionForm.style.display = 'none';
            nikInput.value = '';
            if (displayNik) displayNik.textContent = '-';
            if (displayVariant) displayVariant.textContent = '-';
            if (displayPos) displayPos.textContent = '-';
            nikInput.focus();
        });
    }

    // ============================================================
    // TRACEABILITY SEARCH
    // ============================================================
    const btnTraceSearch = document.getElementById('btn-trace-search');
    const traceNikInput = document.getElementById('trace-nik-input');
    const traceResults = document.getElementById('trace-results');
    const traceEmpty = document.getElementById('trace-empty');

    if (btnTraceSearch) {
        // Autocomplete functionality
        let debounceTimer;
        const suggestionsList = document.getElementById('trace-suggestions');
        
        if (traceNikInput && suggestionsList) {
            traceNikInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                const q = e.target.value.trim();
                
                if (q.length < 2) {
                    suggestionsList.style.display = 'none';
                    return;
                }

                debounceTimer = setTimeout(async () => {
                    try {
                        const res = await fetch(`/api/traceability/suggestions?q=${encodeURIComponent(q)}`);
                        const suggestions = await res.json();
                        
                        if (suggestions.length > 0) {
                            suggestionsList.innerHTML = suggestions.map(s => `<li>${s}</li>`).join('');
                            suggestionsList.style.display = 'block';
                            
                            // Click suggestion
                            suggestionsList.querySelectorAll('li').forEach(li => {
                                li.addEventListener('click', () => {
                                    traceNikInput.value = li.textContent;
                                    suggestionsList.style.display = 'none';
                                    btnTraceSearch.click(); // Trigger search
                                });
                            });
                        } else {
                            suggestionsList.style.display = 'none';
                        }
                    } catch (err) {
                        console.error('Failed to fetch suggestions:', err);
                    }
                }, 300);
            });

            // Hide suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (e.target !== traceNikInput && e.target !== suggestionsList) {
                    suggestionsList.style.display = 'none';
                }
            });
        }

        btnTraceSearch.addEventListener('click', async () => {
            const nik = traceNikInput.value.trim();
            if (!nik) {
                showToast('warning', 'Empty Input', 'Please enter a NIK to search');
                return;
            }

            try {
                const response = await fetch(`/api/traceability/search/${encodeURIComponent(nik)}`);
                const data = await response.json();
                
                if (!response.ok || !data.success || (data.cycleRecords.length === 0 && data.defects.length === 0)) {
                    showToast('warning', 'Not Found', `No data found for NIK: ${nik}`);
                    return;
                }

                // Populate Header
                document.getElementById('trace-nik').textContent = data.nik;
                document.getElementById('trace-variant').textContent = data.variant || '-';
                document.getElementById('trace-engine').textContent = 'N/A';
                document.getElementById('trace-direct-run').textContent = data.defects.length === 0 ? 'YES' : 'NO';

                // Populate Inspection History
                const insTbody = document.getElementById('trace-inspection-tbody');
                insTbody.innerHTML = '';
                data.cycleRecords.forEach(ins => {
                    const badgeClass = ins.status === 'OK' ? 'success' : 'error';
                    const dateStr = ins.date ? new Date(ins.date).toLocaleDateString() : '-';
                    
                    let componentsHtml = '-';
                    if (ins.components && ins.components.length > 0) {
                        componentsHtml = ins.components.map(c => `${c.component_name}: <strong>${c.part_no}</strong>`).join('<br>');
                    } else if (ins.part_no && ins.part_no !== '-') {
                        componentsHtml = ins.part_no;
                    }

                    insTbody.innerHTML += `
                        <tr>
                            <td>${dateStr}</td>
                            <td>${ins.pos || '-'}</td>
                            <td>${ins.inspector || '-'}</td>
                            <td>${ins.shift || '-'}</td>
                            <td>${ins.group_name || '-'}</td>
                            <td style="font-size: 11px; line-height: 1.4;">${componentsHtml}</td>
                            <td><span class="status-badge ${badgeClass}">${ins.status}</span></td>
                        </tr>
                    `;
                });
                if (data.cycleRecords.length === 0) {
                    insTbody.innerHTML = '<tr><td colspan="7" style="color:var(--text-muted);padding:16px;">No inspection records</td></tr>';
                }

                // Populate Defect History
                const defTbody = document.getElementById('trace-defect-tbody');
                defTbody.innerHTML = '';
                data.defects.forEach(def => {
                    const badgeClass = def.status === 'CLOSED' ? 'success' : 'error';
                    defTbody.innerHTML += `
                        <tr>
                            <td>${def.description || '-'}</td>
                            <td>${def.category || '-'}</td>
                            <td>${def.stage || '-'}</td>
                            <td><span class="status-badge ${badgeClass}">${def.status}</span></td>
                            <td>-</td>
                            <td>${def.resolved_at ? new Date(def.resolved_at).toLocaleString() : '-'}</td>
                        </tr>
                    `;
                });
                if (data.defects.length === 0) {
                    defTbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted);padding:16px;">No defects recorded</td></tr>';
                }

                traceEmpty.style.display = 'none';
                traceResults.style.display = 'block';
                showToast('info', 'Unit Found', `Showing traceability data for ${nik}`);
            } catch (error) {
                console.error('Error tracing NIK:', error);
                showToast('error', 'Error', 'Failed to fetch traceability data');
            }
        });

        traceNikInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); btnTraceSearch.click(); }
        });
    }

    // ============================================================
    // DEFECT MANAGEMENT
    // ============================================================
    async function renderDefects(filter = 'all') {
        const tbody = document.getElementById('defect-table-body');
        if (!tbody) return;

        try {
            const response = await fetch(`/api/defects?status=${filter}`);
            const filtered = await response.json();
            
            tbody.innerHTML = '';

            filtered.forEach(d => {
                const statusBadge = d.status === 'OPEN'
                    ? '<span class="status-badge error">OPEN</span>'
                    : '<span class="status-badge success">CLOSED</span>';

                const actionBtn = d.status === 'OPEN'
                    ? `<button class="btn-primary small success" onclick="resolveDefect('${d.id}')" style="padding: 5px 12px; font-size: 11px;"><i class="fa-solid fa-wrench"></i> Resolve</button>`
                    : '<span style="color: var(--text-muted); font-size: 12px;">Resolved</span>';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="tag">${d.id}</span></td>
                    <td><span class="tag">${d.nik}</span></td>
                    <td>${d.description}</td>
                    <td>${d.category}</td>
                    <td>${d.pos}</td>
                    <td>${d.shift_name}</td>
                    <td>${d.group_name}</td>
                    <td>${statusBadge}</td>
                    <td>${actionBtn}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch(e) {
            console.error('Error fetching defects:', e);
        }
    }

    window.resolveDefect = async function (id) {
        try {
            const response = await fetch(`/api/defects/${id}/resolve`, { method: 'PUT' });
            if (response.ok) {
                const currentTab = document.querySelector('#defect-status-tabs .tab-btn.active');
                const filter = currentTab ? currentTab.getAttribute('data-status') : 'all';
                renderDefects(filter);
                showToast('success', 'Defect Resolved', `${id} has been closed.`);
            }
        } catch(e) {
            console.error('Error resolving defect:', e);
        }
    };

    // Defect Status Tabs
    const defectStatusTabs = document.getElementById('defect-status-tabs');
    if (defectStatusTabs) {
        defectStatusTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                defectStatusTabs.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                renderDefects(e.target.getAttribute('data-status'));
            }
        });
    }

    // ============================================================
    // EMBEDDED CYCLE TIMER (in Inspection view)
    // ============================================================
    const TAKT_TIME = 180; // seconds
    let insTimerInterval = null;
    let insTimerSeconds = 0;
    let insTimerRunning = false;
    let insTimerStartTime = null;
    let insPauseStart = null;
    let insPauseDuration = 0;

    const insTimerDisplay = document.getElementById('ins-timer-display');
    const btnInsPause = document.getElementById('btn-ins-timer-pause');
    const btnInsResume = document.getElementById('btn-ins-timer-resume');
    const insTaktFill = document.getElementById('ins-takt-fill');
    const insTaktLabel = document.getElementById('ins-takt-label');

    function formatTimer(seconds) {
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function updateInsTaktIndicator() {
        if (!insTaktFill || !insTaktLabel) return;
        const pct = Math.min((insTimerSeconds / TAKT_TIME) * 100, 100);
        insTaktFill.style.width = pct + '%';
        insTaktLabel.textContent = `${insTimerSeconds} / ${TAKT_TIME}s`;

        insTaktFill.classList.remove('warning', 'danger');
        if (pct > 100) insTaktFill.classList.add('danger');
        else if (pct > 80) insTaktFill.classList.add('warning');
    }

    function startInsTimer() {
        if (insTimerRunning) return;
        insTimerRunning = true;
        insTimerStartTime = new Date();
        insTimerSeconds = 0;
        insPauseDuration = 0;
        if (insTimerDisplay) insTimerDisplay.className = 'timer-display running';
        if (btnInsPause) btnInsPause.style.display = 'inline-flex';
        if (btnInsResume) btnInsResume.style.display = 'none';

        insTimerInterval = setInterval(() => {
            insTimerSeconds++;
            if (insTimerDisplay) insTimerDisplay.textContent = formatTimer(insTimerSeconds);
            updateInsTaktIndicator();
        }, 1000);
    }

    function stopInsTimerAuto() {
        if (!insTimerRunning && !insPauseStart) return;
        clearInterval(insTimerInterval);
        insTimerRunning = false;
        if (insTimerDisplay) insTimerDisplay.className = 'timer-display stopped';
        if (btnInsPause) btnInsPause.style.display = 'none';
        if (btnInsResume) btnInsResume.style.display = 'none';

        const status = insTimerSeconds <= TAKT_TIME ? 'OK' : 'OVER';
        showToast(status === 'OK' ? 'success' : 'warning', 'Cycle Complete', `Cycle: ${insTimerSeconds}s / Takt: ${TAKT_TIME}s`);
    }

    function stopInsTimerReset() {
        clearInterval(insTimerInterval);
        insTimerRunning = false;
        insTimerSeconds = 0;
        insPauseDuration = 0;
        insPauseStart = null;
        if (insTimerDisplay) {
            insTimerDisplay.className = 'timer-display stopped';
            insTimerDisplay.textContent = '00:00:00';
        }
        updateInsTaktIndicator();
        if (btnInsPause) btnInsPause.style.display = 'none';
        if (btnInsResume) btnInsResume.style.display = 'none';
    }

    // Pause (for break time)
    if (btnInsPause) {
        btnInsPause.addEventListener('click', () => {
            if (!insTimerRunning) return;
            clearInterval(insTimerInterval);
            insTimerRunning = false;
            insPauseStart = new Date();
            if (insTimerDisplay) insTimerDisplay.className = 'timer-display paused';
            btnInsPause.style.display = 'none';
            if (btnInsResume) btnInsResume.style.display = 'inline-flex';
        });
    }

    // Resume after break
    if (btnInsResume) {
        btnInsResume.addEventListener('click', () => {
            if (insTimerRunning) return;
            if (insPauseStart) {
                insPauseDuration += Math.round((new Date() - insPauseStart) / 1000);
                insPauseStart = null;
            }
            insTimerRunning = true;
            if (insTimerDisplay) insTimerDisplay.className = 'timer-display running';
            if (btnInsPause) btnInsPause.style.display = 'inline-flex';
            btnInsResume.style.display = 'none';

            insTimerInterval = setInterval(() => {
                insTimerSeconds++;
                if (insTimerDisplay) insTimerDisplay.textContent = formatTimer(insTimerSeconds);
                updateInsTaktIndicator();
            }, 1000);
        });
    }

    // Update inspection badges when navigation changes to inspection view
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.getAttribute('data-target') === 'view-inspection') {
                updateInsBadges();
            }
        });
    });

    // ============================================================
    // EXPORT DATA
    // ============================================================
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnExportExcel = document.getElementById('btn-export-excel');

    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            const type = document.getElementById('export-type')?.value || 'cycle';
            const url = type === 'defects' ? '/api/export/defects' : '/api/export/cycle';
            const a = document.createElement('a');
            a.href = url;
            a.download = type === 'defects' ? 'defects_export.csv' : 'cycle_records_export.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('success', 'CSV Export', `${type} data download started.`);
        });
    }

    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', () => {
            const type = document.getElementById('export-type')?.value || 'cycle';
            const url = type === 'defects' ? '/api/export/defects' : '/api/export/cycle';
            const a = document.createElement('a');
            a.href = url;
            a.download = type === 'defects' ? 'defects_export.csv' : 'cycle_records_export.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('success', 'Excel Export', `${type} data download started (CSV format, opens in Excel).`);
        });
    }

    // Initialize defect list
    renderDefects();
});
