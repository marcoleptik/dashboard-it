/**
 * Google SSO - Authentification via Google Workspace (Gmail)
 * Restreint aux adresses @recommerce.com
 */

// IMPORTANT : Remplacez cette valeur par votre Client ID Google OAuth 2.0
// Créez-le sur https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = 'VOTRE_CLIENT_ID.apps.googleusercontent.com';
const ALLOWED_DOMAINS = ['recommerce.com', 'circularx.com'];

const SSO_SESSION_KEY = 'onboarding_sso_session';

document.addEventListener('DOMContentLoaded', () => {
    const ssoGate = document.getElementById('sso-gate');
    const appContainer = document.getElementById('app-container');
    if (!ssoGate || !appContainer) return;

    // Vérifier si déjà connecté via SSO
    const existingSession = getSSOSession();
    if (existingSession && !isSessionExpired(existingSession)) {
        showApp(existingSession);
        return;
    }

    // Initialiser Google Sign-In
    initGoogleSignIn();

    function initGoogleSignIn() {
        if (typeof google === 'undefined' || !google.accounts) {
            // Attendre le chargement du script Google
            setTimeout(initGoogleSignIn, 100);
            return;
        }

        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: true,
        });

        google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            {
                theme: 'outline',
                size: 'large',
                width: 300,
                text: 'signin_with',
                shape: 'pill',
                locale: 'fr',
            }
        );

        // Afficher le One Tap
        google.accounts.id.prompt();
    }

    function handleCredentialResponse(response) {
        const errorEl = document.getElementById('sso-error');

        try {
            // Décoder le JWT (payload uniquement, la vérification se fait côté serveur en prod)
            const payload = decodeJwtPayload(response.credential);

            // Vérifier le domaine
            const emailDomain = (payload.email || '').split('@')[1];
            if (!emailDomain || !ALLOWED_DOMAINS.includes(emailDomain)) {
                errorEl.textContent = 'Seules les adresses @recommerce.com et @circularx.com sont autorisées.';
                errorEl.style.display = 'block';
                return;
            }

            // Vérifier que l'email est vérifié
            if (!payload.email_verified) {
                errorEl.textContent = 'Votre adresse email n\'est pas vérifiée.';
                errorEl.style.display = 'block';
                return;
            }

            // Créer la session SSO
            const session = {
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                loggedAt: Date.now(),
                expiresAt: payload.exp * 1000, // exp est en secondes
            };

            localStorage.setItem(SSO_SESSION_KEY, JSON.stringify(session));
            errorEl.style.display = 'none';
            showApp(session);
        } catch (err) {
            errorEl.textContent = 'Erreur lors de l\'authentification. Veuillez réessayer.';
            errorEl.style.display = 'block';
            console.error('SSO Error:', err);
        }
    }

    function showApp(session) {
        ssoGate.style.display = 'none';
        appContainer.style.display = 'flex';

        // Afficher l'utilisateur connecté dans la sidebar
        const sidebarFooter = document.querySelector('.sidebar-footer');
        if (sidebarFooter) {
            sidebarFooter.innerHTML = `
                <div class="sso-user-info">
                    <img src="${escapeAttr(session.picture || '')}" alt="" class="sso-avatar">
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
            document.getElementById('sso-logout').addEventListener('click', ssoLogout);
        }
    }

    function ssoLogout() {
        localStorage.removeItem(SSO_SESSION_KEY);
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.disableAutoSelect();
        }
        window.location.reload();
    }

    function getSSOSession() {
        const data = localStorage.getItem(SSO_SESSION_KEY);
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

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    function escapeAttr(text) {
        return (text || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
});
