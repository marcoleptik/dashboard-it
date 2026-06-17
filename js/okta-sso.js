/**
 * Okta OIDC - Authentification via Okta (Authorization Code + PKCE)
 * Restreint aux adresses @recommerce.com et @circularx.com
 */

const OKTA_CONFIG = {
    orgUrl: 'https://recommerce.okta-emea.com',
    clientId: '0oak5qmvc2PvJUdAF0i7',
    redirectUri: window.location.origin + window.location.pathname,
    scopes: ['openid', 'profile', 'email'],
    // Utiliser 'default' pour le Custom Authorization Server, ou '' pour le Org Authorization Server
    authServerId: 'default',
};

function getAuthBaseUrl() {
    return OKTA_CONFIG.authServerId
        ? `${OKTA_CONFIG.orgUrl}/oauth2/${OKTA_CONFIG.authServerId}/v1`
        : `${OKTA_CONFIG.orgUrl}/oauth2/v1`;
}

const ALLOWED_DOMAINS = ['recommerce.com', 'circularx.com'];
const OKTA_SESSION_KEY = 'onboarding_okta_session';

document.addEventListener('DOMContentLoaded', async () => {
    const ssoGate = document.getElementById('sso-gate');
    const appContainer = document.getElementById('app-container');
    if (!ssoGate || !appContainer) return;

    // Vérifier si on revient d'une redirection Okta (code dans l'URL)
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const returnedState = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
        const errorEl = document.getElementById('sso-error');
        errorEl.textContent = urlParams.get('error_description') || 'Erreur d\'authentification';
        errorEl.style.display = 'block';
        ssoGate.style.display = 'flex';
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    if (authCode && returnedState) {
        await handleAuthCode(authCode, returnedState);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
    }

    // Vérifier session existante
    const existingSession = getOktaSession();
    if (existingSession && !isSessionExpired(existingSession)) {
        showApp(existingSession);
        return;
    }

    // Si pas de session et pas d'erreur, lancer automatiquement le login Okta
    // (ex: l'utilisateur arrive depuis le dashboard Okta)
    if (!error && !sessionStorage.getItem('okta_login_attempted')) {
        sessionStorage.setItem('okta_login_attempted', '1');
        await startOktaLogin();
        return;
    }
    sessionStorage.removeItem('okta_login_attempted');

    // Afficher la gate (fallback si auto-login échoue)
    ssoGate.style.display = 'flex';

    // Bouton de connexion
    const loginBtn = document.getElementById('okta-login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', startOktaLogin);
    }

    async function startOktaLogin() {
        const state = generateRandomString(32);
        const codeVerifier = generateRandomString(64);
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        sessionStorage.setItem('okta_state', state);
        sessionStorage.setItem('okta_code_verifier', codeVerifier);

        const authUrl = `${getAuthBaseUrl()}/authorize?` +
            `client_id=${encodeURIComponent(OKTA_CONFIG.clientId)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(OKTA_CONFIG.scopes.join(' '))}` +
            `&redirect_uri=${encodeURIComponent(OKTA_CONFIG.redirectUri)}` +
            `&state=${encodeURIComponent(state)}` +
            `&code_challenge=${encodeURIComponent(codeChallenge)}` +
            `&code_challenge_method=S256`;

        window.location.href = authUrl;
    }

    async function handleAuthCode(code, state) {
        const errorEl = document.getElementById('sso-error');

        // Vérifier le state
        const savedState = sessionStorage.getItem('okta_state');
        if (state !== savedState) {
            errorEl.textContent = 'Erreur de sécurité (state invalide). Veuillez réessayer.';
            errorEl.style.display = 'block';
            ssoGate.style.display = 'flex';
            return;
        }
        sessionStorage.removeItem('okta_state');

        const codeVerifier = sessionStorage.getItem('okta_code_verifier');
        sessionStorage.removeItem('okta_code_verifier');

        try {
            // Échanger le code contre des tokens
            const tokenUrl = `${getAuthBaseUrl()}/token`;
            console.log('Token exchange URL:', tokenUrl);
            const tokenResponse = await fetch(tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: OKTA_CONFIG.clientId,
                    code: code,
                    redirect_uri: OKTA_CONFIG.redirectUri,
                    code_verifier: codeVerifier,
                }),
            });

            if (!tokenResponse.ok) {
                const errData = await tokenResponse.json().catch(() => ({}));
                console.error('Token exchange error:', errData);
                throw new Error(errData.error_description || errData.error || `Token exchange failed (${tokenResponse.status})`);
            }

            const tokens = await tokenResponse.json();
            const payload = decodeJwtPayload(tokens.id_token);

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
            sessionStorage.removeItem('okta_login_attempted');
            showApp(session);
        } catch (err) {
            errorEl.textContent = err.message || 'Erreur lors de l\'authentification.';
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
        const logoutUrl = `${getAuthBaseUrl()}/logout?` +
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

    async function generateCodeChallenge(codeVerifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
});
