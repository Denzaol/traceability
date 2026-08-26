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
    // LIVE CLOCK
    // ============================================================
    function updateTime() {
        const now = new Date();
        const el = document.getElementById('admin-time');
        if (el) el.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }
    setInterval(updateTime, 1000);
    updateTime();

    // ============================================================
    // SPA NAVIGATION
    // ============================================================
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const viewSections = document.querySelectorAll('.view-section');
    const pageTitleText = document.getElementById('page-title-text');

    const pageTitles = {
        'dashboard-view': 'Quality KPI Dashboard',
        'shift-view': 'Master Shift',
        'group-view': 'Master Group',
        'user-view': 'Master User',
        'component-view': 'Master Component',
        'stage-view': 'Master Stage',
        'variant-view': 'Master Variant',
        'checklist-view': 'Checklist Items'
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');
            if (!targetId) return;

            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            viewSections.forEach(section => {
                section.classList.remove('active');
                section.classList.add('hidden');
            });

            const target = document.getElementById(targetId);
            if (target) {
                target.classList.remove('hidden');
                void target.offsetWidth;
                target.classList.add('active');
            }

            if (pageTitleText && pageTitles[targetId]) {
                pageTitleText.textContent = pageTitles[targetId];
            }

            if (targetId === 'dashboard-view') initAdminCharts();
        });
    });

    // ============================================================
    // ADMIN DASHBOARD CHARTS
    // ============================================================
    Chart.defaults.color = '#8b95b0';
    Chart.defaults.font.family = "'Inter', sans-serif";

    let dpuChartAdmin = null;
    let drrChartAdmin = null;

    function initAdminCharts() {
        if (dpuChartAdmin) dpuChartAdmin.destroy();
        if (drrChartAdmin) drrChartAdmin.destroy();

        const ctxDpu = document.getElementById('dpuChartAdmin')?.getContext('2d');
        const ctxDrr = document.getElementById('drrChartAdmin')?.getContext('2d');
        if (!ctxDpu || !ctxDrr) return;

        const labels = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

        const chartOptions = (yMin, yMax) => ({
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 16, font: { size: 11 } } },
                tooltip: {
                    backgroundColor: 'rgba(10, 14, 26, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
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

        const gradDpu1 = ctxDpu.createLinearGradient(0, 0, 0, 300);
        gradDpu1.addColorStop(0, 'rgba(245, 158, 11, 0.3)');
        gradDpu1.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

        dpuChartAdmin = new Chart(ctxDpu, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Shift 1',
                        data: [0.03, 0.04, 0.035, 0.05, 0.04, 0.03, 0.035, 0.040],
                        borderColor: '#f59e0b',
                        backgroundColor: gradDpu1,
                        borderWidth: 2, tension: 0.4, fill: true,
                        pointBackgroundColor: '#0a0e1a', pointBorderColor: '#f59e0b', pointBorderWidth: 2, pointRadius: 3
                    },
                    {
                        label: 'Shift 2',
                        data: [0.04, 0.05, 0.045, 0.06, 0.055, 0.05, 0.045, 0.050],
                        borderColor: '#a78bfa',
                        borderWidth: 2, tension: 0.4, fill: false, borderDash: [5, 5],
                        pointBackgroundColor: '#0a0e1a', pointBorderColor: '#a78bfa', pointBorderWidth: 2, pointRadius: 3
                    }
                ]
            },
            options: chartOptions(0, undefined)
        });

        const gradDrr1 = ctxDrr.createLinearGradient(0, 0, 0, 300);
        gradDrr1.addColorStop(0, 'rgba(34, 197, 94, 0.3)');
        gradDrr1.addColorStop(1, 'rgba(34, 197, 94, 0.0)');

        drrChartAdmin = new Chart(ctxDrr, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Shift 1',
                        data: [99, 98.5, 99.2, 97.5, 98.0, 99.0, 98.5, 98.0],
                        borderColor: '#22c55e',
                        backgroundColor: gradDrr1,
                        borderWidth: 2, tension: 0.4, fill: true,
                        pointBackgroundColor: '#0a0e1a', pointBorderColor: '#22c55e', pointBorderWidth: 2, pointRadius: 3
                    },
                    {
                        label: 'Shift 2',
                        data: [98, 97.0, 97.5, 96.0, 96.5, 97.0, 96.8, 96.4],
                        borderColor: '#a78bfa',
                        borderWidth: 2, tension: 0.4, fill: false, borderDash: [5, 5],
                        pointBackgroundColor: '#0a0e1a', pointBorderColor: '#a78bfa', pointBorderWidth: 2, pointRadius: 3
                    }
                ]
            },
            options: chartOptions(90, 100)
        });
    }

    // Admin Period Tabs
    const adminPeriodTabs = document.getElementById('admin-period-tabs');
    if (adminPeriodTabs) {
        adminPeriodTabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                adminPeriodTabs.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                showToast('info', 'Period Changed', `Viewing ${e.target.textContent} data`);
            }
        });
    }

    // Init charts on load
    initAdminCharts();

    // ============================================================
    // GENERIC MODAL HELPER
    // ============================================================
    function openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    }

    function setupModalClose(modalId, closeIds) {
        closeIds.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) btn.addEventListener('click', () => closeModal(modalId));
        });
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modalId);
            });
        }
    }

    // ============================================================
    // MOCK DATA STORE
    // ============================================================
    let shifts = [
        { id: 1, code: 'S1', name: 'Shift 1', start: '06:00', end: '14:00', overnight: false, active: true },
        { id: 2, code: 'S2', name: 'Shift 2 / Malam', start: '14:00', end: '22:00', overnight: false, active: true },
        { id: 3, code: 'S3', name: 'Shift 3 (Malam)', start: '22:00', end: '06:00', overnight: true, active: false }
    ];

    let groups = [
        { id: 1, code: 'A', name: 'Group A', active: true },
        { id: 2, code: 'B', name: 'Group B', active: true },
        { id: 3, code: 'C', name: 'Group C', active: false }
    ];

    let users = [
        { id: 1, username: 'INS001', fullname: 'Budi Santoso', role: 'Inspector', defaultGroup: 'Group A', active: true },
        { id: 2, username: 'INS002', fullname: 'Andi Wijaya', role: 'Inspector', defaultGroup: 'Group B', active: true },
        { id: 3, username: 'ADMIN01', fullname: 'Admin User', role: 'Admin', defaultGroup: '', active: true },
        { id: 4, username: 'QC001', fullname: 'Siti Rahayu', role: 'Quality', defaultGroup: 'Group A', active: true }
    ];

    let components = [
        { id: 1, code: 'COMP-001', name: 'Engine Assembly', stage: 'Stage 13', active: true },
        { id: 2, code: 'COMP-002', name: 'Battery Pack', stage: 'Stage 5', active: true },
        { id: 3, code: 'COMP-003', name: 'Wiring Harness', stage: 'Stage 8', active: true }
    ];

    let stages = [
        { id: 1, code: 'STG-05', name: 'Stage 5', active: true },
        { id: 2, code: 'STG-08', name: 'Stage 8', active: true },
        { id: 3, code: 'STG-13', name: 'Stage 13', active: true },
        { id: 4, code: 'STG-15', name: 'Stage 15', active: false }
    ];

    let variants = [
        { id: 1, code: 'VAR-X', name: 'N-Series X', active: true },
        { id: 2, code: 'VAR-Y', name: 'N-Series Y', active: true }
    ];

    let checklistItems = [
        { id: 1, code: 'CHK-01', desc: 'Visual Check Panel A', variant: 'All', stage: 'All', active: true },
        { id: 2, code: 'CHK-02', desc: 'Torque Check Bolt M6', variant: 'All', stage: 'All', active: true },
        { id: 3, code: 'CHK-03', desc: 'Label Placement', variant: 'All', stage: 'Stage 13', active: true },
        { id: 4, code: 'CHK-04', desc: 'Engine Pairing Check', variant: 'N-Series X', stage: 'Stage 13', active: true },
        { id: 5, code: 'CHK-05', desc: 'Connector Tightness', variant: 'All', stage: 'Stage 5', active: true }
    ];

    // ============================================================
    // GENERIC TABLE RENDERER
    // ============================================================
    function renderTable(tbodyId, data, rowBuilder, searchInputId) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;

        let filteredData = data;
        if (searchInputId) {
            const searchInput = document.getElementById(searchInputId);
            if (searchInput && searchInput.value.trim()) {
                const q = searchInput.value.trim().toLowerCase();
                filteredData = data.filter(item =>
                    Object.values(item).some(v => String(v).toLowerCase().includes(q))
                );
            }
        }

        tbody.innerHTML = '';
        filteredData.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = rowBuilder(item);
            tbody.appendChild(tr);
        });

        if (filteredData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="20" class="empty-state" style="padding: 40px;"><i class="fa-solid fa-inbox" style="font-size: 28px; margin-bottom: 10px;"></i><p>No data found</p></td></tr>`;
        }
    }

    function statusBadge(active) {
        return active
            ? '<span class="status-badge success">ACTIVE</span>'
            : '<span class="status-badge warning">INACTIVE</span>';
    }

    function actionButtons(editFn, deleteFn) {
        return `
            <button class="btn-action edit" onclick="${editFn}"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="btn-action delete" onclick="${deleteFn}"><i class="fa-solid fa-trash-can"></i></button>
        `;
    }

    // ============================================================
    // SHIFT CRUD
    // ============================================================
    function renderShifts() {
        renderTable('shift-table-body', shifts, (s) => `
            <td><span class="tag">${s.code}</span></td>
            <td>${s.name}</td>
            <td>${s.start}</td>
            <td>${s.end}</td>
            <td>${s.overnight ? '<span class="tag overnight">Yes</span>' : '<span style="color: var(--text-muted);">No</span>'}</td>
            <td>${statusBadge(s.active)}</td>
            <td>${actionButtons(`editShift(${s.id})`, `deleteShift(${s.id})`)}</td>
        `, 'search-shift');
    }

    setupModalClose('shift-modal', ['close-shift-modal', 'cancel-shift-modal']);

    document.getElementById('btn-add-shift')?.addEventListener('click', () => {
        document.getElementById('shift-modal-title').textContent = 'Add New Shift';
        document.getElementById('shift-form').reset();
        document.getElementById('shift-id').value = '';
        document.getElementById('shift-active').checked = true;
        openModal('shift-modal');
    });

    document.getElementById('shift-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('shift-id').value;
        const data = {
            code: document.getElementById('shift-code').value,
            name: document.getElementById('shift-name').value,
            start: document.getElementById('shift-start').value,
            end: document.getElementById('shift-end').value,
            overnight: document.getElementById('shift-overnight').checked,
            active: document.getElementById('shift-active').checked
        };

        if (id) {
            const item = shifts.find(s => s.id === parseInt(id));
            if (item) Object.assign(item, data);
            showToast('success', 'Updated', `${data.name} has been updated.`);
        } else {
            data.id = shifts.length ? Math.max(...shifts.map(s => s.id)) + 1 : 1;
            shifts.push(data);
            showToast('success', 'Created', `${data.name} has been added.`);
        }
        closeModal('shift-modal');
        renderShifts();
    });

    window.editShift = function (id) {
        const s = shifts.find(i => i.id === id);
        if (!s) return;
        document.getElementById('shift-modal-title').textContent = 'Edit Shift';
        document.getElementById('shift-id').value = s.id;
        document.getElementById('shift-code').value = s.code;
        document.getElementById('shift-name').value = s.name;
        document.getElementById('shift-start').value = s.start;
        document.getElementById('shift-end').value = s.end;
        document.getElementById('shift-overnight').checked = s.overnight;
        document.getElementById('shift-active').checked = s.active;
        openModal('shift-modal');
    };

    window.deleteShift = function (id) {
        if (!confirm('Delete this shift?')) return;
        shifts = shifts.filter(s => s.id !== id);
        renderShifts();
        showToast('success', 'Deleted', 'Shift has been removed.');
    };

    // ============================================================
    // GROUP CRUD
    // ============================================================
    function renderGroups() {
        renderTable('group-table-body', groups, (g) => `
            <td><span class="tag">${g.code}</span></td>
            <td>${g.name}</td>
            <td>${statusBadge(g.active)}</td>
            <td>${actionButtons(`editGroup(${g.id})`, `deleteGroup(${g.id})`)}</td>
        `, 'search-group');
    }

    setupModalClose('group-modal', ['close-group-modal', 'cancel-group-modal']);

    document.getElementById('btn-add-group')?.addEventListener('click', () => {
        document.getElementById('group-modal-title').textContent = 'Add New Group';
        document.getElementById('group-form').reset();
        document.getElementById('group-id').value = '';
        document.getElementById('group-active').checked = true;
        openModal('group-modal');
    });

    document.getElementById('group-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('group-id').value;
        const data = {
            code: document.getElementById('group-code').value,
            name: document.getElementById('group-name').value,
            active: document.getElementById('group-active').checked
        };

        if (id) {
            const item = groups.find(g => g.id === parseInt(id));
            if (item) Object.assign(item, data);
            showToast('success', 'Updated', `${data.name} has been updated.`);
        } else {
            data.id = groups.length ? Math.max(...groups.map(g => g.id)) + 1 : 1;
            groups.push(data);
            showToast('success', 'Created', `${data.name} has been added.`);
        }
        closeModal('group-modal');
        renderGroups();
    });

    window.editGroup = function (id) {
        const g = groups.find(i => i.id === id);
        if (!g) return;
        document.getElementById('group-modal-title').textContent = 'Edit Group';
        document.getElementById('group-id').value = g.id;
        document.getElementById('group-code').value = g.code;
        document.getElementById('group-name').value = g.name;
        document.getElementById('group-active').checked = g.active;
        openModal('group-modal');
    };

    window.deleteGroup = function (id) {
        if (!confirm('Delete this group?')) return;
        groups = groups.filter(g => g.id !== id);
        renderGroups();
        showToast('success', 'Deleted', 'Group has been removed.');
    };

    // ============================================================
    // USER CRUD
    // ============================================================
    function renderUsers() {
        renderTable('user-table-body', users, (u) => `
            <td><span class="tag">${u.username}</span></td>
            <td>${u.fullname}</td>
            <td><span class="badge badge-cyan">${u.role}</span></td>
            <td>${u.defaultGroup || '<span style="color: var(--text-muted);">—</span>'}</td>
            <td>${statusBadge(u.active)}</td>
            <td>${actionButtons(`editUser(${u.id})`, `deleteUser(${u.id})`)}</td>
        `, 'search-user');
    }

    setupModalClose('user-modal', ['close-user-modal', 'cancel-user-modal']);

    document.getElementById('btn-add-user')?.addEventListener('click', () => {
        document.getElementById('user-modal-title').textContent = 'Add New User';
        document.getElementById('user-form').reset();
        document.getElementById('user-id').value = '';
        document.getElementById('user-active').checked = true;
        openModal('user-modal');
    });

    document.getElementById('user-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('user-id').value;
        const data = {
            username: document.getElementById('user-username').value,
            fullname: document.getElementById('user-fullname').value,
            role: document.getElementById('user-role').value,
            defaultGroup: document.getElementById('user-defaultgroup').value,
            active: document.getElementById('user-active').checked
        };

        if (id) {
            const item = users.find(u => u.id === parseInt(id));
            if (item) Object.assign(item, data);
            showToast('success', 'Updated', `${data.username} has been updated.`);
        } else {
            data.id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
            users.push(data);
            showToast('success', 'Created', `${data.username} has been added.`);
        }
        closeModal('user-modal');
        renderUsers();
    });

    window.editUser = function (id) {
        const u = users.find(i => i.id === id);
        if (!u) return;
        document.getElementById('user-modal-title').textContent = 'Edit User';
        document.getElementById('user-id').value = u.id;
        document.getElementById('user-username').value = u.username;
        document.getElementById('user-password').value = '';
        document.getElementById('user-fullname').value = u.fullname;
        document.getElementById('user-role').value = u.role;
        document.getElementById('user-defaultgroup').value = u.defaultGroup;
        document.getElementById('user-active').checked = u.active;
        openModal('user-modal');
    };

    window.deleteUser = function (id) {
        if (!confirm('Delete this user?')) return;
        users = users.filter(u => u.id !== id);
        renderUsers();
        showToast('success', 'Deleted', 'User has been removed.');
    };

    // ============================================================
    // COMPONENT CRUD
    // ============================================================
    function renderComponents() {
        localStorage.setItem('masterComponents', JSON.stringify(components));
        renderTable('component-table-body', components, (c) => `
            <td><span class="tag">${c.code}</span></td>
            <td>${c.name}</td>
            <td>${c.stage}</td>
            <td>${statusBadge(c.active)}</td>
            <td>${actionButtons(`editComponent(${c.id})`, `deleteComponent(${c.id})`)}</td>
        `, 'search-component');
    }

    setupModalClose('component-modal', ['close-component-modal', 'cancel-component-modal']);

    document.getElementById('btn-add-component')?.addEventListener('click', () => {
        document.getElementById('component-modal-title').textContent = 'Add New Component';
        document.getElementById('component-form').reset();
        document.getElementById('component-id').value = '';
        document.getElementById('component-active').checked = true;
        openModal('component-modal');
    });

    document.getElementById('component-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('component-id').value;
        const data = {
            code: document.getElementById('component-code').value,
            name: document.getElementById('component-name').value,
            stage: document.getElementById('component-stage').value,
            active: document.getElementById('component-active').checked
        };

        if (id) {
            const item = components.find(c => c.id === parseInt(id));
            if (item) Object.assign(item, data);
            showToast('success', 'Updated', `${data.name} has been updated.`);
        } else {
            data.id = components.length ? Math.max(...components.map(c => c.id)) + 1 : 1;
            components.push(data);
            showToast('success', 'Created', `${data.name} has been added.`);
        }
        closeModal('component-modal');
        renderComponents();
    });

    window.editComponent = function (id) {
        const c = components.find(i => i.id === id);
        if (!c) return;
        document.getElementById('component-modal-title').textContent = 'Edit Component';
        document.getElementById('component-id').value = c.id;
        document.getElementById('component-code').value = c.code;
        document.getElementById('component-name').value = c.name;
        document.getElementById('component-stage').value = c.stage;
        document.getElementById('component-active').checked = c.active;
        openModal('component-modal');
    };

    window.deleteComponent = function (id) {
        if (!confirm('Delete this component?')) return;
        components = components.filter(c => c.id !== id);
        renderComponents();
        showToast('success', 'Deleted', 'Component has been removed.');
    };

    // ============================================================
    // STAGE CRUD
    // ============================================================
    function renderStages() {
        renderTable('stage-table-body', stages, (s) => `
            <td><span class="tag">${s.code}</span></td>
            <td>${s.name}</td>
            <td>${statusBadge(s.active)}</td>
            <td>${actionButtons(`editStage(${s.id})`, `deleteStage(${s.id})`)}</td>
        `, 'search-stage');
    }

    setupModalClose('stage-modal', ['close-stage-modal', 'cancel-stage-modal']);

    document.getElementById('btn-add-stage')?.addEventListener('click', () => {
        document.getElementById('stage-modal-title').textContent = 'Add New Stage';
        document.getElementById('stage-form').reset();
        document.getElementById('stage-id').value = '';
        document.getElementById('stage-active').checked = true;
        openModal('stage-modal');
    });

    document.getElementById('stage-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('stage-id').value;
        const data = {
            code: document.getElementById('stage-code').value,
            name: document.getElementById('stage-name').value,
            active: document.getElementById('stage-active').checked
        };

        if (id) {
            const item = stages.find(s => s.id === parseInt(id));
            if (item) Object.assign(item, data);
            showToast('success', 'Updated', `${data.name} has been updated.`);
        } else {
            data.id = stages.length ? Math.max(...stages.map(s => s.id)) + 1 : 1;
            stages.push(data);
            showToast('success', 'Created', `${data.name} has been added.`);
        }
        closeModal('stage-modal');
        renderStages();
    });

    window.editStage = function (id) {
        const s = stages.find(i => i.id === id);
        if (!s) return;
        document.getElementById('stage-modal-title').textContent = 'Edit Stage';
        document.getElementById('stage-id').value = s.id;
        document.getElementById('stage-code').value = s.code;
        document.getElementById('stage-name').value = s.name;
        document.getElementById('stage-active').checked = s.active;
        openModal('stage-modal');
    };

    window.deleteStage = function (id) {
        if (!confirm('Delete this stage?')) return;
        stages = stages.filter(s => s.id !== id);
        renderStages();
        showToast('success', 'Deleted', 'Stage has been removed.');
    };

    // ============================================================
    // VARIANT CRUD
    // ============================================================
    function renderVariants() {
        renderTable('variant-table-body', variants, (v) => `
            <td><span class="tag">${v.code}</span></td>
            <td>${v.name}</td>
            <td>${statusBadge(v.active)}</td>
            <td>${actionButtons(`editVariant(${v.id})`, `deleteVariant(${v.id})`)}</td>
        `, 'search-variant');
    }

    setupModalClose('variant-modal', ['close-variant-modal', 'cancel-variant-modal']);

    document.getElementById('btn-add-variant')?.addEventListener('click', () => {
        document.getElementById('variant-modal-title').textContent = 'Add New Variant';
        document.getElementById('variant-form').reset();
        document.getElementById('variant-id').value = '';
        document.getElementById('variant-active').checked = true;
        openModal('variant-modal');
    });

    document.getElementById('variant-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('variant-id').value;
        const data = {
            code: document.getElementById('variant-code').value,
            name: document.getElementById('variant-name').value,
            active: document.getElementById('variant-active').checked
        };

        if (id) {
            const item = variants.find(v => v.id === parseInt(id));
            if (item) Object.assign(item, data);
            showToast('success', 'Updated', `${data.name} has been updated.`);
        } else {
            data.id = variants.length ? Math.max(...variants.map(v => v.id)) + 1 : 1;
            variants.push(data);
            showToast('success', 'Created', `${data.name} has been added.`);
        }
        closeModal('variant-modal');
        renderVariants();
    });

    window.editVariant = function (id) {
        const v = variants.find(i => i.id === id);
        if (!v) return;
        document.getElementById('variant-modal-title').textContent = 'Edit Variant';
        document.getElementById('variant-id').value = v.id;
        document.getElementById('variant-code').value = v.code;
        document.getElementById('variant-name').value = v.name;
        document.getElementById('variant-active').checked = v.active;
        openModal('variant-modal');
    };

    window.deleteVariant = function (id) {
        if (!confirm('Delete this variant?')) return;
        variants = variants.filter(v => v.id !== id);
        renderVariants();
        showToast('success', 'Deleted', 'Variant has been removed.');
    };

    // ============================================================
    // CHECKLIST ITEMS CRUD
    // ============================================================
    function renderChecklist() {
        renderTable('checklist-table-body', checklistItems, (c) => `
            <td><span class="tag">${c.code}</span></td>
            <td>${c.desc}</td>
            <td>${c.variant}</td>
            <td>${c.stage}</td>
            <td>${statusBadge(c.active)}</td>
            <td>${actionButtons(`editChecklist(${c.id})`, `deleteChecklist(${c.id})`)}</td>
        `);
    }

    setupModalClose('checklist-modal', ['close-checklist-modal', 'cancel-checklist-modal']);

    document.getElementById('btn-add-checklist')?.addEventListener('click', () => {
        document.getElementById('checklist-modal-title').textContent = 'Add Checklist Item';
        document.getElementById('checklist-form').reset();
        document.getElementById('checklist-id').value = '';
        document.getElementById('checklist-active').checked = true;
        openModal('checklist-modal');
    });

    document.getElementById('checklist-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('checklist-id').value;
        const data = {
            code: document.getElementById('checklist-code').value,
            desc: document.getElementById('checklist-desc').value,
            variant: document.getElementById('checklist-variant').value,
            stage: document.getElementById('checklist-stage').value,
            active: document.getElementById('checklist-active').checked
        };

        if (id) {
            const item = checklistItems.find(c => c.id === parseInt(id));
            if (item) Object.assign(item, data);
            showToast('success', 'Updated', `${data.code} has been updated.`);
        } else {
            data.id = checklistItems.length ? Math.max(...checklistItems.map(c => c.id)) + 1 : 1;
            checklistItems.push(data);
            showToast('success', 'Created', `${data.code} has been added.`);
        }
        closeModal('checklist-modal');
        renderChecklist();
    });

    window.editChecklist = function (id) {
        const c = checklistItems.find(i => i.id === id);
        if (!c) return;
        document.getElementById('checklist-modal-title').textContent = 'Edit Checklist Item';
        document.getElementById('checklist-id').value = c.id;
        document.getElementById('checklist-code').value = c.code;
        document.getElementById('checklist-desc').value = c.desc;
        document.getElementById('checklist-variant').value = c.variant;
        document.getElementById('checklist-stage').value = c.stage;
        document.getElementById('checklist-active').checked = c.active;
        openModal('checklist-modal');
    };

    window.deleteChecklist = function (id) {
        if (!confirm('Delete this checklist item?')) return;
        checklistItems = checklistItems.filter(c => c.id !== id);
        renderChecklist();
        showToast('success', 'Deleted', 'Checklist item has been removed.');
    };

    // ============================================================
    // SEARCH LISTENERS
    // ============================================================
    ['search-shift', 'search-group', 'search-user', 'search-component', 'search-stage', 'search-variant'].forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', () => {
                if (inputId === 'search-shift') renderShifts();
                else if (inputId === 'search-group') renderGroups();
                else if (inputId === 'search-user') renderUsers();
                else if (inputId === 'search-component') renderComponents();
                else if (inputId === 'search-stage') renderStages();
                else if (inputId === 'search-variant') renderVariants();
            });
        }
    });

    // ============================================================
    // INITIAL RENDER
    // ============================================================
    renderShifts();
    renderGroups();
    renderUsers();
    renderComponents();
    renderStages();
    renderVariants();
    renderChecklist();
});
