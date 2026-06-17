/**
 * Okta OIDC - Authentification via Okta (Implicit Flow)
 * Restreint aux adresses @recommerce.com et @circularx.com
 * Simple : une redirection, pas d'échange de token côté client
 */

const OKTA_CONFIG = {
    orgUrl: 'https://login.recommerce.com',
    clientId: '0oak5r1481CKBgoeM0i7',
    redirectUri: window.location.origin + window.location.pathname,
    scopes: ['openid', 'email', 'groups'],
};

const ALLOWED_DOMAINS = ['recommerce.com', 'circularx.com'];
const ADMIN_GROUP = 'SysOps';
const OKTA_SESSION_KEY = 'onboarding_okta_session';

document.addEventListener('DOMContentLoaded', () => {
    const ssoGate = document.getElementById('sso-gate');
    const appContainer = document.getElementById('app-container');
    if (!ssoGate || !appContainer) return;

    console.log('[SSO] Page loaded. URL:', window.location.href);
    console.log('[SSO] Hash:', window.location.hash);
    console.log('[SSO] Search:', window.location.search);

    // 1. Vérifier si on revient d'Okta avec un id_token dans le hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const idToken = hashParams.get('id_token');
    const returnedState = hashParams.get('state');
    const error = hashParams.get('error') || hashParams.get('error_description');

    // Gérer le paramètre iss (3rd party initiated login depuis dashboard Okta)
    const urlParams = new URLSearchParams(window.location.search);
    const issParam = urlParams.get('iss');
    // Aussi vérifier error dans les query params (certaines configs Okta renvoient l'erreur ici)
    const queryError = urlParams.get('error');
    const queryErrorDesc = urlParams.get('error_description');

    if (queryError) {
        console.error('[SSO] Query error:', queryError, queryErrorDesc);
        const errorEl = document.getElementById('sso-error');
        errorEl.textContent = queryErrorDesc || queryError;
        errorEl.style.display = 'block';
        sessionStorage.removeItem('okta_login_attempted');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (issParam) {
        console.log('[SSO] ISS parameter detected, cleaning URL');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (error) {
        const errorEl = document.getElementById('sso-error');
        errorEl.textContent = hashParams.get('error_description') || 'Erreur d\'authentification';
        errorEl.style.display = 'block';
        ssoGate.style.display = 'flex';
        sessionStorage.removeItem('okta_login_attempted');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (idToken && returnedState) {
        handleToken(idToken, returnedState);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    // 2. Vérifier session existante
    const existingSession = getOktaSession();
    if (existingSession && !isSessionExpired(existingSession)) {
        showApp(existingSession);
        return;
    }

    // 3. Auto-login (première visite ou arrivée depuis dashboard Okta)
    if (!sessionStorage.getItem('okta_login_attempted')) {
        sessionStorage.setItem('okta_login_attempted', '1');
        startOktaLogin();
        return;
    }
    sessionStorage.removeItem('okta_login_attempted');

    // 4. Fallback : afficher la gate avec bouton
    ssoGate.style.display = 'flex';
    const loginBtn = document.getElementById('okta-login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', startOktaLogin);
    }

    function startOktaLogin() {
        try {
            const state = generateRandomString(32);
            const nonce = generateRandomString(32);
            sessionStorage.setItem('okta_state', state);
            sessionStorage.setItem('okta_nonce', nonce);

            const redirectUri = window.location.origin + window.location.pathname;

            // Essayer d'abord avec le custom domain, fallback sur okta-emea
            const authUrl = `https://login.recommerce.com/oauth2/v1/authorize?` +
                `client_id=${encodeURIComponent(OKTA_CONFIG.clientId)}` +
                `&response_type=id_token` +
                `&scope=${encodeURIComponent(OKTA_CONFIG.scopes.join(' '))}` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&state=${encodeURIComponent(state)}` +
                `&nonce=${encodeURIComponent(nonce)}` +
                `&response_mode=fragment`;

            console.log('[SSO] Redirecting to:', authUrl);
            window.location.href = authUrl;
        } catch (err) {
            console.error('[SSO] startOktaLogin error:', err);
            alert('Erreur SSO: ' + err.message);
        }
    }

    function handleToken(idToken, state) {
        const errorEl = document.getElementById('sso-error');

        // Vérifier le state
        const savedState = sessionStorage.getItem('okta_state');
        if (state !== savedState) {
            errorEl.textContent = 'Erreur de sécurité. Veuillez réessayer.';
            errorEl.style.display = 'block';
            ssoGate.style.display = 'flex';
            return;
        }
        sessionStorage.removeItem('okta_state');

        try {
            const payload = decodeJwtPayload(idToken);
            console.log('[SSO] Token payload:', payload);
            console.log('[SSO] Groups in token:', payload.groups);
            // Vérifier le nonce
            const savedNonce = sessionStorage.getItem('okta_nonce');
            if (payload.nonce !== savedNonce) {
                errorEl.textContent = 'Erreur de sécurité (nonce). Veuillez réessayer.';
                errorEl.style.display = 'block';
                ssoGate.style.display = 'flex';
                return;
            }
            sessionStorage.removeItem('okta_nonce');

            // Vérifier le domaine
            const emailDomain = (payload.email || '').split('@')[1];
            if (!emailDomain || !ALLOWED_DOMAINS.includes(emailDomain)) {
                errorEl.textContent = 'Seules les adresses @recommerce.com et @circularx.com sont autorisées.';
                errorEl.style.display = 'block';
                ssoGate.style.display = 'flex';
                return;
            }

            // Créer la session
            const userGroups = payload.groups || [];
            const isAdmin = userGroups.includes(ADMIN_GROUP);
            const session = {
                email: payload.email,
                name: payload.name || payload.preferred_username || payload.email,
                role: isAdmin ? 'admin' : 'member',
                groups: userGroups,
                loggedAt: Date.now(),
                expiresAt: payload.exp * 1000,
            };

            localStorage.setItem(OKTA_SESSION_KEY, JSON.stringify(session));
            sessionStorage.removeItem('okta_login_attempted');
            showApp(session);
        } catch (err) {
            errorEl.textContent = 'Erreur lors de l\'authentification.';
            errorEl.style.display = 'block';
            ssoGate.style.display = 'flex';
            console.error('Okta Error:', err);
        }
    }

    function showApp(session) {
        ssoGate.style.display = 'none';
        appContainer.style.display = 'flex';

        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (sidebarFooter) {
            const adminLink = session.role === 'admin'
                ? `<a href="admin.html" class="sidebar-link"><span class="material-icons">dashboard</span><span>Dashboard Admin</span></a>`
                : '';
            sidebarFooter.innerHTML = `
                <div class="sso-user-info">
                    <span class="material-icons sso-avatar-icon">account_circle</span>
                    <div class="sso-user-details">
                        <span class="sso-user-name">${escapeHtml(session.name)}</span>
                        <span class="sso-user-email">${escapeHtml(session.email)}${session.role === 'admin' ? ' (admin)' : ''}</span>
                    </div>
                </div>
                ${adminLink}
                <button class="sidebar-link" id="sso-logout">
                    <span class="material-icons">logout</span>
                    <span>Déconnexion</span>
                </button>
            `;
            document.getElementById('sso-logout').addEventListener('click', oktaLogout);
        }
    }

    function oktaLogout() {
        localStorage.removeItem(OKTA_SESSION_KEY);
        window.location.href = `${OKTA_CONFIG.orgUrl}/login/signout?fromURI=${encodeURIComponent(OKTA_CONFIG.redirectUri)}`;
    }

    function getOktaSession() {
        const data = localStorage.getItem(OKTA_SESSION_KEY);
        return data ? JSON.parse(data) : null;
    }

    function isSessionExpired(session) {
        return session.expiresAt && Date.now() > session.expiresAt;
    }

    function decodeJwtPayload(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );
        return JSON.parse(jsonPayload);
    }

    function generateRandomString(length) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(36)).join('').substring(0, length);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
});
