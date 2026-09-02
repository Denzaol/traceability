document.addEventListener('DOMContentLoaded', () => {

    // --- Session Auth Check ---
    const sessionUser = JSON.parse(localStorage.getItem('sessionUser'));
    if (!sessionUser || sessionUser.role !== 'Admin') {
        alert('Unauthorized access. Please login as Admin.');
        window.location.href = 'index.html';
        return;
    }
    document.querySelector('.user-name').textContent = sessionUser.fullname;

    // ============================================================
    // LOGOUT LOGIC
    // ============================================================
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('sessionUser');
            window.location.href = 'index.html';
        });
    }    // ============================================================
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
        'cycletime-view': 'Cycle Time Records',
        'traceability-view': 'Traceability Search'
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
            if (targetId === 'shift-view') fetchShifts();
            if (targetId === 'group-view') fetchGroups();
            if (targetId === 'user-view') fetchUsers();
            if (targetId === 'component-view') fetchComponents();
            if (targetId === 'stage-view') fetchStages();
            if (targetId === 'variant-view') fetchVariants();
            if (targetId === 'cycletime-view') renderCycleTimeRecords();
            if (targetId === 'wip-view') loadWIP();
            if (targetId === 'traceability-view') {
                setTimeout(() => document.getElementById('admin-trace-nik')?.focus(), 50);
            }
        });
    });

    // ============================================================
    // ADMIN DASHBOARD CHARTS
    // ============================================================
    Chart.defaults.color = '#8b95b0';
    Chart.defaults.font.family = "'Inter', sans-serif";

    let dpuChartAdmin = null;
    let drrChartAdmin = null;

    async function initAdminCharts() {
        if (dpuChartAdmin) dpuChartAdmin.destroy();
        if (drrChartAdmin) drrChartAdmin.destroy();

        const ctxDpu = document.getElementById('dpuChartAdmin')?.getContext('2d');
        const ctxDrr = document.getElementById('drrChartAdmin')?.getContext('2d');
        if (!ctxDpu || !ctxDrr) return;

        const activePeriod = document.querySelector('#admin-period-tabs .tab-btn.active')?.dataset.period || 'daily';
        let kpiData = { dpuSeries: [], drrSeries: [], labels: [] };
        try {
            const res = await fetch(`/api/dashboard/kpi?period=${activePeriod}`);
            if (res.ok) {
                kpiData = await res.json();
                
                // Update Dashboard Numbers
                if (document.getElementById('dash-unit-check')) document.getElementById('dash-unit-check').textContent = kpiData.unitCheck || 0;
                if (document.getElementById('dash-total-defect')) document.getElementById('dash-total-defect').textContent = kpiData.totalDefect || 0;
                if (document.getElementById('dash-dpu')) document.getElementById('dash-dpu').textContent = (kpiData.dpu || 0).toFixed(3);
                if (document.getElementById('dash-drr')) document.getElementById('dash-drr').textContent = (kpiData.drr || 0).toFixed(1) + '%';
                if (document.getElementById('dash-direct-run')) document.getElementById('dash-direct-run').textContent = kpiData.directRun || 0;
                if (document.getElementById('dash-not-direct-run')) document.getElementById('dash-not-direct-run').textContent = kpiData.notDirectRun || 0;
                if (document.getElementById('dash-open-defect')) document.getElementById('dash-open-defect').textContent = kpiData.openDefect || 0;
                if (document.getElementById('dash-closed-defect')) document.getElementById('dash-closed-defect').textContent = kpiData.closedDefect || 0;
                if (document.getElementById('dash-wip')) document.getElementById('dash-wip').textContent = kpiData.wipCount || 0;
            }
        } catch (e) {
            console.error("Failed to fetch KPI data", e);
        }

        // Load comparison data and exception table
        loadDashboardComparisons(activePeriod);
        loadDashboardExceptions();

        const labels = kpiData.labels && kpiData.labels.length ? kpiData.labels : ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

        const chartOptions = (yMin, yMax) => ({
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 16, font: { size: 11 } } },
                tooltip: { backgroundColor: 'rgba(10, 14, 26, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, padding: 12, cornerRadius: 8, boxPadding: 4 }
            },
            scales: {
                y: { min: yMin, max: yMax, grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }, ticks: { font: { size: 11 }, padding: 8 }, border: { display: false } },
                x: { grid: { display: false }, ticks: { font: { size: 11 }, padding: 8 }, border: { display: false } }
            },
            animation: { duration: 1000, easing: 'easeOutQuart' }
        });

        const gradDpu1 = ctxDpu.createLinearGradient(0, 0, 0, 300);
        gradDpu1.addColorStop(0, 'rgba(245, 158, 11, 0.3)'); gradDpu1.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

        dpuChartAdmin = new Chart(ctxDpu, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'DPU Trend',
                        data: kpiData.dpuSeries && kpiData.dpuSeries.length ? kpiData.dpuSeries : [0.03, 0.04, 0.035, 0.05, 0.04, 0.03, 0.035, 0.040],
                        borderColor: '#f59e0b',
                        backgroundColor: gradDpu1,
                        borderWidth: 2, tension: 0.4, fill: true,
                        pointBackgroundColor: '#0a0e1a', pointBorderColor: '#f59e0b', pointBorderWidth: 2, pointRadius: 3
                    }
                ]
            },
            options: chartOptions(0, undefined)
        });

        const gradDrr1 = ctxDrr.createLinearGradient(0, 0, 0, 300);
        gradDrr1.addColorStop(0, 'rgba(34, 197, 94, 0.3)'); gradDrr1.addColorStop(1, 'rgba(34, 197, 94, 0.0)');

        drrChartAdmin = new Chart(ctxDrr, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'DRR Trend (%)',
                        data: kpiData.drrSeries && kpiData.drrSeries.length ? kpiData.drrSeries : [99, 98.5, 99.2, 97.5, 98.0, 99.0, 98.5, 98.0],
                        borderColor: '#22c55e',
                        backgroundColor: gradDrr1,
                        borderWidth: 2, tension: 0.4, fill: true,
                        pointBackgroundColor: '#0a0e1a', pointBorderColor: '#22c55e', pointBorderWidth: 2, pointRadius: 3
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
                initAdminCharts();
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
    // API DATA STORE (Replaced Mock Data)
    // ============================================================
    let shifts = [];
    let groups = [];
    let users = [];
    let components = [];
    let stages = [];
    let variants = [];

    async function apiFetch(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(await res.text());
            if (res.status !== 204) return await res.json();
            return true;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

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
    async function fetchShifts() {
        shifts = await apiFetch('/api/master/shifts').catch(() => []);
        renderShifts();
    }
    
    function renderShifts() {
        renderTable('shift-table-body', shifts, (s) => `
            <td><span class="tag">${s.code}</span></td>
            <td>${s.name}</td>
            <td>${s.start}</td>
            <td>${s.end}</td>
            <td>${s.overtime_hours || 0}</td>
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

    document.getElementById('shift-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('shift-id').value;
        const data = {
            code: document.getElementById('shift-code').value,
            name: document.getElementById('shift-name').value,
            start: document.getElementById('shift-start').value,
            end: document.getElementById('shift-end').value,
            overtime_hours: parseInt(document.getElementById('shift-overtime').value) || 0,
            overnight: document.getElementById('shift-overnight').checked,
            active: document.getElementById('shift-active').checked
        };
        try {
            if (id) {
                await apiFetch(`/api/master/shifts/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
                showToast('success', 'Updated', `${data.name} updated.`);
            } else {
                await apiFetch(`/api/master/shifts`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
                showToast('success', 'Created', `${data.name} added.`);
            }
            closeModal('shift-modal');
            fetchShifts();
        } catch(e) { showToast('error', 'Error', 'Failed to save'); }
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
        document.getElementById('shift-overtime').value = s.overtime_hours || 0;
        document.getElementById('shift-overnight').checked = s.overnight;
        document.getElementById('shift-active').checked = s.active;
        openModal('shift-modal');
    };

    window.deleteShift = async function (id) {
        if (!confirm('Delete this shift?')) return;
        try {
            await apiFetch(`/api/master/shifts/${id}`, { method: 'DELETE' });
            showToast('success', 'Deleted', 'Shift removed.');
            fetchShifts();
        } catch(e) { showToast('error', 'Error', 'Failed to delete'); }
    };

    // ============================================================
    // GROUP CRUD
    // ============================================================
    async function fetchGroups() {
        groups = await apiFetch('/api/master/groups').catch(() => []);
        renderGroups();
    }
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
    document.getElementById('group-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('group-id').value;
        const data = {
            code: document.getElementById('group-code').value,
            name: document.getElementById('group-name').value,
            active: document.getElementById('group-active').checked
        };
        try {
            if (id) await apiFetch(`/api/master/groups/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            else await apiFetch(`/api/master/groups`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            showToast('success', 'Success', `${data.name} saved.`);
            closeModal('group-modal');
            fetchGroups();
        } catch(e) { showToast('error', 'Error', 'Failed to save'); }
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
    window.deleteGroup = async function (id) {
        if (!confirm('Delete this group?')) return;
        try {
            await apiFetch(`/api/master/groups/${id}`, { method: 'DELETE' });
            showToast('success', 'Deleted', 'Group removed.');
            fetchGroups();
        } catch(e) { showToast('error', 'Error', 'Failed to delete'); }
    };

    // ============================================================
    // USER CRUD
    // ============================================================
    async function fetchUsers() {
        users = await apiFetch('/api/master/users').catch(() => []);
        renderUsers();
    }
    function renderUsers() {
        renderTable('user-table-body', users, (u) => `
            <td><span class="tag">${u.username}</span></td>
            <td>${u.fullname}</td>
            <td><span class="badge badge-cyan">${u.role}</span></td>
            <td>${u.default_group || '<span style="color: var(--text-muted);">—</span>'}</td>
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
    document.getElementById('user-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('user-id').value;
        const data = {
            username: document.getElementById('user-username').value,
            password: document.getElementById('user-password').value,
            fullname: document.getElementById('user-fullname').value,
            role: document.getElementById('user-role').value,
            default_group: document.getElementById('user-defaultgroup').value || null,
            active: document.getElementById('user-active').checked
        };
        if(!id && !data.password) { showToast('error', 'Error', 'Password required'); return; }
        try {
            if (id) await apiFetch(`/api/master/users/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            else await apiFetch(`/api/master/users`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            showToast('success', 'Success', `${data.username} saved.`);
            closeModal('user-modal');
            fetchUsers();
        } catch(e) { showToast('error', 'Error', 'Failed to save'); }
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
        document.getElementById('user-defaultgroup').value = u.default_group || '';
        document.getElementById('user-active').checked = u.active;
        openModal('user-modal');
    };
    window.deleteUser = async function (id) {
        if (!confirm('Delete this user?')) return;
        try {
            await apiFetch(`/api/master/users/${id}`, { method: 'DELETE' });
            showToast('success', 'Deleted', 'User removed.');
            fetchUsers();
        } catch(e) { showToast('error', 'Error', 'Failed to delete'); }
    };

    // ============================================================
    // COMPONENT CRUD
    // ============================================================
    async function fetchComponents() {
        components = await apiFetch('/api/master/components').catch(() => []);
        renderComponents();
    }
    function renderComponents() {
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
    document.getElementById('component-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('component-id').value;
        const data = {
            code: document.getElementById('component-code').value,
            name: document.getElementById('component-name').value,
            stage: document.getElementById('component-stage').value,
            active: document.getElementById('component-active').checked
        };
        try {
            if (id) await apiFetch(`/api/master/components/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            else await apiFetch(`/api/master/components`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            showToast('success', 'Success', `${data.name} saved.`);
            closeModal('component-modal');
            fetchComponents();
        } catch(e) { showToast('error', 'Error', 'Failed to save'); }
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
    window.deleteComponent = async function (id) {
        if (!confirm('Delete this component?')) return;
        try {
            await apiFetch(`/api/master/components/${id}`, { method: 'DELETE' });
            showToast('success', 'Deleted', 'Component removed.');
            fetchComponents();
        } catch(e) { showToast('error', 'Error', 'Failed to delete'); }
    };

    // ============================================================
    // STAGE CRUD
    // ============================================================
    async function fetchStages() {
        stages = await apiFetch('/api/master/stages').catch(() => []);
        renderStages();
    }
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
    document.getElementById('stage-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('stage-id').value;
        const data = {
            code: document.getElementById('stage-code').value,
            name: document.getElementById('stage-name').value,
            active: document.getElementById('stage-active').checked
        };
        try {
            if (id) await apiFetch(`/api/master/stages/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            else await apiFetch(`/api/master/stages`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            showToast('success', 'Success', `${data.name} saved.`);
            closeModal('stage-modal');
            fetchStages();
        } catch(e) { showToast('error', 'Error', 'Failed to save'); }
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
    window.deleteStage = async function (id) {
        if (!confirm('Delete this stage?')) return;
        try {
            await apiFetch(`/api/master/stages/${id}`, { method: 'DELETE' });
            showToast('success', 'Deleted', 'Stage removed.');
            fetchStages();
        } catch(e) { showToast('error', 'Error', 'Failed to delete'); }
    };

    // ============================================================
    // VARIANT CRUD
    // ============================================================
    async function fetchVariants() {
        variants = await apiFetch('/api/master/variants').catch(() => []);
        renderVariants();
    }
    function renderVariants() {
        renderTable('variant-table-body', variants, (v) => `
            <td><span class="tag">${v.code}</span></td>
            <td>${v.name}</td>
            <td><span class="badge badge-cyan">${v.takt || 180}s</span></td>
            <td>${statusBadge(v.active)}</td>
            <td>${actionButtons(`editVariant(${v.id})`, `deleteVariant(${v.id})`)}</td>
        `, 'search-variant');
    }
    setupModalClose('variant-modal', ['close-variant-modal', 'cancel-variant-modal']);
    document.getElementById('btn-add-variant')?.addEventListener('click', () => {
        document.getElementById('variant-modal-title').textContent = 'Add New Variant';
        document.getElementById('variant-form').reset();
        document.getElementById('variant-id').value = '';
        document.getElementById('variant-takttime').value = '180';
        document.getElementById('variant-active').checked = true;
        openModal('variant-modal');
    });
    document.getElementById('variant-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('variant-id').value;
        const data = {
            code: document.getElementById('variant-code').value,
            name: document.getElementById('variant-name').value,
            takt: parseInt(document.getElementById('variant-takttime').value) || 180,
            active: document.getElementById('variant-active').checked
        };
        try {
            if (id) await apiFetch(`/api/master/variants/${id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            else await apiFetch(`/api/master/variants`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
            showToast('success', 'Success', `${data.name} saved.`);
            closeModal('variant-modal');
            fetchVariants();
        } catch(e) { showToast('error', 'Error', 'Failed to save'); }
    });
    window.editVariant = function (id) {
        const v = variants.find(i => i.id === id);
        if (!v) return;
        document.getElementById('variant-modal-title').textContent = 'Edit Variant';
        document.getElementById('variant-id').value = v.id;
        document.getElementById('variant-code').value = v.code;
        document.getElementById('variant-name').value = v.name;
        document.getElementById('variant-takttime').value = v.takt || 180;
        document.getElementById('variant-active').checked = v.active;
        openModal('variant-modal');
    };
    window.deleteVariant = async function (id) {
        if (!confirm('Delete this variant?')) return;
        try {
            await apiFetch(`/api/master/variants/${id}`, { method: 'DELETE' });
            showToast('success', 'Deleted', 'Variant removed.');
            fetchVariants();
        } catch(e) { showToast('error', 'Error', 'Failed to delete'); }
    };

    // ============================================================
    // CYCLE TIME RECORDS (FETCH FROM DATABASE)
    // ============================================================
    async function renderCycleTimeRecords() {
        const filterDate = document.getElementById('ct-filter-date')?.value || '';
        const filterShift = document.getElementById('ct-filter-shift')?.value || 'all';
        const filterStage = document.getElementById('ct-filter-stage')?.value || 'all';

        let params = new URLSearchParams();
        if (filterDate) params.set('date', filterDate);
        if (filterShift && filterShift !== 'all') params.set('shift', filterShift);
        if (filterStage && filterStage !== 'all') params.set('stage', filterStage);

        let filtered = [];
        try {
            filtered = await apiFetch(`/api/master/cycle-records?${params.toString()}`);
        } catch(e) {
            console.error('Failed to fetch cycle records:', e);
        }

        const tbody = document.getElementById('cycletime-table-body');
        const emptyState = document.getElementById('ct-empty-state');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            filtered.forEach((r, i) => {
                const statusBdg = r.status === 'OK'
                    ? '<span class="status-badge success">OK</span>'
                    : '<span class="status-badge error">OVER</span>';
                const dateStr = r.date ? new Date(r.date).toLocaleDateString('en-CA') : '-';
                
                let componentsHtml = '-';
                if (r.components && r.components.length > 0) {
                    componentsHtml = r.components.map(c => `${c.component_name}: <strong>${c.part_no}</strong>`).join('<br>');
                } else if (r.part_no && r.part_no !== '-') {
                    componentsHtml = r.part_no;
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${i + 1}</td>
                    <td>${dateStr}</td>
                    <td><span class="tag">${r.nik || '-'}</span></td>
                    <td>${r.variant || '-'}</td>
                    <td>${r.pos || '-'}</td>
                    <td>${r.inspector || '-'}</td>
                    <td style="font-size: 11px; line-height: 1.4;">${componentsHtml}</td>
                    <td>${r.shift || '-'}</td>
                    <td>${r.group || '-'}</td>
                    <td>${r.startTime || '-'}</td>
                    <td>${r.endTime || '-'}</td>
                    <td><strong>${r.cycleSec || 0}s</strong></td>
                    <td>${r.pauseSec || 0}s</td>
                    <td>${statusBdg}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        const totalEl = document.getElementById('ct-total-count');
        const avgEl = document.getElementById('ct-avg-time');
        const okRateEl = document.getElementById('ct-ok-rate');
        const overEl = document.getElementById('ct-over-count');

        if (totalEl) totalEl.textContent = filtered.length;
        if (filtered.length > 0) {
            const avgCycle = Math.round(filtered.reduce((s, r) => s + (r.cycleSec || 0), 0) / filtered.length);
            const okCount = filtered.filter(r => r.status === 'OK').length;
            const overCount = filtered.length - okCount;
            if (avgEl) avgEl.textContent = avgCycle + 's';
            if (okRateEl) okRateEl.textContent = ((okCount / filtered.length) * 100).toFixed(1) + '%';
            if (overEl) overEl.textContent = overCount;
        } else {
            if (avgEl) avgEl.textContent = '0s';
            if (okRateEl) okRateEl.textContent = '0%';
            if (overEl) overEl.textContent = '0';
        }
    }

    // ============================================================
    // DASHBOARD COMPARISON DATA + EXCEPTION TABLE
    // ============================================================
    async function loadDashboardComparisons(period) {
        // Shift Comparison
        try {
            const shiftsData = await apiFetch('/api/master/shifts');
            const activeShifts = shiftsData.filter(s => s.active).slice(0, 2);
            const shiftTbody = document.getElementById('dash-shift-comparison');
            if (shiftTbody && activeShifts.length >= 2) {
                const today = new Date().toISOString().split('T')[0];
                const [kpi1, kpi2] = await Promise.all([
                    apiFetch(`/api/dashboard/kpi?period=${period}&date=${today}&shift=${activeShifts[0].name}`).catch(() => ({})),
                    apiFetch(`/api/dashboard/kpi?period=${period}&date=${today}&shift=${activeShifts[1].name}`).catch(() => ({}))
                ]);
                const thead = shiftTbody.closest('table').querySelector('thead tr');
                if (thead) thead.innerHTML = `<th>KPI</th><th>${activeShifts[0].name}</th><th>${activeShifts[1].name}</th>`;
                shiftTbody.innerHTML = `
                    <tr><td>Unit Check</td><td>${kpi1.unitCheck||0}</td><td>${kpi2.unitCheck||0}</td></tr>
                    <tr><td>Total Defect</td><td>${kpi1.totalDefect||0}</td><td>${kpi2.totalDefect||0}</td></tr>
                    <tr><td>DPU</td><td>${Number(kpi1.dpu||0).toFixed(3)}</td><td>${Number(kpi2.dpu||0).toFixed(3)}</td></tr>
                    <tr><td>Direct Run</td><td>${kpi1.directRun||0}</td><td>${kpi2.directRun||0}</td></tr>
                    <tr><td>DRR</td><td style="color:var(--accent-green)">${Number(kpi1.drr||0).toFixed(1)}%</td><td style="color:var(--accent-green)">${Number(kpi2.drr||0).toFixed(1)}%</td></tr>
                `;
            } else if (shiftTbody) {
                shiftTbody.innerHTML = '<tr><td colspan="3" style="color:var(--text-muted);padding:16px;text-align:center;">Need at least 2 active shifts</td></tr>';
            }
        } catch(e) { console.error('Shift comparison error:', e); }

        // Group Comparison
        try {
            const groupsData = await apiFetch('/api/master/groups');
            const activeGroups = groupsData.filter(g => g.active).slice(0, 2);
            const groupTbody = document.getElementById('dash-group-comparison');
            if (groupTbody && activeGroups.length >= 2) {
                const today = new Date().toISOString().split('T')[0];
                const [kpi1, kpi2] = await Promise.all([
                    apiFetch(`/api/dashboard/kpi?period=${period}&date=${today}&group=${activeGroups[0].name}`).catch(() => ({})),
                    apiFetch(`/api/dashboard/kpi?period=${period}&date=${today}&group=${activeGroups[1].name}`).catch(() => ({}))
                ]);
                const thead = groupTbody.closest('table').querySelector('thead tr');
                if (thead) thead.innerHTML = `<th>KPI</th><th>${activeGroups[0].name}</th><th>${activeGroups[1].name}</th>`;
                groupTbody.innerHTML = `
                    <tr><td>Unit Check</td><td>${kpi1.unitCheck||0}</td><td>${kpi2.unitCheck||0}</td></tr>
                    <tr><td>Total Defect</td><td>${kpi1.totalDefect||0}</td><td>${kpi2.totalDefect||0}</td></tr>
                    <tr><td>DPU</td><td>${Number(kpi1.dpu||0).toFixed(3)}</td><td>${Number(kpi2.dpu||0).toFixed(3)}</td></tr>
                    <tr><td>Direct Run</td><td>${kpi1.directRun||0}</td><td>${kpi2.directRun||0}</td></tr>
                    <tr><td>DRR</td><td style="color:var(--accent-green)">${Number(kpi1.drr||0).toFixed(1)}%</td><td style="color:var(--accent-green)">${Number(kpi2.drr||0).toFixed(1)}%</td></tr>
                `;
            } else if (groupTbody) {
                groupTbody.innerHTML = '<tr><td colspan="3" style="color:var(--text-muted);padding:16px;text-align:center;">Need at least 2 active groups</td></tr>';
            }
        } catch(e) { console.error('Group comparison error:', e); }
    }

    async function loadDashboardExceptions() {
        const tbody = document.getElementById('dash-exception-tbody');
        if (!tbody) return;
        try {
            const defects = await apiFetch('/api/defects?status=OPEN');
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
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="7" style="color:var(--text-muted);padding:20px;">Failed to load</td></tr>';
        }
    }

    document.getElementById('btn-filter-ct')?.addEventListener('click', () => {
        renderCycleTimeRecords();
        showToast('info', 'Filter Applied', 'Cycle time records filtered.');
    });

    document.getElementById('btn-export-ct')?.addEventListener('click', () => {
        window.location.href = '/api/export/cycle';
        showToast('success', 'Export Started', 'Cycle time records download initiated.');
    });

    // ============================================================
    // WIP TRACKING
    // ============================================================
    async function loadWIP() {
        try {
            const data = await apiFetch('/api/traceability/wip');
            const tbody = document.getElementById('wip-table-body');
            const emptyState = document.getElementById('wip-empty-state');
            if(!tbody) return;

            tbody.innerHTML = '';
            if (data.length === 0) {
                if(emptyState) emptyState.style.display = 'block';
            } else {
                if(emptyState) emptyState.style.display = 'none';
                data.forEach(item => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><span class="tag">${item.nik}</span></td>
                        <td>${item.variant}</td>
                        <td>${new Date(item.start_time).toLocaleString()}</td>
                        <td>${item.inspector}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        } catch (e) {
            showToast('error', 'Error', 'Failed to load WIP data');
        }
    }

    document.getElementById('btn-refresh-wip')?.addEventListener('click', loadWIP);
    
    document.getElementById('search-wip')?.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#wip-table-body tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(q) ? '' : 'none';
        });
    });

    // ============================================================
    // ADMIN TRACEABILITY SEARCH (FETCH API)
    // ============================================================
    const adminTraceNikInput = document.getElementById('admin-trace-nik');
    const adminSuggestionsList = document.getElementById('admin-trace-suggestions');
    const btnAdminTraceSearch = document.getElementById('btn-admin-trace-search');
    let adminDebounceTimer;

    if (adminTraceNikInput && adminSuggestionsList) {
        adminTraceNikInput.addEventListener('input', (e) => {
            clearTimeout(adminDebounceTimer);
            const q = e.target.value.trim();
            
            if (q.length < 2) {
                adminSuggestionsList.style.display = 'none';
                return;
            }

            adminDebounceTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/traceability/suggestions?q=${encodeURIComponent(q)}`);
                    const suggestions = await res.json();
                    
                    if (suggestions.length > 0) {
                        adminSuggestionsList.innerHTML = suggestions.map(s => `<li>${s}</li>`).join('');
                        adminSuggestionsList.style.display = 'block';
                        
                        // Click suggestion
                        adminSuggestionsList.querySelectorAll('li').forEach(li => {
                            li.addEventListener('click', () => {
                                adminTraceNikInput.value = li.textContent;
                                adminSuggestionsList.style.display = 'none';
                                btnAdminTraceSearch?.click(); // Trigger search
                            });
                        });
                    } else {
                        adminSuggestionsList.style.display = 'none';
                    }
                } catch (err) {
                    console.error('Failed to fetch suggestions:', err);
                }
            }, 300);
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== adminTraceNikInput && e.target !== adminSuggestionsList) {
                adminSuggestionsList.style.display = 'none';
            }
        });
    }
    document.getElementById('btn-admin-trace-search')?.addEventListener('click', async () => {
        const nik = document.getElementById('admin-trace-nik')?.value.trim();
        if (!nik) { showToast('warning', 'Empty', 'Enter a NIK to search.'); return; }

        const resultsDiv = document.getElementById('admin-trace-results');
        const emptyDiv = document.getElementById('admin-trace-empty');
        if (!resultsDiv) return;

        try {
            const res = await fetch(`/api/traceability/search/${nik}`);
            const data = await res.json();
            
            if (!data.success || (data.cycleRecords.length === 0 && data.defects.length === 0)) {
                if (emptyDiv) { emptyDiv.style.display = 'block'; emptyDiv.innerHTML = `<p style="color:var(--text-muted);padding:30px;"><i class="fa-solid fa-circle-info" style="margin-right:6px;"></i> No records found for <strong>${nik}</strong></p>`; }
                if (resultsDiv) resultsDiv.style.display = 'none';
                return;
            }

            if (emptyDiv) emptyDiv.style.display = 'none';
            resultsDiv.style.display = 'block';

            document.getElementById('at-nik').textContent = data.nik;
            document.getElementById('at-variant').textContent = data.variant || '-';
            
            const lastStage = data.cycleRecords.length > 0 ? data.cycleRecords[data.cycleRecords.length - 1].pos : '-';
            document.getElementById('at-stage').textContent = lastStage;
            document.getElementById('at-drr').textContent = data.defects.some(d => d.status === 'OPEN') ? 'NO' : 'YES';

            const ctTbody = document.getElementById('at-cycle-tbody');
            if (ctTbody) {
                ctTbody.innerHTML = '';
                data.cycleRecords.forEach(r => {
                    const st = r.status === 'OK' ? '<span class="status-badge success">OK</span>' : '<span class="status-badge error">OVER</span>';
                    const dateStr = new Date(r.date).toLocaleDateString();
                    
                    let componentsHtml = '-';
                    if (r.components && r.components.length > 0) {
                        componentsHtml = r.components.map(c => `${c.component_name}: <strong>${c.part_no}</strong>`).join('<br>');
                    } else if (r.part_no && r.part_no !== '-') {
                        componentsHtml = r.part_no;
                    }

                    ctTbody.innerHTML += `<tr><td>${dateStr}</td><td>${r.start_time||'-'}</td><td>${r.end_time||'-'}</td><td><strong>${r.cycle_sec||0}s</strong></td><td>${r.pause_sec||0}s</td><td>${r.pos||'-'}</td><td>${r.inspector||'-'}</td><td style="font-size: 11px; line-height: 1.4;">${componentsHtml}</td><td>${st}</td></tr>`;
                });
                if (data.cycleRecords.length === 0) ctTbody.innerHTML = '<tr><td colspan="9" style="color:var(--text-muted);padding:16px;">No cycle time records</td></tr>';
            }

            const dfTbody = document.getElementById('at-defect-tbody');
            if (dfTbody) {
                dfTbody.innerHTML = '';
                data.defects.forEach(d => {
                    const st = d.status === 'OPEN' ? '<span class="status-badge error">OPEN</span>' : '<span class="status-badge success">CLOSED</span>';
                    dfTbody.innerHTML += `<tr><td>${d.description||'-'}</td><td>${d.category||'-'}</td><td>${d.stage||'-'}</td><td>${d.shift||'-'}</td><td>${st}</td></tr>`;
                });
                if (data.defects.length === 0) dfTbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted);padding:16px;">No defects recorded</td></tr>';
            }

            showToast('info', 'Unit Found', `Showing records for ${nik}`);
        } catch (e) {
            showToast('error', 'Error', 'Failed to fetch traceability data');
        }
    });

   
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
    fetchShifts();
    fetchGroups();
    fetchUsers();
    fetchComponents();
    fetchStages();
    fetchVariants();
});
