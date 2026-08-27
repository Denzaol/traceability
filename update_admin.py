import re

with open('public/admin.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update initAdminCharts
chart_replacement = """
    async function initAdminCharts() {
        if (dpuChartAdmin) dpuChartAdmin.destroy();
        if (drrChartAdmin) drrChartAdmin.destroy();

        const ctxDpu = document.getElementById('dpuChartAdmin')?.getContext('2d');
        const ctxDrr = document.getElementById('drrChartAdmin')?.getContext('2d');
        if (!ctxDpu || !ctxDrr) return;

        let kpiData = { dpuSeries: [], drrSeries: [], labels: [] };
        try {
            const res = await fetch('/api/dashboard/kpi');
            if (res.ok) kpiData = await res.json();
        } catch (e) {
            console.error("Failed to fetch KPI data", e);
        }

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
"""
content = re.sub(r'function initAdminCharts\(\) \{.*?\n    \}', chart_replacement.strip(), content, flags=re.DOTALL)


# 2. Replace everything from MOCK DATA STORE to end
crud_replacement = """
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
    document.getElementById('user-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('user-id').value;
        const data = {
            username: document.getElementById('user-username').value,
            password: document.getElementById('user-password').value,
            fullname: document.getElementById('user-fullname').value,
            role: document.getElementById('user-role').value,
            defaultGroup: document.getElementById('user-defaultgroup').value,
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
        document.getElementById('user-defaultgroup').value = u.defaultGroup;
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
            <td><span class="badge badge-cyan">${v.taktTime || 180}s</span></td>
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
            taktTime: parseInt(document.getElementById('variant-takttime').value) || 180,
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
        document.getElementById('variant-takttime').value = v.taktTime || 180;
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
    // CYCLE TIME RECORDS (FETCH API)
    // ============================================================
    async function renderCycleTimeRecords() {
        let records = [];
        try { records = JSON.parse(localStorage.getItem('cycleRecords') || '[]'); } catch(e) {}

        const filterDate = document.getElementById('ct-filter-date')?.value || '';
        const filterShift = document.getElementById('ct-filter-shift')?.value || 'all';
        const filterStage = document.getElementById('ct-filter-stage')?.value || 'all';

        let filtered = records;
        if (filterDate) filtered = filtered.filter(r => r.date === filterDate);
        if (filterShift !== 'all') filtered = filtered.filter(r => r.shift === filterShift);
        if (filterStage !== 'all') filtered = filtered.filter(r => r.pos === filterStage);

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
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${i + 1}</td>
                    <td>${r.date || '-'}</td>
                    <td><span class="tag">${r.nik || '-'}</span></td>
                    <td>${r.variant || '-'}</td>
                    <td>${r.pos || '-'}</td>
                    <td>${r.inspector || '-'}</td>
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

    document.getElementById('btn-filter-ct')?.addEventListener('click', () => {
        renderCycleTimeRecords();
        showToast('info', 'Filter Applied', 'Cycle time records filtered.');
    });

    document.getElementById('btn-export-ct')?.addEventListener('click', () => {
        showToast('success', 'CSV Export', 'Cycle time records exported.');
    });

    // ============================================================
    // ADMIN TRACEABILITY SEARCH (FETCH API)
    // ============================================================
    document.getElementById('btn-admin-trace-search')?.addEventListener('click', async () => {
        const nik = document.getElementById('admin-trace-nik')?.value.trim();
        if (!nik) { showToast('warning', 'Empty', 'Enter a NIK to search.'); return; }

        const resultsDiv = document.getElementById('admin-trace-results');
        const emptyDiv = document.getElementById('admin-trace-empty');
        if (!resultsDiv) return;

        let allRecords = [];
        try { allRecords = JSON.parse(localStorage.getItem('cycleRecords') || '[]'); } catch(e) {}
        const nikRecords = allRecords.filter(r => r.nik === nik);

        let nikDefects = [];
        try { 
            const allDefects = await apiFetch('/api/defects');
            nikDefects = allDefects.filter(d => d.nik === nik);
        } catch(e) {}

        if (nikRecords.length === 0 && nikDefects.length === 0) {
            if (emptyDiv) { emptyDiv.style.display = 'block'; emptyDiv.innerHTML = `<p style="color:var(--text-muted);padding:30px;"><i class="fa-solid fa-circle-info" style="margin-right:6px;"></i> No records found for <strong>${nik}</strong></p>`; }
            if (resultsDiv) resultsDiv.style.display = 'none';
            return;
        }

        if (emptyDiv) emptyDiv.style.display = 'none';
        resultsDiv.style.display = 'block';

        const firstRec = nikRecords[0] || {};
        document.getElementById('at-nik').textContent = nik;
        document.getElementById('at-variant').textContent = firstRec.variant || '-';
        document.getElementById('at-stage').textContent = firstRec.pos || '-';
        document.getElementById('at-drr').textContent = nikDefects.some(d => d.status === 'OPEN') ? 'NO' : 'YES';

        const ctTbody = document.getElementById('at-cycle-tbody');
        if (ctTbody) {
            ctTbody.innerHTML = '';
            nikRecords.forEach(r => {
                const st = r.status === 'OK' ? '<span class="status-badge success">OK</span>' : '<span class="status-badge error">OVER</span>';
                ctTbody.innerHTML += `<tr><td>${r.date||'-'}</td><td>${r.startTime||'-'}</td><td>${r.endTime||'-'}</td><td><strong>${r.cycleSec||0}s</strong></td><td>${r.pauseSec||0}s</td><td>${r.inspector||'-'}</td><td>${st}</td></tr>`;
            });
            if (nikRecords.length === 0) ctTbody.innerHTML = '<tr><td colspan="7" style="color:var(--text-muted);padding:16px;">No cycle time records</td></tr>';
        }

        const dfTbody = document.getElementById('at-defect-tbody');
        if (dfTbody) {
            dfTbody.innerHTML = '';
            nikDefects.forEach(d => {
                const st = d.status === 'OPEN' ? '<span class="status-badge error">OPEN</span>' : '<span class="status-badge success">CLOSED</span>';
                dfTbody.innerHTML += `<tr><td>${d.description||'-'}</td><td>${d.category||'-'}</td><td>${d.stage||'-'}</td><td>${d.shift||'-'}</td><td>${st}</td></tr>`;
            });
            if (nikDefects.length === 0) dfTbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-muted);padding:16px;">No defects recorded</td></tr>';
        }

        showToast('info', 'Unit Found', `Showing records for ${nik}`);
    });

    document.getElementById('admin-trace-nik')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btn-admin-trace-search')?.click(); }
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
"""
content = re.sub(r'    // ============================================================\n    // MOCK DATA STORE\n    // ============================================================.*', crud_replacement, content, flags=re.DOTALL)

with open('public/admin.js', 'w', encoding='utf-8') as f:
    f.write(content)

