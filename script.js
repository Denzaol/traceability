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
    function renderComponentScanInputs(pos) {
        let masterComps = [];
        try {
            const storedComps = localStorage.getItem('masterComponents');
            if (storedComps) masterComps = JSON.parse(storedComps);
        } catch(e) {}
        if (masterComps.length === 0) {
            masterComps = [
                { id: 1, code: 'COMP-001', name: 'Engine Assembly', stage: 'Stage 13', active: true },
                { id: 2, code: 'COMP-002', name: 'Battery Pack', stage: 'Stage 5', active: true },
                { id: 3, code: 'COMP-003', name: 'Wiring Harness', stage: 'Stage 13', active: true },
                { id: 4, code: 'COMP-004', name: 'ECU Module', stage: 'Stage 13', active: true }
            ];
        }

        const stageComps = masterComps.filter(c => c.active && (c.stage === pos || pos === 'Unknown POS'));
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
                        <input type="text" class="comp-scan-input" id="comp-${comp.id}" data-comp-id="${comp.id}" data-index="${idx}" placeholder="Scan ${comp.name} barcode..." style="font-size: 14px; padding: 10px 14px;">
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
        btnScan.addEventListener('click', () => {
            if (nikInput.value.trim() !== '') {
                const pos = window.activeWorkstation || 'Unknown POS';
                if (displayNik) displayNik.textContent = nikInput.value.trim();
                if (displayVariant) displayVariant.textContent = selectVariant.value;
                if (displayPos) displayPos.textContent = pos;

                // Show component scanning area
                inspectionForm.style.display = 'block';
                renderComponentScanInputs(pos);

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
        btnSubmitInspection.addEventListener('click', () => {
            // Validate all component inputs
            const compInputs = document.querySelectorAll('#component-scan-list .comp-scan-input');
            for (let i = 0; i < compInputs.length; i++) {
                if (compInputs[i].value.trim() === '') {
                    showToast('warning', 'Missing Scan', `Please scan all components before submitting.`);
                    compInputs[i].focus();
                    return;
                }
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
            });

            // Add collected defects to the defect management list
            if (defectsCollected.length > 0) {
                defectsCollected.forEach(d => {
                    const newId = `DEF-${String(defects.length + 1).padStart(3, '0')}`;
                    defects.push({
                        id: newId,
                        nik: nikInput.value.trim(),
                        desc: d.desc,
                        category: 'Inspector Note',
                        pos: window.activeWorkstation || '-',
                        shift: window.activeShift || '-',
                        group: window.activeGroup || '-',
                        status: d.status
                    });
                });
                showToast('warning', `${defectsCollected.length} Defect(s) Recorded`, `Unit ${nikInput.value.trim()} has ${defectsCollected.length} defect note(s).`);
            } else {
                showToast('success', 'No Defect', `Unit ${nikInput.value.trim()} — no defect found. Direct Run candidate.`);
            }

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
                date: new Date().toLocaleDateString('en-CA')
            };
            let cycleRecords = [];
            try { cycleRecords = JSON.parse(localStorage.getItem('cycleRecords') || '[]'); } catch(e) {}
            cycleRecords.push(cycleRecord);
            localStorage.setItem('cycleRecords', JSON.stringify(cycleRecords));

            showToast('success', 'Inspection Submitted', `Unit ${nikInput.value.trim()} — cycle: ${insTimerSeconds}s, components: ${componentScannedCount}/${componentTotalCount}`);

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
