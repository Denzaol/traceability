document.addEventListener('DOMContentLoaded', () => {

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
    const logoutBtn = document.getElementById('logout-btn');
    const displayUser = document.getElementById('display-user');
    const displayShift = document.getElementById('display-shift');
    const displayGroup = document.getElementById('display-group');
    const displayPosHeader = document.getElementById('display-pos-header');
    const timeDisplay = document.getElementById('current-time');
    const pageTitleText = document.getElementById('page-title-text');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const shift = document.getElementById('shift').value;
        const group = document.getElementById('group').value;
        const workstation = document.getElementById('login-workstation').value;

        if (username && shift && group && workstation) {
            displayUser.textContent = username.toUpperCase();
            displayShift.textContent = shift;
            displayGroup.textContent = group;
            if (displayPosHeader) displayPosHeader.textContent = workstation;
            window.activeWorkstation = workstation;
            window.activeShift = shift;
            window.activeGroup = group;
            window.activeUser = username.toUpperCase();

            loginOverlay.classList.remove('active');
            setTimeout(() => {
                appWrapper.classList.remove('hidden');
                initDashboard();
            }, 400);

            showToast('success', 'Login Successful', `Welcome ${username.toUpperCase()} — ${shift} / ${group}`);
        }
    });

    logoutBtn.addEventListener('click', () => {
        if (!confirm('End current shift session?')) return;
        appWrapper.classList.add('hidden');
        setTimeout(() => {
            loginOverlay.classList.add('active');
            loginForm.reset();
        }, 400);
    });

    // ============================================================
    // LIVE CLOCK
    // ============================================================
    function updateTime() {
        const now = new Date();
        timeDisplay.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }
    setInterval(updateTime, 1000);
    updateTime();

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
        'view-cycle-timer': 'Cycle Timer',
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

    function initDashboard() {
        animateCountUp();
        initCharts();
    }

    // Period Tab Switching
    const periodTabs = document.getElementById('period-tabs');
    if (periodTabs) {
        periodTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                periodTabs.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                showToast('info', 'Period Changed', `Viewing ${e.target.textContent} data`);
            }
        });
    }

    // ============================================================
    // INSPECTION
    // ============================================================
    const selectVariant = document.getElementById('select-variant');
    const btnScan = document.getElementById('btn-scan');
    const nikInput = document.getElementById('nik-input');
    const inspectionForm = document.getElementById('inspection-form-container');
    const inspectionTbody = document.getElementById('inspection-items-tbody');
    const btnCancelInspection = document.getElementById('btn-cancel-inspection');
    const btnSubmitInspection = document.getElementById('btn-submit-inspection');
    const displayNik = document.getElementById('display-nik');
    const displayVariant = document.getElementById('display-variant');
    const displayPos = document.getElementById('display-pos');
    const componentDataContainer = document.getElementById('component-data-container');

    function updateStepIndicator(step) {
        const steps = document.querySelectorAll('#step-indicator .step');
        steps.forEach((s, i) => {
            s.classList.remove('active', 'completed');
            if (i + 1 < step) s.classList.add('completed');
            else if (i + 1 === step) s.classList.add('active');
        });
    }

    function checkContextSelection() {
        if (selectVariant && nikInput && btnScan) {
            if (selectVariant.value !== '') {
                nikInput.disabled = false;
                nikInput.removeAttribute('title');
                btnScan.disabled = false;
                btnScan.style.opacity = '1';
                btnScan.style.cursor = 'pointer';
                updateStepIndicator(2);
            } else {
                nikInput.disabled = true;
                nikInput.title = 'Pilih Variant terlebih dahulu';
                btnScan.disabled = true;
                btnScan.style.opacity = '0.4';
                btnScan.style.cursor = 'not-allowed';
                updateStepIndicator(1);
            }
        }
    }

    if (selectVariant) selectVariant.addEventListener('change', checkContextSelection);

    function renderChecklist(pos) {
        let mockChecklist = [
            { code: 'CHK-01', desc: 'Visual Check Panel A' },
            { code: 'CHK-02', desc: 'Torque Check Bolt M6' }
        ];

        if (pos === 'Stage 13') {
            mockChecklist.push({ code: 'CHK-03', desc: 'Label Placement' });
            mockChecklist.push({ code: 'CHK-04', desc: 'Engine Pairing Check' });
        } else {
            mockChecklist.push({ code: 'CHK-03', desc: 'Connector Tightness' });
        }

        inspectionTbody.innerHTML = '';
        mockChecklist.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="tag">${item.code}</span></td>
                <td>${item.desc}</td>
                <td>
                    <div class="btn-group">
                        <button type="button" class="btn-toggle pass" data-index="${index}">PASS</button>
                        <button type="button" class="btn-toggle fail" data-index="${index}">FAIL</button>
                    </div>
                </td>
                <td>
                    <input type="text" class="defect-input" id="defect-input-${index}" placeholder="Describe defect...">
                </td>
            `;
            inspectionTbody.appendChild(tr);
        });

        // Toggle listeners
        inspectionTbody.querySelectorAll('.btn-toggle').forEach(toggle => {
            toggle.addEventListener('click', function () {
                const isPass = this.classList.contains('pass');
                const idx = this.getAttribute('data-index');
                const parentGroup = this.closest('.btn-group');
                const defectInput = document.getElementById(`defect-input-${idx}`);

                parentGroup.querySelectorAll('.btn-toggle').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                if (!isPass) {
                    defectInput.classList.add('active');
                    defectInput.focus();
                } else {
                    defectInput.classList.remove('active');
                    defectInput.value = '';
                }
            });
        });
    }

    if (btnScan) {
        btnScan.addEventListener('click', () => {
            if (nikInput.value.trim() !== '') {
                const pos = window.activeWorkstation || 'Unknown POS';
                if (displayNik) displayNik.textContent = nikInput.value.trim();
                if (displayVariant) displayVariant.textContent = selectVariant.value;
                if (displayPos) displayPos.textContent = pos;

                // Component Data for Stage 13
                if (pos === 'Stage 13') {
                    componentDataContainer.style.display = 'block';
                    componentDataContainer.innerHTML = `
                        <div class="glass-panel" style="padding: 22px; border-left: 3px solid var(--accent-amber);">
                            <h3 style="margin-bottom: 14px; font-size: 13px; font-weight: 700;">
                                <i class="fa-solid fa-gears"></i> Traceability Part Input
                            </h3>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label for="engine-no">Engine Number</label>
                                <input type="text" id="engine-no" placeholder="Scan Engine Barcode" required style="font-size: 15px; padding: 13px;">
                            </div>
                        </div>
                    `;
                } else {
                    componentDataContainer.style.display = 'none';
                    componentDataContainer.innerHTML = '';
                }

                inspectionForm.style.display = 'block';
                renderChecklist(pos);
                updateStepIndicator(3);
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
            inspectionForm.style.display = 'none';
            nikInput.value = '';
            if (displayNik) displayNik.textContent = '-';
            updateStepIndicator(2);
        });
    }

    if (btnSubmitInspection) {
        btnSubmitInspection.addEventListener('click', () => {
            // Validate engine number for Stage 13
            if (window.activeWorkstation === 'Stage 13') {
                const engineInput = document.getElementById('engine-no');
                if (!engineInput || engineInput.value.trim() === '') {
                    showToast('warning', 'Missing Data', 'Please enter the Engine Number before submitting.');
                    return;
                }
            }

            // Validate all checklist items
            const groups = document.querySelectorAll('.inspection-table .btn-group');
            let allChecked = true;
            groups.forEach(group => {
                if (!group.querySelector('.active')) allChecked = false;
            });

            if (!allChecked) {
                showToast('warning', 'Incomplete', 'Please complete all inspection items before submitting.');
                return;
            }

            showToast('success', 'Inspection Submitted', `Unit ${nikInput.value} inspection completed successfully.`);
            inspectionForm.style.display = 'none';
            nikInput.value = '';
            if (displayNik) displayNik.textContent = '-';
            updateStepIndicator(2);
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
        btnTraceSearch.addEventListener('click', () => {
            const nik = traceNikInput.value.trim();
            if (!nik) {
                showToast('warning', 'Empty Input', 'Please enter a NIK to search');
                return;
            }

            // Mock Data
            document.getElementById('trace-nik').textContent = nik;
            document.getElementById('trace-variant').textContent = 'N-Series X';
            document.getElementById('trace-engine').textContent = 'ENG-2026-' + nik.split('-').pop();
            document.getElementById('trace-direct-run').textContent = 'YES';

            // Mock Inspection History
            document.getElementById('trace-inspection-tbody').innerHTML = `
                <tr><td>2026-08-26 08:15</td><td>Stage 5</td><td>INS001</td><td>Shift 1</td><td>Group A</td><td><span class="status-badge success">PASS</span></td></tr>
                <tr><td>2026-08-26 09:30</td><td>Stage 13</td><td>INS001</td><td>Shift 1</td><td>Group A</td><td><span class="status-badge success">PASS</span></td></tr>
            `;

            // Mock Defect History
            document.getElementById('trace-defect-tbody').innerHTML = `
                <tr><td>Label Miring</td><td>Cosmetic</td><td>Stage 5</td><td><span class="status-badge success">CLOSED</span></td><td>INS002</td><td>2026-08-26 08:45</td></tr>
            `;

            traceEmpty.style.display = 'none';
            traceResults.style.display = 'block';
            showToast('info', 'Unit Found', `Showing traceability data for ${nik}`);
        });

        traceNikInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); btnTraceSearch.click(); }
        });
    }

    // ============================================================
    // DEFECT MANAGEMENT
    // ============================================================
    let defects = [
        { id: 'DEF-001', nik: 'NIK-001', desc: 'Baut longgar', category: 'Mechanical', pos: 'Stage 5', shift: 'Shift 1', group: 'Group A', status: 'OPEN' },
        { id: 'DEF-002', nik: 'NIK-014', desc: 'Kabel Terjepit', category: 'Electrical', pos: 'Stage 3', shift: 'Shift 1', group: 'Group A', status: 'OPEN' },
        { id: 'DEF-003', nik: 'NIK-042', desc: 'Label Miring', category: 'Cosmetic', pos: 'Stage 5', shift: 'Shift 1', group: 'Group A', status: 'CLOSED' },
        { id: 'DEF-004', nik: 'NIK-089', desc: 'Torsi Kurang', category: 'Mechanical', pos: 'Stage 10', shift: 'Shift 2', group: 'Group B', status: 'OPEN' },
        { id: 'DEF-005', nik: 'NIK-023', desc: 'Seal Bocor', category: 'Quality', pos: 'Stage 13', shift: 'Shift 2', group: 'Group B', status: 'CLOSED' }
    ];

    function renderDefects(filter = 'all') {
        const tbody = document.getElementById('defect-table-body');
        if (!tbody) return;

        const filtered = filter === 'all' ? defects : defects.filter(d => d.status === filter);
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
                <td>${d.desc}</td>
                <td>${d.category}</td>
                <td>${d.pos}</td>
                <td>${d.shift}</td>
                <td>${d.group}</td>
                <td>${statusBadge}</td>
                <td>${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.resolveDefect = function (id) {
        const defect = defects.find(d => d.id === id);
        if (defect) {
            defect.status = 'CLOSED';
            renderDefects();
            showToast('success', 'Defect Resolved', `${id} — ${defect.desc} has been closed.`);
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
    // CYCLE TIMER
    // ============================================================
    let timerInterval = null;
    let timerSeconds = 0;
    let timerRunning = false;
    const TAKT_TIME = 180; // seconds

    const timerDisplay = document.getElementById('timer-display');
    const btnStart = document.getElementById('btn-timer-start');
    const btnPause = document.getElementById('btn-timer-pause');
    const btnStop = document.getElementById('btn-timer-stop');
    const taktFill = document.getElementById('takt-fill');
    const taktLabel = document.getElementById('takt-label');

    function formatTimer(seconds) {
        const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function updateTaktIndicator() {
        const pct = Math.min((timerSeconds / TAKT_TIME) * 100, 100);
        taktFill.style.width = pct + '%';
        taktLabel.textContent = `${timerSeconds} / ${TAKT_TIME}s`;

        taktFill.classList.remove('warning', 'danger');
        if (pct > 100) taktFill.classList.add('danger');
        else if (pct > 80) taktFill.classList.add('warning');
    }

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            timerRunning = true;
            timerDisplay.className = 'timer-display running';
            btnStart.style.display = 'none';
            btnPause.style.display = 'inline-flex';
            btnStop.style.display = 'inline-flex';

            timerInterval = setInterval(() => {
                timerSeconds++;
                timerDisplay.textContent = formatTimer(timerSeconds);
                updateTaktIndicator();
            }, 1000);
        });
    }

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            if (timerRunning) {
                clearInterval(timerInterval);
                timerRunning = false;
                timerDisplay.className = 'timer-display paused';
                btnPause.innerHTML = '<i class="fa-solid fa-play"></i> Resume';
                btnPause.style.background = 'var(--gradient-success)';
            } else {
                timerRunning = true;
                timerDisplay.className = 'timer-display running';
                btnPause.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
                btnPause.style.background = 'var(--gradient-amber)';
                timerInterval = setInterval(() => {
                    timerSeconds++;
                    timerDisplay.textContent = formatTimer(timerSeconds);
                    updateTaktIndicator();
                }, 1000);
            }
        });
    }

    if (btnStop) {
        btnStop.addEventListener('click', () => {
            clearInterval(timerInterval);
            timerRunning = false;

            const status = timerSeconds <= TAKT_TIME ? 'OK' : 'OVER';
            const statusBadge = status === 'OK'
                ? '<span class="status-badge success">OK</span>'
                : '<span class="status-badge warning">OVER</span>';

            showToast(status === 'OK' ? 'success' : 'warning', 'Cycle Complete', `Cycle time: ${timerSeconds}s (Takt: ${TAKT_TIME}s)`);

            timerDisplay.className = 'timer-display stopped';
            timerDisplay.textContent = '00:00:00';
            timerSeconds = 0;
            updateTaktIndicator();

            btnStart.style.display = 'inline-flex';
            btnPause.style.display = 'none';
            btnStop.style.display = 'none';
            btnPause.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
            btnPause.style.background = 'var(--gradient-amber)';
        });
    }

    // ============================================================
    // EXPORT DATA
    // ============================================================
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnExportExcel = document.getElementById('btn-export-excel');

    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            const type = document.getElementById('export-type').value;
            showToast('success', 'CSV Export', `${type} data exported as CSV successfully.`);
        });
    }

    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', () => {
            const type = document.getElementById('export-type').value;
            showToast('success', 'Excel Export', `${type} data exported as Excel successfully.`);
        });
    }

    // ============================================================
    // FILTER APPLY
    // ============================================================
    const btnApplyFilter = document.getElementById('btn-apply-filter');
    if (btnApplyFilter) {
        btnApplyFilter.addEventListener('click', () => {
            showToast('info', 'Filter Applied', 'Dashboard data has been refreshed with selected filters.');
            animateCountUp();
        });
    }

    // Initialize defect list
    renderDefects();
});
