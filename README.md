# 🎵 Spotify Statistics App

Une application web moderne pour analyser vos statistiques Spotify avec des recommandations intelligentes et des actualités musicales.

## 🌐 Application en ligne

**[👉 Accéder à l'application](https://loicdescotte.github.io/spot/)**

## ✨ Fonctionnalités

- **📊 Statistiques détaillées** : Top artistes, titres, albums et genres
- **🎯 Recommandations hybrides** : Basées sur vos goûts et artistes similaires  
- **📰 Actualités musicales** : News en temps réel via Google News RSS
- **🎤 Concerts** : Liens vers Bandsintown, Songkick et Fnac Spectacles
- **📱 Interface responsive** : Optimisée mobile et desktop

## 🚀 Utilisation

### **Méthode simple (recommandée)**
1. **Ouvrez l'application** : https://loicdescotte.github.io/spot/
2. **Cliquez sur le lien Spotify Console** dans l'interface
3. **Obtenez votre token** : Cliquez sur "Get Token" 
4. **Copiez-collez** le token dans l'application
5. **C'est tout !** Vos statistiques s'affichent

### **Méthode OAuth (avancée)**
Si vous préférez configurer OAuth :
1. **Configuration Spotify** : [Developer Dashboard](https://developer.spotify.com/dashboard)
   - Créez une application
   - Ajoutez `https://loicdescotte.github.io/spot/` aux Redirect URIs
2. **Dépliez la section OAuth** dans l'application
3. **Suivez le processus** d'autorisation

## 🔧 Technologies

- **Frontend** : HTML5, CSS3, JavaScript vanilla
- **APIs** : Spotify Web API, Google News RSS, Géolocalisation
- **Déploiement** : GitHub Pages
- **Authentification** : OAuth Spotify

## 📱 Captures d'écran

L'application propose plusieurs onglets :
- **12 derniers mois** & **Depuis toujours** : Vos tops personnalisés
- **Recommandations** : Nouvelles découvertes + playlist automatique
- **News Musicales** : Actualités de vos artistes favoris
- **Concerts** : Événements à proximité

## 🛠️ Développement local

```bash
# Cloner le repository
git clone https://github.com/loicdescotte/spot.git
cd spot

# Lancer le serveur local
./get-spotify-token.sh
```

L'application sera accessible sur `http://localhost:8000`

## ⚙️ Configuration avancée

### Variables d'environnement
- `SPOTIFY_CLIENT_ID` : Votre Client ID Spotify
- `SPOTIFY_CLIENT_SECRET` : Votre Client Secret (pour le script local uniquement)

### Redirect URIs à configurer dans Spotify
- **Production** : `https://loicdescotte.github.io/spot/`
- **Développement** : `http://localhost:8000/` ou `https://httpbin.org/anything`

## 🔒 Sécurité

- ✅ Aucune donnée n'est stockée sur un serveur
- ✅ Token stocké uniquement dans votre navigateur
- ✅ Pas de transmission de données personnelles
- ✅ Code source 100% open source

## 🤝 Contribution

Contributions bienvenues ! 

1. Fork le projet
2. Créez votre branche (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🎭 Crédits

Développé avec l'assistance de Claude Code (Anthropic)

---

**🎵 Découvrez votre univers musical comme jamais auparavant !**