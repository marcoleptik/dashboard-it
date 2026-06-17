document.addEventListener('DOMContentLoaded', () => {
    // Check auth - support both legacy Auth and Okta SSO session
    const oktaSession = localStorage.getItem('onboarding_okta_session');
    let session;

    if (oktaSession) {
        session = JSON.parse(oktaSession);
        if (session.role !== 'admin') {
            alert('Accès réservé aux administrateurs.');
            window.location.href = 'index.html';
            return;
        }
    } else if (Auth && Auth.isLoggedIn()) {
        session = Auth.getSession();
        if (session.role !== 'admin') {
            alert('Accès réservé aux administrateurs.');
            window.location.href = 'index.html';
            return;
        }
    } else {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('admin-user-name').textContent = session.name || session.email;

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('onboarding_okta_session');
        if (Auth && Auth.isLoggedIn()) Auth.logout();
        else window.location.href = 'index.html';
    });

    // Admin-only features
    if (session.role === 'admin') {
        document.getElementById('btn-manage-users').style.display = 'inline-flex';
    }

    // Toggle user management
    document.getElementById('btn-manage-users').addEventListener('click', () => {
        const section = document.getElementById('users-section');
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
        if (section.style.display === 'block') renderUsers();
    });

    // Render submissions
    function renderSubmissions(filter = '') {
        const submissions = Submissions.getAll();
        const tbody = document.getElementById('submissions-body');
        const noData = document.getElementById('no-submissions');
        const filterLower = filter.toLowerCase();

        const filtered = filter
            ? submissions.filter(s =>
                (s.data.firstname + ' ' + s.data.lastname + ' ' + s.data.personalEmail + ' ' + s.data.contractType + ' ' + s.data.jobTitle)
                    .toLowerCase().includes(filterLower)
            )
            : submissions;

        // Stats
        const today = new Date().toISOString().slice(0, 10);
        const month = new Date().toISOString().slice(0, 7);
        document.getElementById('stat-total').textContent = submissions.length;
        document.getElementById('stat-today').textContent = submissions.filter(s => s.submittedAt.slice(0, 10) === today).length;
        document.getElementById('stat-month').textContent = submissions.filter(s => s.submittedAt.slice(0, 7) === month).length;

        if (filtered.length === 0) {
            tbody.innerHTML = '';
            noData.style.display = 'flex';
            return;
        }

        noData.style.display = 'none';
        tbody.innerHTML = filtered
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
            .map(s => `
                <tr>
                    <td>${formatDateTime(s.submittedAt)}</td>
                    <td>${escapeHtml(s.data.firstname)}</td>
                    <td>${escapeHtml(s.data.lastname)}</td>
                    <td>${escapeHtml(s.data.personalEmail)}</td>
                    <td><span class="badge">${escapeHtml(s.data.contractType)}</span></td>
                    <td>${escapeHtml(s.data.jobTitle)}</td>
                    <td class="actions-cell">
                        <button class="btn-icon" title="Voir le détail" data-action="view" data-id="${s.id}">
                            <span class="material-icons">visibility</span>
                        </button>
                        <button class="btn-icon btn-icon-danger" title="Supprimer" data-action="delete" data-id="${s.id}">
                            <span class="material-icons">delete</span>
                        </button>
                    </td>
                </tr>
            `).join('');

        // Attach events
        tbody.querySelectorAll('[data-action="view"]').forEach(btn => {
            btn.addEventListener('click', () => showDetail(btn.dataset.id));
        });
        tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Supprimer cette soumission ?')) {
                    Submissions.remove(btn.dataset.id);
                    renderSubmissions(filter);
                }
            });
        });
    }

    // Search
    document.getElementById('search-submissions').addEventListener('input', (e) => {
        renderSubmissions(e.target.value);
    });

    // Show detail modal
    function showDetail(id) {
        const submission = Submissions.getById(id);
        if (!submission) return;

        const modal = document.getElementById('detail-modal');
        const body = document.getElementById('modal-body');
        const d = submission.data;

        body.innerHTML = `
            <div class="detail-grid">
                <div class="detail-section">
                    <h3><span class="material-icons">person</span> Informations personnelles</h3>
                    <div class="detail-row"><span class="label">Prénom</span><span class="value">${escapeHtml(d.firstname)}</span></div>
                    <div class="detail-row"><span class="label">Nom</span><span class="value">${escapeHtml(d.lastname)}</span></div>
                    <div class="detail-row"><span class="label">Email personnel</span><span class="value">${escapeHtml(d.personalEmail)}</span></div>
                    <div class="detail-row"><span class="label">Email pro</span><span class="value">${escapeHtml(d.proEmail || '-')}</span></div>
                    <div class="detail-row"><span class="label">Date d'arrivée</span><span class="value">${escapeHtml(d.startDate)}</span></div>
                    <div class="detail-row"><span class="label">Date de fin</span><span class="value">${escapeHtml(d.endDate || 'Non définie')}</span></div>
                </div>
                <div class="detail-section">
                    <h3><span class="material-icons">work</span> Contrat & Poste</h3>
                    <div class="detail-row"><span class="label">Contrat</span><span class="value">${escapeHtml(d.contractType)}</span></div>
                    <div class="detail-row"><span class="label">Poste</span><span class="value">${escapeHtml(d.jobTitle)}</span></div>
                    <div class="detail-row"><span class="label">Lieu</span><span class="value">${escapeHtml(d.workplace)}</span></div>
                </div>
                <div class="detail-section">
                    <h3><span class="material-icons">computer</span> Matériel</h3>
                    <div class="detail-row"><span class="label">Laptop</span><span class="value">${escapeHtml(d.laptopNeeded)}</span></div>
                    ${d.laptopNeeded === 'Oui' ? `
                        <div class="detail-row"><span class="label">Profil</span><span class="value">${escapeHtml(d.laptopProfile)}</span></div>
                        <div class="detail-row"><span class="label">OS</span><span class="value">${escapeHtml(d.laptopOs)}</span></div>
                    ` : ''}
                    <div class="detail-row"><span class="label">Casque</span><span class="value">${escapeHtml(d.headsetNeeded)}</span></div>
                    <div class="detail-row"><span class="label">Bureau</span><span class="value">${escapeHtml((d.deskMaterial || []).join(', ') || 'Aucun')}</span></div>
                </div>
                <div class="detail-section">
                    <h3><span class="material-icons">apps</span> Applications</h3>
                    <div class="detail-tags">
                        ${[...(d.appsFinance || []), ...(d.appsAchats || []), ...(d.appsVentes || []), ...(d.appsPricing || []), ...(d.appsDsi || []), ...(d.appsTransverses || [])].map(a => `<span class="badge">${escapeHtml(a)}</span>`).join('') || '<span class="text-muted">Aucune</span>'}
                    </div>
                </div>
                <div class="detail-section">
                    <h3><span class="material-icons">mail</span> Backoffice & Mailing</h3>
                    <div class="detail-row"><span class="label">Backoffice</span><span class="value">${escapeHtml(d.backofficeNeeded)}</span></div>
                    ${d.backofficeNeeded === 'Oui' ? `<div class="detail-row"><span class="label">Profil référent</span><span class="value">${escapeHtml(d.backofficeProfile)}</span></div>` : ''}
                    <div class="detail-row"><span class="label">Mailing list</span><span class="value">${escapeHtml(d.mailingNeeded)}</span></div>
                    ${d.mailingNeeded === 'Oui' ? `<div class="detail-row"><span class="label">Listes</span><span class="value">${escapeHtml(d.mailingLists)}</span></div>` : ''}
                </div>
            </div>
            <div class="detail-footer">
                <span class="text-muted">Soumis le ${formatDateTime(submission.submittedAt)}</span>
            </div>
        `;

        modal.style.display = 'flex';
    }

    // Close modal
    document.getElementById('modal-close').addEventListener('click', () => {
        document.getElementById('detail-modal').style.display = 'none';
    });
    document.getElementById('detail-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            e.currentTarget.style.display = 'none';
        }
    });

    // User management
    function renderUsers() {
        const users = Auth.getAllUsers();
        const tbody = document.getElementById('users-body');
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>${escapeHtml(u.name)}</td>
                <td>${escapeHtml(u.email)}</td>
                <td><span class="badge badge-${u.role}">${u.role}</span></td>
                <td class="actions-cell">
                    ${u.email !== session.email ? `
                        <button class="btn-icon btn-icon-danger" title="Supprimer" data-action="remove-user" data-email="${escapeHtml(u.email)}">
                            <span class="material-icons">delete</span>
                        </button>
                    ` : '<span class="text-muted">Vous</span>'}
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('[data-action="remove-user"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Supprimer cet utilisateur ?')) {
                    Auth.removeUser(btn.dataset.email);
                    renderUsers();
                }
            });
        });
    }

    // Add user
    document.getElementById('btn-add-user').addEventListener('click', () => {
        const name = document.getElementById('new-user-name').value.trim();
        const email = document.getElementById('new-user-email').value.trim();
        const password = document.getElementById('new-user-password').value;
        const role = document.getElementById('new-user-role').value;
        const errorEl = document.getElementById('add-user-error');

        if (!name || !email || !password) {
            errorEl.textContent = 'Tous les champs sont requis';
            errorEl.style.display = 'block';
            return;
        }
        if (password.length < 6) {
            errorEl.textContent = 'Le mot de passe doit faire au moins 6 caractères';
            errorEl.style.display = 'block';
            return;
        }

        const result = Auth.addUser(email, password, name, role);
        if (result.success) {
            errorEl.style.display = 'none';
            document.getElementById('new-user-name').value = '';
            document.getElementById('new-user-email').value = '';
            document.getElementById('new-user-password').value = '';
            renderUsers();
        } else {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
        }
    });

    // Helpers
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    function formatDateTime(isoStr) {
        const d = new Date(isoStr);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    // Init
    renderSubmissions();
});
