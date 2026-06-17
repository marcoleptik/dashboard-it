// Emails ayant accès aux onglets restreints (Licences, Stock PC, Fiscalité)
const RESTRICTED_EMAILS = [
    'marc.huteau@recommerce.com',
    'gael.donat@recommerce.com',
    'ange.bayoro@recommerce.com',
];

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
    } else if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
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
        if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) Auth.logout();
        else window.location.href = 'index.html';
    });

    // Show restricted tabs if user has access
    const hasRestrictedAccess = RESTRICTED_EMAILS.includes((session.email || '').toLowerCase());
    if (hasRestrictedAccess) {
        document.querySelectorAll('.restricted-tab').forEach(tab => {
            tab.style.display = 'inline-flex';
        });
    }

    // ===== Tab Navigation =====
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const content = document.getElementById('tab-' + tabId);
            if (content) content.classList.add('active');
        });
    });

    // ===== Sub-tab Navigation =====
    document.querySelectorAll('.sub-tabs').forEach(container => {
        container.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const subtabId = btn.dataset.subtab;
                container.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
                container.parentElement.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const content = document.getElementById('subtab-' + subtabId);
                if (content) content.classList.add('active');
            });
        });
    });

    // ===== Onboarding Tab: Submissions =====
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
