# 🎵 Spotify Statistics App

Une application web moderne pour analyser vos statistiques Spotify avec des recommandations intelligentes et des actualités musicales.

## 🏠 Version de développement local

Cette branche contient la version configurée pour le développement local.

## ✨ Fonctionnalités

- **📊 Statistiques détaillées** : Top artistes, titres, albums et genres
- **🎯 Recommandations hybrides** : Basées sur vos goûts et artistes similaires  
- **📰 Actualités musicales** : News en temps réel via Google News RSS
- **🎤 Concerts** : Liens vers Bandsintown, Songkick et Fnac Spectacles
- **📱 Interface responsive** : Optimisée mobile et desktop

## 🚀 Utilisation

### 1. **Configuration Spotify** (une seule fois)
- Allez sur [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- Créez une nouvelle application ou utilisez une existante
- Dans les **Redirect URIs**, ajoutez : `https://loicdescotte.github.io/spot/`

### 2. **Obtenir un token d'accès**
- Lancez le script local : `./get-spotify-token.sh`
- Suivez les instructions pour obtenir votre token
- Ou utilisez l'[outil en ligne de Spotify](https://developer.spotify.com/console/get-current-user/)

### 3. **Profiter de l'application**
- Ouvrez https://loicdescotte.github.io/spot/
- Collez votre token Spotify
- Explorez vos statistiques !

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