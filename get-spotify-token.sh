#!/bin/bash

# Script interactif pour obtenir un token Spotify et lancer l'application
# Ce script gère le flux OAuth complet et ouvre l'application automatiquement

set -e

# Configuration
CLIENT_ID="f11e9cfe003449c686de1b52acdcfebe"
REDIRECT_URI="https://loicdescotte.github.io/spot/"
SCOPES="user-top-read user-read-private playlist-modify-public playlist-modify-private"

echo "🎵 Générateur de Token Spotify Interactif"
echo "========================================"
echo ""

# Vérifier les prérequis
if ! command -v curl &> /dev/null; then
    echo "❌ curl n'est pas installé. Installez-le avec: brew install curl"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ python3 n'est pas installé. Installez-le avec: brew install python3"
    exit 1
fi

echo "✅ Prérequis vérifiés"
echo ""

# Demander le Client Secret
echo "🔑 Configuration de l'application Spotify"
echo "Votre Client Secret est nécessaire pour obtenir un token d'accès."
echo "Vous pouvez le trouver dans votre Spotify Developer Dashboard."
echo ""
read -s -p "📝 Entrez votre Client Secret: " CLIENT_SECRET
echo ""
echo ""

if [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Client Secret vide. Script arrêté."
    exit 1
fi

# Étape 1: Configuration
echo "📋 Étape 1: Configuration Spotify"
echo "Assurez-vous d'avoir ajouté cette URL de redirection"
echo "dans votre application Spotify Developer Dashboard:"
echo ""
echo "🔗 $REDIRECT_URI"
echo ""
read -p "Appuyez sur Entrée une fois que c'est fait..."

# Construire l'URL d'autorisation
AUTH_URL="https://accounts.spotify.com/authorize"
AUTH_URL+="?client_id=$CLIENT_ID"
AUTH_URL+="&response_type=code"
AUTH_URL+="&redirect_uri=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$REDIRECT_URI'))")"
AUTH_URL+="&scope=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$SCOPES'))")"
AUTH_URL+="&show_dialog=true"

echo ""
echo "🚀 Étape 2: Autorisation"
echo "Ouverture automatique de l'URL d'autorisation..."
echo ""

# Ouvrir automatiquement
if command -v open &> /dev/null; then
    open "$AUTH_URL"
    echo "✅ URL ouverte dans le navigateur"
else
    echo "URL à ouvrir manuellement:"
    echo "$AUTH_URL"
fi

echo ""
echo "🔍 Étape 3: Récupération du code"
echo "Après avoir autorisé l'application, vous serez redirigé vers httpbin.org"
echo "Dans la réponse JSON, cherchez le paramètre 'code' dans l'URL."
echo ""

# Demander le code d'autorisation
read -p "📝 Collez le code d'autorisation ici: " AUTH_CODE

if [ -z "$AUTH_CODE" ]; then
    echo "❌ Code d'autorisation vide. Script arrêté."
    exit 1
fi

echo ""
echo "🔄 Étape 4: Échange du code contre un token..."

# Échanger le code contre un token
TOKEN_RESPONSE=$(curl -s -X POST https://accounts.spotify.com/api/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "grant_type=authorization_code" \
  -d "code=$AUTH_CODE" \
  -d "redirect_uri=$REDIRECT_URI" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET")

# Vérifier si la réponse contient un token
ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'access_token' in data:
        print(data['access_token'])
    else:
        print('ERROR: ' + str(data))
        sys.exit(1)
except:
    print('ERROR: Invalid JSON response')
    sys.exit(1)
")

if [[ $ACCESS_TOKEN == ERROR:* ]]; then
    echo "❌ Erreur lors de l'échange du token:"
    echo "$ACCESS_TOKEN"
    echo ""
    echo "🔧 Vérifiez:"
    echo "- Que votre Client Secret est correct"
    echo "- Que l'URL de redirection est configurée dans votre app Spotify"
    echo "- Que le code d'autorisation n'a pas expiré"
    exit 1
fi

echo "✅ Token obtenu avec succès!"
echo ""

# Afficher le token
echo "🔑 Votre token d'accès:"
echo "$ACCESS_TOKEN"
echo ""

# Démarrer le serveur web
echo "🚀 Lancement de l'application web..."
echo "📱 L'application va s'ouvrir sur: http://localhost:8000"
echo ""

# Démarrer le serveur en arrière-plan
python3 -m http.server 8000 &
SERVER_PID=$!

# Attendre un peu que le serveur démarre
sleep 2

# Ouvrir l'application dans le navigateur
if command -v open &> /dev/null; then
    open "http://localhost:8000"
    echo "✅ Application ouverte dans le navigateur"
else
    echo "Ouvrez manuellement: http://localhost:8000"
fi

echo ""
echo "🎉 Tout est prêt!"
echo "📋 Instructions:"
echo "1. Copiez le token affiché ci-dessus"
echo "2. Collez-le dans l'application web"
echo "3. Cliquez sur 'Se connecter'"
echo "4. Pour arrêter le serveur, appuyez sur Ctrl+C"
echo ""

# Attendre que l'utilisateur arrête le serveur
trap "echo ''; echo '🛑 Arrêt du serveur...'; kill $SERVER_PID 2>/dev/null; echo '✅ Application fermée. À bientôt!'; exit 0" INT

echo "⏳ Le serveur est en cours d'exécution. Appuyez sur Ctrl+C pour arrêter."
wait $SERVER_PID