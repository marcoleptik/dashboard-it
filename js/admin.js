document.addEventListener('DOMContentLoaded', () => {
    // Check auth - support both legacy Auth and Okta SSO session
    const oktaSession = localStorage.getItem('onboarding_okta_session');
    let session;

    if (oktaSession) {
        session = JSON.parse(oktaSession);
        const userGroups = session.groups || [];
        const isITAdmin = userGroups.includes('Dashboard IT Admin');
        const isRH = userGroups.includes('Recommerce Solutions (FR) - Ressources Humaines');
        if (!isITAdmin && !isRH) {
            alert('Accès réservé aux administrateurs.');
            window.location.href = 'index.html';
            return;
        }
    } else {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('sidebar-user-email').textContent = session.email || '';

    // Logout
    document.getElementById('btn-logout').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('onboarding_okta_session');
        window.location.href = 'index.html';
    });

    // Show restricted tabs if user is Dashboard IT Admin
    const userGroups = session.groups || [];
    const isITAdmin = userGroups.includes('Dashboard IT Admin');
    if (isITAdmin) {
        document.querySelectorAll('.restricted-tab').forEach(tab => {
            tab.style.display = 'flex';
        });
    }

    // ===== Tab Navigation (sidebar) =====
    document.querySelectorAll('#admin-nav-list .step-item').forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;
            document.querySelectorAll('#admin-nav-list .step-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            item.classList.add('active');
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

    // ===== Material Tab =====
    function getMaterialSubmissions() {
        return JSON.parse(localStorage.getItem('material_submissions') || '[]');
    }

    function renderMaterial(filter = '') {
        const submissions = getMaterialSubmissions();
        const tbody = document.getElementById('material-body');
        const noData = document.getElementById('no-material');
        const filterLower = filter.toLowerCase();

        const filtered = filter
            ? submissions.filter(s =>
                (s.firstname + ' ' + s.lastname + ' ' + s.email + ' ' + s.type + ' ' + s.reason + ' ' + (s.items || []).join(' '))
                    .toLowerCase().includes(filterLower)
            )
            : submissions;

        // Stats
        const today = new Date().toISOString().slice(0, 10);
        const month = new Date().toISOString().slice(0, 7);
        document.getElementById('stat-mat-total').textContent = submissions.length;
        document.getElementById('stat-mat-today').textContent = submissions.filter(s => (s.submittedAt || '').slice(0, 10) === today).length;
        document.getElementById('stat-mat-month').textContent = submissions.filter(s => (s.submittedAt || '').slice(0, 7) === month).length;

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
                    <td>${escapeHtml(s.firstname)}</td>
                    <td>${escapeHtml(s.lastname)}</td>
                    <td>${escapeHtml(s.email)}</td>
                    <td><span class="badge">${escapeHtml(s.type)}</span></td>
                    <td>${escapeHtml(s.reason)}</td>
                    <td>${escapeHtml((s.items || []).join(', '))}</td>
                    <td class="actions-cell">
                        <button class="btn-icon" title="Voir le détail" data-action="view-mat" data-id="${s.id}">
                            <span class="material-icons">visibility</span>
                        </button>
                        <button class="btn-icon btn-icon-danger" title="Supprimer" data-action="delete-mat" data-id="${s.id}">
                            <span class="material-icons">delete</span>
                        </button>
                    </td>
                </tr>
            `).join('');

        // Attach events
        tbody.querySelectorAll('[data-action="view-mat"]').forEach(btn => {
            btn.addEventListener('click', () => showMaterialDetail(btn.dataset.id));
        });
        tbody.querySelectorAll('[data-action="delete-mat"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Supprimer cette demande ?')) {
                    const subs = getMaterialSubmissions().filter(s => s.id !== btn.dataset.id);
                    localStorage.setItem('material_submissions', JSON.stringify(subs));
                    renderMaterial(filter);
                }
            });
        });
    }

    function showMaterialDetail(id) {
        const submissions = getMaterialSubmissions();
        const s = submissions.find(sub => sub.id === id);
        if (!s) return;

        const modal = document.getElementById('detail-modal');
        const body = document.getElementById('modal-body');

        body.innerHTML = `
            <div class="detail-grid">
                <div class="detail-section">
                    <h3><span class="material-icons">person</span> Demandeur</h3>
                    <div class="detail-row"><span class="label">Prénom</span><span class="value">${escapeHtml(s.firstname)}</span></div>
                    <div class="detail-row"><span class="label">Nom</span><span class="value">${escapeHtml(s.lastname)}</span></div>
                    <div class="detail-row"><span class="label">Email</span><span class="value">${escapeHtml(s.email)}</span></div>
                </div>
                <div class="detail-section">
                    <h3><span class="material-icons">devices</span> Demande</h3>
                    <div class="detail-row"><span class="label">Lieu</span><span class="value">${escapeHtml(s.type)}</span></div>
                    <div class="detail-row"><span class="label">Raison</span><span class="value">${escapeHtml(s.reason)}</span></div>
                    <div class="detail-row"><span class="label">Matériel</span><span class="value">${escapeHtml((s.items || []).join(', '))}</span></div>
                    ${s.comment ? `<div class="detail-row"><span class="label">Commentaire</span><span class="value">${escapeHtml(s.comment)}</span></div>` : ''}
                </div>
            </div>
            <div class="detail-footer">
                <span class="text-muted">Soumis le ${formatDateTime(s.submittedAt)}</span>
            </div>
        `;

        modal.style.display = 'flex';
    }

    // Search material
    document.getElementById('search-material').addEventListener('input', (e) => {
        renderMaterial(e.target.value);
    });

    renderMaterial();

    // ===== Licences Tab =====
    function getLicences() {
        return JSON.parse(localStorage.getItem('licences') || '[]');
    }

    function saveLicences(licences) {
        localStorage.setItem('licences', JSON.stringify(licences));
    }

    function renderLicences() {
        const licences = getLicences();
        const winLicences = licences.filter(l => l.type === 'Windows 11 Pro');
        const officeLicences = licences.filter(l => l.type === 'Microsoft Office 365');

        // Windows stats
        const winTotal = winLicences.reduce((sum, l) => sum + l.totalUses, 0);
        const winUsed = winLicences.reduce((sum, l) => sum + l.usedCount, 0);
        document.getElementById('licence-win-total').textContent = winTotal;
        document.getElementById('licence-win-used').textContent = winUsed;
        document.getElementById('licence-win-available').textContent = winTotal - winUsed;

        // Office stats
        const officeTotal = officeLicences.reduce((sum, l) => sum + l.totalUses, 0);
        const officeUsed = officeLicences.reduce((sum, l) => sum + l.usedCount, 0);
        document.getElementById('licence-office-total').textContent = officeTotal;
        document.getElementById('licence-office-used').textContent = officeUsed;
        document.getElementById('licence-office-available').textContent = officeTotal - officeUsed;

        // Render Windows table
        renderLicenceTable('licence-win-body', 'no-licence-win', winLicences);
        // Render Office table
        renderLicenceTable('licence-office-body', 'no-licence-office', officeLicences);
    }

    function renderLicenceTable(tbodyId, emptyId, licences) {
        const tbody = document.getElementById(tbodyId);
        const empty = document.getElementById(emptyId);

        if (licences.length === 0) {
            tbody.innerHTML = '';
            empty.style.display = 'flex';
            return;
        }

        empty.style.display = 'none';
        tbody.innerHTML = licences.map(l => {
            const remaining = l.totalUses - l.usedCount;
            const exhausted = remaining <= 0;
            return `
                <tr>
                    <td>
                        <span class="licence-key-display" data-key="${escapeHtml(l.key)}" title="Cliquer pour copier">
                            <span class="material-icons">content_copy</span>
                            ${escapeHtml(l.key)}
                        </span>
                    </td>
                    <td>${escapeHtml(l.type)}</td>
                    <td>
                        <span class="licence-count-badge ${exhausted ? 'exhausted' : ''}">
                            ${l.usedCount} / ${l.totalUses} utilisée(s)
                        </span>
                    </td>
                    <td><span class="badge">${exhausted ? 'Épuisée' : 'Disponible'}</span></td>
                    <td class="actions-cell">
                        ${!exhausted ? `
                            <button class="btn-icon" title="Utiliser une licence" data-action="use-licence" data-id="${l.id}">
                                <span class="material-icons">remove_circle_outline</span>
                            </button>
                        ` : ''}
                        ${l.usedCount > 0 ? `
                            <button class="btn-icon" title="Libérer une licence" data-action="free-licence" data-id="${l.id}">
                                <span class="material-icons">add_circle_outline</span>
                            </button>
                        ` : ''}
                        <button class="btn-icon btn-icon-danger" title="Supprimer" data-action="delete-licence" data-id="${l.id}">
                            <span class="material-icons">delete</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Copy key on click
        tbody.querySelectorAll('.licence-key-display').forEach(el => {
            el.addEventListener('click', () => {
                navigator.clipboard.writeText(el.dataset.key).then(() => {
                    const icon = el.querySelector('.material-icons');
                    icon.textContent = 'check';
                    setTimeout(() => { icon.textContent = 'content_copy'; }, 1500);
                });
            });
        });

        // Use licence
        tbody.querySelectorAll('[data-action="use-licence"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const licences = getLicences();
                const lic = licences.find(l => l.id === btn.dataset.id);
                if (lic && lic.usedCount < lic.totalUses) {
                    lic.usedCount++;
                    saveLicences(licences);
                    renderLicences();
                }
            });
        });

        // Free licence
        tbody.querySelectorAll('[data-action="free-licence"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const licences = getLicences();
                const lic = licences.find(l => l.id === btn.dataset.id);
                if (lic && lic.usedCount > 0) {
                    lic.usedCount--;
                    saveLicences(licences);
                    renderLicences();
                }
            });
        });

        // Delete licence
        tbody.querySelectorAll('[data-action="delete-licence"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Supprimer cette licence ?')) {
                    const licences = getLicences().filter(l => l.id !== btn.dataset.id);
                    saveLicences(licences);
                    renderLicences();
                }
            });
        });
    }

    renderLicences();
});
