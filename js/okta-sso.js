/**
 * Okta OIDC - Authentification via Okta (OpenID Connect)
 * Restreint aux adresses @recommerce.com et @circularx.com
 */

const OKTA_CONFIG = {
    orgUrl: 'https://recommerce.okta-emea.com',
    clientId: '0oak5piofv1y5T47a0i7',
    redirectUri: window.location.origin + window.location.pathname,
    scopes: ['openid', 'profile', 'email'],
};

const ALLOWED_DOMAINS = ['recommerce.com', 'circularx.com'];
const OKTA_SESSION_KEY = 'onboarding_okta_session';

document.addEventListener('DOMContentLoaded', () => {
    const ssoGate = document.getElementById('sso-gate');
    const appContainer = document.getElementById('app-container');
    if (!ssoGate || !appContainer) return;

    // Vérifier si on revient d'une redirection Okta (token dans l'URL)
    const tokenFromUrl = parseTokenFromUrl();
    if (tokenFromUrl) {
        handleToken(tokenFromUrl);
        // Nettoyer l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    // Vérifier session existante
    const existingSession = getOktaSession();
    if (existingSession && !isSessionExpired(existingSession)) {
        showApp(existingSession);
        return;
    }

    // Afficher la gate
    ssoGate.style.display = 'flex';

    // Bouton de connexion
    const loginBtn = document.getElementById('okta-login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', startOktaLogin);
    }

    function startOktaLogin() {
        const state = generateRandomString(32);
        const nonce = generateRandomString(32);
        sessionStorage.setItem('okta_state', state);
        sessionStorage.setItem('okta_nonce', nonce);

        const authUrl = `${OKTA_CONFIG.orgUrl}/oauth2/default/v1/authorize?` +
            `client_id=${encodeURIComponent(OKTA_CONFIG.clientId)}` +
            `&response_type=id_token` +
            `&scope=${encodeURIComponent(OKTA_CONFIG.scopes.join(' '))}` +
            `&redirect_uri=${encodeURIComponent(OKTA_CONFIG.redirectUri)}` +
            `&state=${encodeURIComponent(state)}` +
            `&nonce=${encodeURIComponent(nonce)}` +
            `&response_mode=fragment`;

        window.location.href = authUrl;
    }

    function parseTokenFromUrl() {
        const hash = window.location.hash.substring(1);
        if (!hash) return null;

        const params = new URLSearchParams(hash);
        const idToken = params.get('id_token');
        const state = params.get('state');
        const error = params.get('error');

        if (error) {
            const errorEl = document.getElementById('sso-error');
            errorEl.textContent = params.get('error_description') || 'Erreur d\'authentification';
            errorEl.style.display = 'block';
            ssoGate.style.display = 'flex';
            return null;
        }

        if (!idToken) return null;

        // Vérifier le state
        const savedState = sessionStorage.getItem('okta_state');
        if (state !== savedState) {
            console.error('State mismatch - possible CSRF');
            return null;
        }

        sessionStorage.removeItem('okta_state');
        return idToken;
    }

    function handleToken(idToken) {
        const errorEl = document.getElementById('sso-error');

        try {
            const payload = decodeJwtPayload(idToken);

            // Vérifier le nonce
            const savedNonce = sessionStorage.getItem('okta_nonce');
            if (payload.nonce !== savedNonce) {
                errorEl.textContent = 'Erreur de sécurité (nonce invalide). Veuillez réessayer.';
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
            const session = {
                email: payload.email,
                name: payload.name || payload.preferred_username || payload.email,
                loggedAt: Date.now(),
                expiresAt: payload.exp * 1000,
            };

            localStorage.setItem(OKTA_SESSION_KEY, JSON.stringify(session));
            showApp(session);
        } catch (err) {
            errorEl.textContent = 'Erreur lors de l\'authentification. Veuillez réessayer.';
            errorEl.style.display = 'block';
            ssoGate.style.display = 'flex';
            console.error('Okta OIDC Error:', err);
        }
    }

    function showApp(session) {
        ssoGate.style.display = 'none';
        appContainer.style.display = 'flex';

        // Afficher l'utilisateur dans la sidebar
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (sidebarFooter) {
            sidebarFooter.innerHTML = `
                <div class="sso-user-info">
                    <span class="material-icons sso-avatar-icon">account_circle</span>
                    <div class="sso-user-details">
                        <span class="sso-user-name">${escapeHtml(session.name)}</span>
                        <span class="sso-user-email">${escapeHtml(session.email)}</span>
                    </div>
                </div>
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
        // Redirect to Okta logout
        const logoutUrl = `${OKTA_CONFIG.orgUrl}/oauth2/default/v1/logout?` +
            `client_id=${encodeURIComponent(OKTA_CONFIG.clientId)}` +
            `&post_logout_redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}`;
        window.location.href = logoutUrl;
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
