require('dotenv').config();
const express = require('express');
const sgMail = require('@sendgrid/mail');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// SendGrid config
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Email endpoint
app.post('/api/send-onboarding', async (req, res) => {
    console.log('[EMAIL] Requête reçue pour:', req.body.firstname, req.body.lastname);
    try {
        const data = req.body;
        const htmlContent = buildEmailHtml(data);

        const msg = {
            to: process.env.RECIPIENT_EMAIL,
            from: process.env.SENDER_EMAIL,
            subject: `[Onboarding] ${data.firstname} ${data.lastname} — ${data.contractType} — ${data.jobTitle}`,
            html: htmlContent,
        };

        await sgMail.send(msg);
        res.json({ success: true, message: 'Email envoyé avec succès' });
    } catch (error) {
        console.error('SendGrid error:', error.response?.body || error.message);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'email' });
    }
});

function buildEmailHtml(data) {
    const escapeHtml = (str) => {
        if (!str) return '-';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Non définie';
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatList = (arr) => {
        if (!arr || arr.length === 0) return 'Aucun';
        return arr.map(item => escapeHtml(item)).join(', ');
    };

    return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: #1a1a2e; color: white; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; font-size: 22px;">🚀 Nouvelle demande d'onboarding</h1>
            <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">
                ${escapeHtml(data.firstname)} ${escapeHtml(data.lastname)} — ${escapeHtml(data.contractType)}
            </p>
        </div>

        <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            
            <!-- Informations personnelles -->
            <h2 style="color: #1a1a2e; border-bottom: 2px solid #e8e8ef; padding-bottom: 8px; font-size: 16px;">
                👤 Informations personnelles
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr><td style="padding: 8px 12px; color: #666; width: 200px;">Prénom</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.firstname)}</td></tr>
                <tr style="background: #f8f9fa;"><td style="padding: 8px 12px; color: #666;">Nom</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.lastname)}</td></tr>
                <tr><td style="padding: 8px 12px; color: #666;">Email personnel</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.personalEmail)}</td></tr>
                <tr style="background: #f8f9fa;"><td style="padding: 8px 12px; color: #666;">Email professionnel</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.proEmail)}</td></tr>
                <tr><td style="padding: 8px 12px; color: #666;">Date d'arrivée</td><td style="padding: 8px 12px; font-weight: 500;">${formatDate(data.startDate)}</td></tr>
                <tr style="background: #f8f9fa;"><td style="padding: 8px 12px; color: #666;">Date de fin</td><td style="padding: 8px 12px; font-weight: 500;">${formatDate(data.endDate)}</td></tr>
            </table>

            <!-- Contrat & Poste -->
            <h2 style="color: #1a1a2e; border-bottom: 2px solid #e8e8ef; padding-bottom: 8px; font-size: 16px;">
                📋 Contrat & Poste
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr><td style="padding: 8px 12px; color: #666; width: 200px;">Type de contrat</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.contractType)}</td></tr>
                <tr style="background: #f8f9fa;"><td style="padding: 8px 12px; color: #666;">Métier</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.jobTitle)}</td></tr>
                <tr><td style="padding: 8px 12px; color: #666;">Lieu de travail</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.workplace)}</td></tr>
            </table>

            <!-- Matériel -->
            <h2 style="color: #1a1a2e; border-bottom: 2px solid #e8e8ef; padding-bottom: 8px; font-size: 16px;">
                💻 Matériel
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr><td style="padding: 8px 12px; color: #666; width: 200px;">Laptop</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.laptopNeeded)}</td></tr>
                ${data.laptopNeeded === 'Oui' ? `
                <tr style="background: #f8f9fa;"><td style="padding: 8px 12px; color: #666;">Profil laptop</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.laptopProfile)}</td></tr>
                <tr><td style="padding: 8px 12px; color: #666;">OS</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.laptopOs)}</td></tr>
                ` : ''}
                <tr style="background: #f8f9fa;"><td style="padding: 8px 12px; color: #666;">Casque</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.headsetNeeded)}</td></tr>
                <tr><td style="padding: 8px 12px; color: #666;">Matériel bureau</td><td style="padding: 8px 12px; font-weight: 500;">${formatList(data.deskMaterial)}</td></tr>
            </table>

            <!-- Applications -->
            <h2 style="color: #1a1a2e; border-bottom: 2px solid #e8e8ef; padding-bottom: 8px; font-size: 16px;">
                📱 Applications
            </h2>
            <div style="margin-bottom: 24px; padding: 12px;">
                ${[
                    { label: 'Finance', apps: data.appsFinance },
                    { label: 'Achats', apps: data.appsAchats },
                    { label: 'Ventes', apps: data.appsVentes },
                    { label: 'Pricing', apps: data.appsPricing },
                    { label: 'DSI', apps: data.appsDsi },
                    { label: 'Transverses', apps: data.appsTransverses },
                ].filter(g => g.apps && g.apps.length > 0)
                 .map(g => `<p style="margin: 4px 0;"><strong>${escapeHtml(g.label)} :</strong> ${formatList(g.apps)}</p>`)
                 .join('') || '<p style="color: #999;">Aucune application sélectionnée</p>'}
                ${data.tableauEmail ? `<p style="margin: 4px 0;"><strong>Email Tableau :</strong> ${escapeHtml(data.tableauEmail)}</p>` : ''}
            </div>

            <!-- Backoffice & Mailing -->
            <h2 style="color: #1a1a2e; border-bottom: 2px solid #e8e8ef; padding-bottom: 8px; font-size: 16px;">
                🔧 Backoffice & Mailing
            </h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr><td style="padding: 8px 12px; color: #666; width: 200px;">Accès Backoffice</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.backofficeNeeded)}</td></tr>
                ${data.backofficeNeeded === 'Oui' ? `
                <tr style="background: #f8f9fa;"><td style="padding: 8px 12px; color: #666;">Profil référent</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.backofficeProfile)}</td></tr>
                ` : ''}
                <tr><td style="padding: 8px 12px; color: #666;">Mailing list</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.mailingNeeded)}</td></tr>
                ${data.mailingNeeded === 'Oui' ? `
                <tr style="background: #f8f9fa;"><td style="padding: 8px 12px; color: #666;">Adresses</td><td style="padding: 8px 12px; font-weight: 500;">${escapeHtml(data.mailingLists)}</td></tr>
                ` : ''}
            </table>

            <div style="margin-top: 24px; padding: 16px; background: #e8f5e9; border-radius: 8px; text-align: center; color: #2e7d32; font-size: 14px;">
                ✅ Ce formulaire a été soumis via l'application Onboarding RS
            </div>
        </div>
    </div>
    `;
}

app.listen(PORT, () => {
    console.log(`✅ Serveur onboarding démarré sur http://localhost:${PORT}`);
});
