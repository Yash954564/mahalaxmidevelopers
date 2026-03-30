document.addEventListener('DOMContentLoaded', () => {
    /* ===== AUTH LOGIC ===== */
    const AUTH = {
        email: 'szade3008@gmail.com',
        pass: 'Sachin@2026'
    };

    const loginForm = document.getElementById('loginForm');
    const loginScreen = document.getElementById('loginScreen');
    const dashboardScreen = document.getElementById('dashboardScreen');
    const userEmailSpan = document.getElementById('userEmail');
    const loginError = document.getElementById('loginError');

    // Check session
    const activeSession = localStorage.getItem('mahalaxmi_session');
    if (activeSession === AUTH.email) {
        showDashboard();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;

        if (email === AUTH.email && pass === AUTH.pass) {
            localStorage.setItem('mahalaxmi_session', email);
            showDashboard();
        } else {
            loginError.textContent = 'Invalid email or password.';
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('mahalaxmi_session');
        location.reload();
    });

    function showDashboard() {
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        userEmailSpan.textContent = AUTH.email;
        renderLeads();
    }

    /* ===== DASHBOARD LOGIC ===== */
    let currentEditId = null;

    function renderLeads() {
        const leads = LeadsAPI.getAllLeads();
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const tbody = document.getElementById('leadsBody');

        tbody.innerHTML = '';

        // Sort by timestamp desc
        const filtered = leads.filter(l => {
            const matchesSearch = 
                (l.data.name || '').toLowerCase().includes(searchTerm) ||
                (l.data.phone || l.data.mobile || '').toLowerCase().includes(searchTerm) ||
                (l.data.email || '').toLowerCase().includes(searchTerm);
            
            const matchesStatus = statusFilter === 'All' || l.status === statusFilter;

            return matchesSearch && matchesStatus;
        }).sort((a, b) => b.id - a.id);

        filtered.forEach(lead => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight:600">${lead.date || ''}</div>
                    <div style="font-size:12px;color:#888">${lead.time || ''}</div>
                </td>
                <td><span style="font-size:12px" class="badge">${lead.form_name}</span></td>
                <td><strong>${lead.data.name || '—'}</strong></td>
                <td><a href="tel:${lead.data.phone || lead.data.mobile}">${lead.data.phone || lead.data.mobile}</a></td>
                <td>${lead.data.email || '—'}</td>
                <td style="max-width:200px; font-size:12px">${lead.data.message || '—'}</td>
                <td><span class="status-badge status-${lead.status.toLowerCase().replace(' ', '-')}">${lead.status}</span></td>
                <td style="max-width:150px; font-size:12px">${lead.comments || '—'}</td>
                <td>
                    <button class="btn btn-sm btn-outline edit-btn" data-id="${lead.id}">Edit</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Bind edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });
    }

    /* ===== SEARCH & FILTERS ===== */
    document.getElementById('searchInput').addEventListener('input', renderLeads);
    document.getElementById('statusFilter').addEventListener('change', renderLeads);
    document.getElementById('refreshBtn').addEventListener('click', renderLeads);
    document.getElementById('exportCsvBtn').addEventListener('click', () => LeadsAPI.exportToCSV());

    /* ===== MODAL LOGIC ===== */
    const modal = document.getElementById('commentModal');
    const modalInfo = document.getElementById('modalLeadInfo');
    const statusUpdate = document.getElementById('modalStatusUpdate');
    const commentUpdate = document.getElementById('modalCommentUpdate');

    function openEditModal(id) {
        const lead = LeadsAPI.getAllLeads().find(l => l.id == id);
        if (!lead) return;

        currentEditId = id;
        modalInfo.innerHTML = `
            <strong>${lead.data.name || 'Unnamed'}</strong> | ${lead.data.phone || lead.data.mobile}<br>
            <small>${lead.form_name} - ${lead.date}</small>
        `;
        statusUpdate.value = lead.status;
        commentUpdate.value = lead.comments || '';
        modal.classList.remove('hidden');
    }

    document.getElementById('closeModalBtn').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    document.getElementById('saveCommentBtn').addEventListener('click', () => {
        if (currentEditId) {
            LeadsAPI.updateLead(Number(currentEditId), {
                status: statusUpdate.value,
                comments: commentUpdate.value
            });
            modal.classList.add('hidden');
            renderLeads();
        }
    });

    // Close on backdrop
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
});
