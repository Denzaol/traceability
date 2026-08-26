document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const loginOverlay = document.getElementById('login-overlay');
    const appWrapper = document.getElementById('app-wrapper');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    
    const displayUser = document.getElementById('display-user');
    const displayShift = document.getElementById('display-shift');
    const displayGroup = document.getElementById('display-group');
    const timeDisplay = document.getElementById('current-time');
    
    // Initially hide main app behind overlay (in css, app-wrapper has opacity but overlay covers it. Let's ensure overlay works)
    appWrapper.classList.add('hidden');
    
    // Mock Login Handler
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const shift = document.getElementById('shift').value;
        const group = document.getElementById('group').value;
        
        if(username && shift && group) {
            // Populate Context
            displayUser.textContent = username.toUpperCase();
            displayShift.textContent = shift;
            displayGroup.textContent = group;
            
            // Transition
            loginOverlay.classList.remove('active');
            setTimeout(() => {
                appWrapper.classList.remove('hidden');
                initCharts(); // Initialize charts after container is visible
            }, 300);
        }
    });
    
    // Mock Logout Handler
    logoutBtn.addEventListener('click', () => {
        appWrapper.classList.add('hidden');
        setTimeout(() => {
            loginOverlay.classList.add('active');
            loginForm.reset();
        }, 300);
    });
    
    // Live Clock
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });
        timeDisplay.textContent = timeString;
    }
    setInterval(updateTime, 1000);
    updateTime();

    // Chart.js Configuration
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    let dpuChartInstance = null;
    let drrChartInstance = null;

    function initCharts() {
        if(dpuChartInstance) dpuChartInstance.destroy();
        if(drrChartInstance) drrChartInstance.destroy();

        const ctxDpu = document.getElementById('dpuChart').getContext('2d');
        const ctxDrr = document.getElementById('drrChart').getContext('2d');
        
        // Gradient for DPU (Orange)
        const gradientDpu = ctxDpu.createLinearGradient(0, 0, 0, 400);
        gradientDpu.addColorStop(0, 'rgba(245, 158, 11, 0.5)');
        gradientDpu.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
        
        // Gradient for DRR (Green)
        const gradientDrr = ctxDrr.createLinearGradient(0, 0, 0, 400);
        gradientDrr.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
        gradientDrr.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

        // Mock Data for "Shift" view
        const labels = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
        
        // DPU Chart (Target around 0.05)
        dpuChartInstance = new Chart(ctxDpu, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'DPU',
                    data: [0.03, 0.04, 0.035, 0.05, 0.045, 0.06, 0.045, 0.045],
                    borderColor: '#f59e0b',
                    backgroundColor: gradientDpu,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0f172a',
                    pointBorderColor: '#f59e0b',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });

        // DRR Chart (Target around 95%)
        drrChartInstance = new Chart(ctxDrr, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'DRR (%)',
                    data: [99, 98.5, 99.2, 97.5, 98.0, 96.0, 97.2, 97.2],
                    borderColor: '#10b981',
                    backgroundColor: gradientDrr,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0f172a',
                    pointBorderColor: '#10b981',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        min: 90,
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }
});
