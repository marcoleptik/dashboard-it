/**
 * Auth module - Gestion de l'authentification
 * Utilise localStorage pour la persistance (démo)
 */

const Auth = (() => {
    const USERS_KEY = 'onboarding_users';
    const SESSION_KEY = 'onboarding_session';

    // Initialiser les utilisateurs par défaut si absents
    function initDefaultUsers() {
        if (!localStorage.getItem(USERS_KEY)) {
            const defaultUsers = [
                { email: 'admin@recommerce.com', password: hashPassword('Admin123!'), name: 'Administrateur', role: 'admin' }
            ];
            localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
        }
    }

    // Hash simple pour le stockage local (en prod, utiliser bcrypt côté serveur)
    function hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }

    function getUsers() {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    }

    function login(email, password) {
        const users = getUsers();
        const hashedPw = hashPassword(password);
        const user = users.find(u => u.email === email && u.password === hashedPw);
        if (user) {
            const session = { email: user.email, name: user.name, role: user.role, loggedAt: Date.now() };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            return { success: true, user: session };
        }
        return { success: false, error: 'Email ou mot de passe incorrect' };
    }

    function logout() {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    }

    function getSession() {
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    }

    function isLoggedIn() {
        return getSession() !== null;
    }

    function requireAuth() {
        if (!isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    function addUser(email, password, name, role = 'member') {
        const users = getUsers();
        if (users.find(u => u.email === email)) {
            return { success: false, error: 'Cet email est déjà utilisé' };
        }
        users.push({ email, password: hashPassword(password), name, role });
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return { success: true };
    }

    function removeUser(email) {
        const users = getUsers().filter(u => u.email !== email);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function getAllUsers() {
        return getUsers().map(u => ({ email: u.email, name: u.name, role: u.role }));
    }

    initDefaultUsers();

    return { login, logout, getSession, isLoggedIn, requireAuth, addUser, removeUser, getAllUsers };
})();

// Gestion des soumissions
const Submissions = (() => {
    const STORAGE_KEY = 'onboarding_submissions';

    function getAll() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    }

    function add(data) {
        const submissions = getAll();
        const submission = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            data,
            submittedAt: new Date().toISOString(),
        };
        submissions.push(submission);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
        return submission;
    }

    function remove(id) {
        const submissions = getAll().filter(s => s.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    }

    function getById(id) {
        return getAll().find(s => s.id === id) || null;
    }

    return { getAll, add, remove, getById };
})();

// Login page logic
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    // Si déjà connecté, rediriger vers le dashboard
    if (Auth.isLoggedIn()) {
        window.location.href = 'admin.html';
        return;
    }

    // Toggle password visibility
    const toggleBtn = document.querySelector('.toggle-password');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const input = document.getElementById('login-password');
            const icon = toggleBtn.querySelector('.material-icons');
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = 'visibility';
            } else {
                input.type = 'password';
                icon.textContent = 'visibility_off';
            }
        });
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');

        if (!email || !password) {
            errorEl.textContent = 'Veuillez remplir tous les champs';
            errorEl.style.display = 'block';
            return;
        }

        const result = Auth.login(email, password);
        if (result.success) {
            window.location.href = 'admin.html';
        } else {
            errorEl.textContent = result.error;
            errorEl.style.display = 'block';
        }
    });
});
