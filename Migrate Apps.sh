#!/bin/bash
#
# Migration des apps vers ~/Applications pour permettre les auto-updates
# sans droits admin (Figma, Slack, VSCode, Postman)
#
# Compatible Intune (exécution en root via System context)
# Protections anti race-condition : vérif stabilité + signature avant/après copie

set -u

LOG_TAG="[AppMigration]"

log() {
    echo "$LOG_TAG $1"
}

# --- Récupère l'utilisateur connecté à la session GUI ---
CURRENT_USER=$(stat -f "%Su" /dev/console)

if [ -z "$CURRENT_USER" ] || [ "$CURRENT_USER" = "root" ] || [ "$CURRENT_USER" = "loginwindow" ]; then
    log "Aucun utilisateur GUI connecté détecté ($CURRENT_USER). Sortie."
    exit 0
fi

USER_HOME=$(dscl . -read /Users/"$CURRENT_USER" NFSHomeDirectory 2>/dev/null | awk '{print $2}')

if [ -z "$USER_HOME" ] || [ ! -d "$USER_HOME" ]; then
    log "Impossible de déterminer le home de $CURRENT_USER. Sortie."
    exit 0
fi

USER_APPS="$USER_HOME/Applications"

log "Utilisateur détecté : $CURRENT_USER"
log "Home : $USER_HOME"
log "Dossier cible : $USER_APPS"

mkdir -p "$USER_APPS"
chown "$CURRENT_USER":staff "$USER_APPS"

# --- Vérifie que l'app n'est pas en cours d'écriture (installeur Intune actif) ---
is_app_stable() {
    local APP_PATH="$1"
    local SIZE1 SIZE2

    SIZE1=$(find "$APP_PATH" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{s+=$1} END {print s}')
    sleep 5
    SIZE2=$(find "$APP_PATH" -type f -exec stat -f%z {} \; 2>/dev/null | awk '{s+=$1} END {print s}')

    if [ -n "$SIZE1" ] && [ "$SIZE1" = "$SIZE2" ]; then
        return 0  # stable
    else
        return 1  # encore en train de changer
    fi
}

# --- Vérifie la signature/intégrité de l'app ---
verify_app_signature() {
    local APP_PATH="$1"
    codesign --verify --deep --strict "$APP_PATH" >/dev/null 2>&1
}

# --- Fonction de migration générique ---
# $1 = nom affiché, $2 = nom du bundle .app (sans /Applications/)
migrate_app() {
    local APP_LABEL="$1"
    local APP_NAME="$2"
    local SRC="/Applications/$APP_NAME"
    local DST="$USER_APPS/$APP_NAME"

    if [ -d "$DST" ]; then
        log "$APP_LABEL déjà présent dans ~/Applications, rien à faire."
        return 0
    fi

    if [ ! -d "$SRC" ]; then
        log "$APP_LABEL non trouvé dans /Applications, skip."
        return 0
    fi

    # Vérif 1 : l'app n'est pas en cours d'installation/écriture
    log "$APP_LABEL : vérification de stabilité..."
    if ! is_app_stable "$SRC"; then
        log "$APP_LABEL semble en cours d'installation (taille instable), skip ce cycle."
        return 0
    fi

    # Vérif 2 : la signature est valide avant copie
    if ! verify_app_signature "$SRC"; then
        log "$APP_LABEL : signature invalide ou installation incomplète, skip ce cycle."
        return 0
    fi

    log "Migration $APP_LABEL vers ~/Applications..."

    if ditto "$SRC" "$DST"; then
        chown -R "$CURRENT_USER":staff "$DST"

        # Vérif 3 : structure correcte après copie
        if [ ! -d "$DST/Contents" ]; then
            log "ERREUR: copie de $APP_LABEL incomplète (Contents manquant), original conservé."
            rm -rf "$DST"
            return 0
        fi

        # Vérif 4 : signature valide après copie
        if ! verify_app_signature "$DST"; then
            log "ERREUR: $APP_LABEL copié mais signature invalide après ditto, original conservé."
            rm -rf "$DST"
            return 0
        fi

        rm -rf "$SRC"
        log "$APP_LABEL migré ✓"
    else
        log "ERREUR: ditto a échoué pour $APP_LABEL, original conservé."
        rm -rf "$DST" 2>/dev/null
    fi
}

# --- Migrations ---
migrate_app "Figma"   "Figma.app"
migrate_app "Slack"   "Slack.app"
migrate_app "VSCode"  "Visual Studio Code.app"
migrate_app "Postman" "Postman.app"

# --- Réindexation Spotlight ---
log "Réindexation Spotlight..."
sudo -u "$CURRENT_USER" mdimport -r "$USER_APPS" 2>/dev/null || log "mdimport a échoué (non bloquant)."

# --- Rechargement du Dock ---
log "Rechargement du Dock..."
sudo -u "$CURRENT_USER" killall Dock 2>/dev/null || log "killall Dock a échoué (non bloquant)."

log "Done."
exit 0