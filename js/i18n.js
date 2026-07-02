// ===== Internationalization (i18n) =====
const translations = {
    fr: {
        // SSO Gate
        'sso.title': 'Onboarding RS',
        'sso.subtitle': 'Connectez-vous avec votre compte Recommerce pour accéder au formulaire',
        'sso.login': 'Se connecter via Okta',
        'sso.hint': 'Seules les adresses <strong>@recommerce.com</strong> et <strong>@circularx.com</strong> sont autorisées',

        // Home
        'home.title': 'Bienvenue sur le Dashboard IT',
        'home.subtitle': 'Que souhaitez-vous faire ?',
        'home.onboarding': "Formulaire d'onboarding",
        'home.material': 'Demande de matériel',
        'home.admin': 'Dashboard Admin',
        'home.logout': 'Déconnexion',

        // Sidebar steps
        'step.1': 'Informations personnelles',
        'step.2': 'Contrat & Poste',
        'step.3': 'Matériel',
        'step.4': 'Applications',
        'step.5': 'Mailing List',
        'step.6': 'Récapitulatif',
        'sidebar.back': "Retour à l'accueil",

        // Step 1
        'step1.title': 'Informations personnelles',
        'step1.subtitle': 'Renseignez les informations de base du futur collaborateur',
        'step1.firstname': 'Prénom',
        'step1.firstname.placeholder': 'Prénom',
        'step1.lastname': 'Nom',
        'step1.lastname.placeholder': 'Nom',
        'step1.personal_email': 'Mail personnel',
        'step1.personal_email.placeholder': 'email@exemple.com',
        'step1.pro_email': 'Mail professionnel',
        'step1.pro_email.placeholder': 'prenom.nom@recommerce.com',

        // Step 2
        'step2.title': 'Contrat & Poste',
        'step2.subtitle': 'Informations relatives au contrat et au poste',
        'step2.contract_type': 'Type de contrat',
        'step2.job_title': 'Poste',
        'step2.job_title.placeholder': 'Sélectionner un poste...',
        'step2.country': 'Pays',
        'step2.country.placeholder': 'Sélectionner un pays...',
        'step2.city': 'Ville',
        'step2.city.placeholder': "Sélectionner d'abord un pays...",
        'step2.start_date': "Date d'arrivée",
        'step2.end_date': 'Date de fin de mission',

        // Step 3
        'step3.title': 'Matériel',
        'step3.subtitle': 'Quel matériel sera nécessaire pour le collaborateur ?',
        'step3.laptop': 'Laptop nécessaire ?',
        'step3.yes': 'Oui',
        'step3.no': 'Non',
        'step3.profile': 'Profil',
        'step3.os': "Système d'exploitation",
        'step3.headset': 'Casque',
        'step3.desk_material': 'Matériel sur le bureau',
        'step3.desk_warning': '⚠️ Vérifier si le matériel est déjà installé sur le bureau',
        'step3.mouse': 'Souris',
        'step3.keyboard': 'Clavier',
        'step3.screen': 'Écran',
        'step3.hub': 'Hub USB-C',

        // Step 4
        'step4.title': 'Applications',
        'step4.subtitle': 'Sélectionnez les applications nécessaires pour le collaborateur',
        'step4.finance': 'Applications Finance',
        'step4.achats': 'Applications Achats',
        'step4.ventes': 'Applications Ventes',
        'step4.pricing': 'Applications Pricing',
        'step4.dsi': 'Applications DSI',
        'step4.transverses': 'Applications Transverses',

        // Step 5
        'step5.title': 'Mailing List',
        'step5.subtitle': 'Listes de diffusion auxquelles ajouter le collaborateur',
        'step5.label': 'Mailing list(s)',
        'step5.add': 'Ajouter une mailing list',
        'step5.placeholder': 'Ex: team-dev@recommerce.com',

        // Step 6
        'step6.title': 'Récapitulatif',
        'step6.subtitle': 'Vérifiez les informations avant de soumettre',

        // Navigation
        'nav.prev': 'Précédent',
        'nav.next': 'Suivant',
        'nav.submit': 'Soumettre',
        'nav.submitting': 'Envoi en cours...',

        // Material request
        'mat.step1': "Lieu d'utilisation",
        'mat.step2': 'Matériel',
        'mat.step3': 'Commentaire',
        'mat.step1.title': "Lieu d'utilisation",
        'mat.step1.subtitle': 'Ce matériel sera utilisé au bureau ou en télétravail ?',
        'mat.step1.label': 'Où utiliserez-vous ce matériel ?',
        'mat.office': 'Bureau',
        'mat.office.desc': 'Matériel pour les locaux',
        'mat.remote': 'Télétravail',
        'mat.remote.desc': 'Matériel pour la maison',
        'mat.step2.title': 'Choix du matériel',
        'mat.step2.subtitle': 'Indiquez la raison de votre demande et sélectionnez le matériel souhaité',
        'mat.reason': 'Raison de la demande',
        'mat.reason.lost': 'Perdu',
        'mat.reason.stolen': 'Volé',
        'mat.reason.broken': 'Ne fonctionne plus',
        'mat.reason.never_had': "Je n'en avais pas avant",
        'mat.items': 'Matériel souhaité',
        'mat.screen': 'Écran',
        'mat.keyboard': 'Clavier',
        'mat.mouse': 'Souris',
        'mat.hdmi': 'Câble HDMI',
        'mat.headset': 'Casque',
        'mat.stand': 'Support PC',
        'mat.hub': 'Hub USB',
        'mat.charger': 'Chargeur',
        'mat.step3.title': 'Commentaire',
        'mat.step3.subtitle': 'Un détail à ajouter ? Précisez ici votre besoin',
        'mat.comment': 'Commentaire libre',
        'mat.comment.placeholder': 'Exemple : besoin d\'un écran 27 pouces, casque avec micro pour visioconférences, etc.',
        'mat.submit': 'Soumettre la demande',
        'mat.prev': 'Précédent',
        'mat.next': 'Suivant',

        // Language
        'lang.fr': 'Français',
        'lang.en': 'English',
    },
    en: {
        // SSO Gate
        'sso.title': 'Onboarding RS',
        'sso.subtitle': 'Sign in with your Recommerce account to access the form',
        'sso.login': 'Sign in via Okta',
        'sso.hint': 'Only <strong>@recommerce.com</strong> and <strong>@circularx.com</strong> addresses are allowed',

        // Home
        'home.title': 'Welcome to the IT Dashboard',
        'home.subtitle': 'What would you like to do?',
        'home.onboarding': 'Onboarding form',
        'home.material': 'Equipment request',
        'home.admin': 'Admin Dashboard',
        'home.logout': 'Log out',

        // Sidebar steps
        'step.1': 'Personal information',
        'step.2': 'Contract & Position',
        'step.3': 'Equipment',
        'step.4': 'Applications',
        'step.5': 'Mailing List',
        'step.6': 'Summary',
        'sidebar.back': 'Back to home',

        // Step 1
        'step1.title': 'Personal information',
        'step1.subtitle': 'Enter the basic information of the new employee',
        'step1.firstname': 'First name',
        'step1.firstname.placeholder': 'First name',
        'step1.lastname': 'Surname',
        'step1.lastname.placeholder': 'Surname',
        'step1.personal_email': 'Personal email',
        'step1.personal_email.placeholder': 'email@example.com',
        'step1.pro_email': 'Professional email',
        'step1.pro_email.placeholder': 'firstname.lastname@recommerce.com',

        // Step 2
        'step2.title': 'Contract & Position',
        'step2.subtitle': 'Contract and position information',
        'step2.contract_type': 'Contract type',
        'step2.job_title': 'Position',
        'step2.job_title.placeholder': 'Select a position...',
        'step2.country': 'Country',
        'step2.country.placeholder': 'Select a country...',
        'step2.city': 'City',
        'step2.city.placeholder': 'Select a country first...',
        'step2.start_date': 'Starting date',
        'step2.end_date': 'End date',

        // Step 3
        'step3.title': 'Equipment',
        'step3.subtitle': 'What equipment will the employee need?',
        'step3.laptop': 'Laptop needed?',
        'step3.yes': 'Yes',
        'step3.no': 'No',
        'step3.profile': 'Profile',
        'step3.os': 'Operating system',
        'step3.headset': 'Headset',
        'step3.desk_material': 'Desk equipment',
        'step3.desk_warning': '⚠️ Check if equipment is already set up at the desk',
        'step3.mouse': 'Mouse',
        'step3.keyboard': 'Keyboard',
        'step3.screen': 'Screen',
        'step3.hub': 'USB-C Hub',

        // Step 4
        'step4.title': 'Applications',
        'step4.subtitle': 'Select the applications needed for the employee',
        'step4.finance': 'Finance Applications',
        'step4.achats': 'Purchasing Applications',
        'step4.ventes': 'Sales Applications',
        'step4.pricing': 'Pricing Applications',
        'step4.dsi': 'IT Applications',
        'step4.transverses': 'Cross-functional Applications',

        // Step 5
        'step5.title': 'Mailing List',
        'step5.subtitle': 'Mailing lists to add the employee to',
        'step5.label': 'Mailing list(s)',
        'step5.add': 'Add a mailing list',
        'step5.placeholder': 'E.g.: team-dev@recommerce.com',

        // Step 6
        'step6.title': 'Summary',
        'step6.subtitle': 'Review the information before submitting',

        // Navigation
        'nav.prev': 'Previous',
        'nav.next': 'Next',
        'nav.submit': 'Submit',
        'nav.submitting': 'Sending...',

        // Material request
        'mat.step1': 'Location',
        'mat.step2': 'Equipment',
        'mat.step3': 'Comment',
        'mat.step1.title': 'Location of use',
        'mat.step1.subtitle': 'Will this equipment be used at the office or remotely?',
        'mat.step1.label': 'Where will you use this equipment?',
        'mat.office': 'Office',
        'mat.office.desc': 'Equipment for the office',
        'mat.remote': 'Remote',
        'mat.remote.desc': 'Equipment for home',
        'mat.step2.title': 'Choose equipment',
        'mat.step2.subtitle': 'Indicate the reason for your request and select the equipment needed',
        'mat.reason': 'Reason for request',
        'mat.reason.lost': 'Lost',
        'mat.reason.stolen': 'Stolen',
        'mat.reason.broken': 'No longer working',
        'mat.reason.never_had': "I didn't have one before",
        'mat.items': 'Desired equipment',
        'mat.screen': 'Screen',
        'mat.keyboard': 'Keyboard',
        'mat.mouse': 'Mouse',
        'mat.hdmi': 'HDMI Cable',
        'mat.headset': 'Headset',
        'mat.stand': 'Laptop stand',
        'mat.hub': 'USB Hub',
        'mat.charger': 'Charger',
        'mat.step3.title': 'Comment',
        'mat.step3.subtitle': 'Anything to add? Specify your needs here',
        'mat.comment': 'Free comment',
        'mat.comment.placeholder': 'E.g.: need a 27-inch screen, headset with microphone for video calls, etc.',
        'mat.submit': 'Submit request',
        'mat.prev': 'Previous',
        'mat.next': 'Next',

        // Language
        'lang.fr': 'Français',
        'lang.en': 'English',
    }
};

// Current language
let currentLang = localStorage.getItem('app-lang') || 'fr';

function t(key) {
    return translations[currentLang]?.[key] || translations['fr']?.[key] || key;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('app-lang', lang);
    document.documentElement.lang = lang;
    applyTranslations();
    updateLangSwitcher();
}

function updateLangSwitcher() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const value = t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = value;
        } else {
            el.innerHTML = value;
        }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
}

// Initialize language on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Create language switcher
    const switcher = document.createElement('div');
    switcher.className = 'lang-switcher';
    switcher.innerHTML = `
        <button class="lang-btn ${currentLang === 'fr' ? 'active' : ''}" data-lang="fr" title="Français">
            <svg viewBox="0 0 36 24" width="24" height="16"><rect width="12" height="24" fill="#002395"/><rect x="12" width="12" height="24" fill="#fff"/><rect x="24" width="12" height="24" fill="#ED2939"/></svg>
            <span>FR</span>
        </button>
        <button class="lang-btn ${currentLang === 'en' ? 'active' : ''}" data-lang="en" title="English">
            <svg viewBox="0 0 36 24" width="24" height="16"><rect width="36" height="24" fill="#012169"/><path d="M0 0L36 24M36 0L0 24" stroke="#fff" stroke-width="4"/><path d="M0 0L36 24M36 0L0 24" stroke="#C8102E" stroke-width="2.5"/><path d="M18 0v24M0 12h36" stroke="#fff" stroke-width="6"/><path d="M18 0v24M0 12h36" stroke="#C8102E" stroke-width="3.5"/></svg>
            <span>EN</span>
        </button>
    `;
    document.body.appendChild(switcher);

    // Event listeners
    switcher.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });

    // Apply initial language
    document.documentElement.lang = currentLang;
    applyTranslations();
});
