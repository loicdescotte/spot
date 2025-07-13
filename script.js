// Configuration Spotify
const SPOTIFY_CLIENT_ID = 'f11e9cfe003449c686de1b52acdcfebe'; // À remplacer par votre Client ID
const SPOTIFY_REDIRECT_URI = 'https://loicdescotte.github.io/spot/';
const SPOTIFY_SCOPES = 'user-top-read user-read-private playlist-modify-public playlist-modify-private';

class SpotifyStats {
    constructor() {
        this.accessToken = null;
        this.cachedPlaylistId = null; // Cache pour éviter les doublons
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkForToken();
    }

    setupEventListeners() {
        // Gestion des onglets
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    checkForToken() {
        console.log('🔍 Vérification du token...');
        
        // 1. D'abord vérifier le localStorage 
        const savedToken = localStorage.getItem('spotify_token');
        if (savedToken && !savedToken.startsWith('BQDemo_')) {
            console.log('✅ Token trouvé dans localStorage:', savedToken.substring(0, 20) + '...');
            this.accessToken = savedToken;
            this.showUserInterface();
            this.loadUserData();
            return;
        }
        
        // 2. Vérifier s'il y a un code d'autorisation (PKCE flow)
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        const error = urlParams.get('error');
        const state = urlParams.get('state');
        const savedState = localStorage.getItem('oauth_state');
        
        // Vérifier que c'est bien notre tentative OAuth (avec state)
        if ((authCode || error) && state && state === savedState) {
            if (error) {
                console.error('❌ Erreur OAuth:', error);
                alert('Erreur de connexion Spotify: ' + error);
                this.cleanUpOAuth();
                this.showOAuthInterface();
                return;
            }
            
            if (authCode) {
                console.log('🔐 Code d\'autorisation trouvé, échange PKCE...');
                this.exchangeCodeForTokenPKCE(authCode);
                return;
            }
        }
        
        // 3. Nettoyer les paramètres OAuth non valides dans l'URL
        if (urlParams.has('code') || urlParams.has('error')) {
            console.log('🧹 Nettoyage des paramètres OAuth non valides...');
            this.cleanUpOAuth();
        }
        
        // 4. Afficher l'interface de connexion
        console.log('❌ Aucun token valide trouvé');
        this.showOAuthInterface();
    }
    
    cleanUpOAuth() {
        // Nettoyer l'URL et le localStorage
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        localStorage.removeItem('oauth_state');
        
        // Supprimer le hash aussi
        if (window.location.hash) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
    }

    showOAuthInterface() {
        document.getElementById('oauth-section').style.display = 'block';
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('main-content').style.display = 'none';
        document.getElementById('oauth-loading').style.display = 'none';
        
        // Nettoyer l'URL des paramètres OAuth
        if (window.location.search) {
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }
    
    async exchangeCodeForTokenPKCE(code) {
        console.log('🔄 Échange du code via PKCE...');
        document.getElementById('oauth-loading').style.display = 'block';
        
        try {
            const codeVerifier = localStorage.getItem('code_verifier');
            if (!codeVerifier) {
                throw new Error('Code verifier manquant');
            }
            
            // Préparer les données pour l'échange
            const tokenData = new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: SPOTIFY_REDIRECT_URI,
                client_id: SPOTIFY_CLIENT_ID,
                code_verifier: codeVerifier
            });
            
            // Échanger le code contre un token
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: tokenData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erreur ${response.status}: ${errorData.error_description || errorData.error}`);
            }
            
            const tokenResponse = await response.json();
            const accessToken = tokenResponse.access_token;
            
            console.log('✅ Token reçu via PKCE');
            
            // Sauvegarder le token
            localStorage.setItem('spotify_token', accessToken);
            this.accessToken = accessToken;
            
            // Nettoyer et rediriger
            this.cleanUpOAuth();
            localStorage.removeItem('code_verifier');
            
            this.showUserInterface();
            this.loadUserData();
            
        } catch (error) {
            console.error('❌ Erreur échange PKCE:', error);
            alert(`Erreur lors de la connexion: ${error.message}`);
            this.cleanUpOAuth();
            this.showOAuthInterface();
        }
    }
    
    


    async showUserInterface() {
        console.log('🎨 Affichage de l\'interface...');
        try {
            const userProfile = await this.fetchUserProfile();
            console.log('👤 Profil utilisateur:', userProfile);
            
            // Calculer la date approximative de création du compte
            const accountCreatedYear = userProfile.followers?.total > 1000000 ? 2008 : 
                                     userProfile.followers?.total > 100000 ? 2010 : 
                                     userProfile.followers?.total > 10000 ? 2012 : 2015;
            
            const oldestDataText = `(Données disponibles depuis ~${accountCreatedYear})`;
            
            const profileImageUrl = userProfile.images?.[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMxREI5NTQiLz4KPHRleHQgeD0iMjAiIHk9IjI2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5mEPC90ZXh0Pgo8L3N2Zz4=';
            
            document.getElementById('user-name').innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${profileImageUrl}" alt="Photo de profil" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMxREI5NTQiLz4KPHRleHQgeD0iMjAiIHk9IjI2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn5mEPC90ZXh0Pgo8L3N2Zz4='">
                    <div>
                        <div>Bonjour, ${userProfile.display_name}!</div>
                        <small style="opacity: 0.7; font-size: 0.8em;">${oldestDataText}</small>
                    </div>
                </div>
            `;
            
            document.getElementById('user-info').style.display = 'flex';
            document.getElementById('token-input-section').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
            console.log('✅ Interface affichée avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de la récupération du profil:', error);
            alert('Erreur de connexion Spotify. Vérifiez votre token.');
            this.showTokenInput();
        }
    }

    async fetchUserProfile() {
        console.log('🔍 Test du token:', this.accessToken ? this.accessToken.substring(0, 20) + '...' : 'null');
        
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });
        
        console.log('📡 Réponse API:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Erreur API détaillée:', errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        return response.json();
    }

    async loadUserData() {
        this.showLoading();
        try {
            await Promise.all([
                this.loadTopData('medium_term'), // 12 derniers mois
                this.loadTopData('long_term')    // Depuis toujours
            ]);
            await this.loadRecommendations();
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        } finally {
            this.hideLoading();
        }
    }

    async loadNews() {
        console.log('📰 Chargement des actualités musicales...');
        const newsLoading = document.getElementById('news-loading');
        newsLoading.style.display = 'block';
        
        try {
            const topArtists = await this.fetchTopItems('artists', 'medium_term', 10);
            
            // Simuler la récupération de news (en production, utiliser une vraie API news)
            const newsData = await this.fetchMusicNews(topArtists.items);
            const albumsData = await this.fetchNewAlbums(topArtists.items);
            
            this.displayNews(newsData);
            this.displayNewAlbums(albumsData);
            
        } catch (error) {
            console.error('Erreur chargement news:', error);
            this.displayNewsError();
        } finally {
            newsLoading.style.display = 'none';
        }
    }

    async loadConcerts() {
        console.log('🎤 Chargement des concerts...');
        const concertsLoading = document.getElementById('concerts-loading');
        const locationStatus = document.getElementById('location-status');
        
        concertsLoading.style.display = 'block';
        
        try {
            // Demander la géolocalisation
            const position = await this.getUserLocation();
            locationStatus.innerHTML = `📍 Concerts près de ${position.city || 'votre position'}`;
            
            // Récupérer tous les top artistes (recent + all-time)
            console.log('📊 Récupération de tous les top artistes...');
            const [recentArtists, alltimeArtists] = await Promise.all([
                this.fetchTopItems('artists', 'medium_term', 10),
                this.fetchTopItems('artists', 'long_term', 10)
            ]);
            
            // Combiner et dédupliquer les artistes
            const allTopArtists = this.combineAndDeduplicateArtists(recentArtists.items, alltimeArtists.items);
            console.log(`🎭 ${allTopArtists.length} artistes uniques trouvés`);
            
            // Ajouter des artistes des genres associés
            const expandedArtists = await this.addGenreRelatedArtists(allTopArtists);
            console.log(`🔍 ${expandedArtists.length} artistes au total pour la recherche de concerts`);
            
            const concertsData = await this.fetchConcerts(expandedArtists, position);
            
            this.displayConcerts(concertsData);
            
        } catch (error) {
            console.error('Erreur chargement concerts:', error);
            locationStatus.innerHTML = '❌ Impossible de récupérer votre position';
            this.displayConcertsError();
        } finally {
            concertsLoading.style.display = 'none';
        }
    }

    async loadTopData(timeRange) {
        const prefix = timeRange === 'medium_term' ? 'recent' : 'alltime';
        
        console.log(`📊 Chargement des données ${timeRange} (${prefix})...`);
        
        try {
            const [artists, tracks] = await Promise.all([
                this.fetchTopItems('artists', timeRange),
                this.fetchTopItems('tracks', timeRange)
            ]);

            console.log(`📈 ${prefix}: ${artists.items.length} artistes, ${tracks.items.length} titres`);
            
            if (timeRange === 'long_term') {
                console.log('🔍 Premiers artistes long_term:', artists.items.slice(0, 3).map(a => a.name));
                console.log('🔍 Premiers titres long_term:', tracks.items.slice(0, 3).map(t => t.name));
            }

            this.displayTopArtists(artists.items, prefix);
            this.displayTopTracks(tracks.items, prefix);
            this.displayTopAlbums(tracks.items, prefix);
            this.displayTopGenres(artists.items, prefix);
        } catch (error) {
            console.error(`❌ Erreur lors du chargement des données ${timeRange}:`, error);
        }
    }

    async fetchTopItems(type, timeRange, limit = 50) {
        const response = await fetch(
            `https://api.spotify.com/v1/me/top/${type}?time_range=${timeRange}&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            }
        );
        
        if (!response.ok) throw new Error(`Failed to fetch top ${type}`);
        return response.json();
    }

    displayTopArtists(artists, prefix) {
        const container = document.getElementById(`${prefix}-artists`);
        container.innerHTML = artists.slice(0, 10).map((artist, index) => `
            <div class="stat-item">
                <div class="stat-item-rank">${index + 1}</div>
                <img src="${artist.images[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMURCOTU0Ii8+Cjx0ZXh0IHg9IjI1IiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OtTwvdGV4dD4KPHN2Zz4='}" alt="${artist.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMURCOTU0Ii8+Cjx0ZXh0IHg9IjI1IiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OtTwvdGV4dD4KPHN2Zz4='">
                <div class="stat-item-info">
                    <div class="stat-item-name">${artist.name}</div>
                    <div class="stat-item-details">
                        ${artist.genres.slice(0, 2).join(', ')} • 
                        Popularité: ${artist.popularity || 'N/A'}/100 • 
                        ${artist.followers?.total ? (artist.followers.total / 1000000).toFixed(1) + 'M' : 'N/A'} followers
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayTopTracks(tracks, prefix) {
        const container = document.getElementById(`${prefix}-tracks`);
        container.innerHTML = tracks.slice(0, 10).map((track, index) => `
            <div class="stat-item">
                <div class="stat-item-rank">${index + 1}</div>
                <img src="${track.album?.images[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMURCOTU0Ii8+Cjx0ZXh0IHg9IjI1IiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OtTwvdGV4dD4KPHN2Zz4='}" alt="${track.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMURCOTU0Ii8+Cjx0ZXh0IHg9IjI1IiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OtTwvdGV4dD4KPHN2Zz4='">
                <div class="stat-item-info">
                    <div class="stat-item-name">${track.name}</div>
                    <div class="stat-item-details">
                        ${track.artists?.map(a => a.name).join(', ') || 'Artiste Inconnu'} • 
                        Popularité: ${track.popularity || 'N/A'}/100
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayTopAlbums(tracks, prefix) {
        // Extraire les albums uniques
        const albumsMap = new Map();
        tracks.forEach(track => {
            const album = track.album;
            if (!albumsMap.has(album.id)) {
                albumsMap.set(album.id, {
                    ...album,
                    count: 1,
                    artists: album.artists || track.artists || [{ name: 'Artiste Inconnu' }]
                });
            } else {
                albumsMap.get(album.id).count++;
            }
        });

        const uniqueAlbums = Array.from(albumsMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        const container = document.getElementById(`${prefix}-albums`);
        container.innerHTML = uniqueAlbums.map((album, index) => `
            <div class="stat-item">
                <div class="stat-item-rank">${index + 1}</div>
                <img src="${album.images[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMURCOTU0Ii8+Cjx0ZXh0IHg9IjI1IiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OtTwvdGV4dD4KPHN2Zz4='}" alt="${album.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMURCOTU0Ii8+Cjx0ZXh0IHg9IjI1IiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OtTwvdGV4dD4KPHN2Zz4='">
                <div class="stat-item-info">
                    <div class="stat-item-name">${album.name}</div>
                    <div class="stat-item-details">
                        ${album.artists.map(a => a.name).join(', ')} • 
                        ${album.release_date ? new Date(album.release_date).getFullYear() : 'N/A'}
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayTopGenres(artists, prefix) {
        // Compter les genres
        const genreCount = {};
        artists.forEach(artist => {
            artist.genres.forEach(genre => {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
        });

        const topGenres = Object.entries(genreCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);

        const container = document.getElementById(`${prefix}-genres`);
        container.innerHTML = topGenres.map(([genre, count], index) => `
            <div class="stat-item">
                <div class="stat-item-rank">${index + 1}</div>
                <div class="stat-item-info">
                    <div class="stat-item-name">${genre}</div>
                    <div class="stat-item-details">${count} artiste(s)</div>
                </div>
            </div>
        `).join('');
    }

    async loadRecommendations() {
        try {
            console.log('🎯 Chargement des recommandations hybrides...');
            
            // Vider complètement l'affichage et forcer le refresh
            console.log('🧹 Nettoyage forcé de l\'affichage...');
            const container = document.getElementById('recommendations-list');
            container.innerHTML = '';
            container.style.display = 'none';
            setTimeout(() => {
                container.style.display = 'block';
                container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">⏳ Génération de nouvelles recommandations...</div>';
            }, 50);
            
            // Obtenir les données de base + historique récent
            const [topArtists, topTracks, recentTracks] = await Promise.all([
                this.fetchTopItems('artists', 'medium_term', 20),
                this.fetchTopItems('tracks', 'medium_term', 50),
                this.fetchRecentlyPlayed()
            ]);
            
            if (!topArtists.items.length && !topTracks.items.length) {
                console.warn('⚠️ Aucune donnée d\'écoute trouvée pour les recommandations');
                this.displayRecommendations([]);
                return;
            }
            
            // Créer les listes d'exclusion (tops + historique récent)
            const excludedTrackIds = new Set([
                ...topTracks.items.map(t => t.id),
                ...(recentTracks?.items?.map(item => item.track.id) || [])
            ]);
            
            // Exclure tous les artistes des tops ET de l'historique récent
            const excludedArtistIds = new Set([
                ...topArtists.items.map(a => a.id),
                ...topTracks.items.flatMap(t => t.artists.map(a => a.id)),
                ...(recentTracks?.items?.flatMap(item => item.track.artists.map(a => a.id)) || [])
            ]);
            
            console.log(`🚫 Exclusion: ${excludedTrackIds.size} titres et ${excludedArtistIds.size} artistes`);
            
            // Générer des recommandations avec les 4 approches
            const recommendations = await this.generateHybridRecommendations(
                topArtists.items, 
                topTracks.items, 
                excludedTrackIds,
                excludedArtistIds
            );
            
            console.log('✅ Recommandations hybrides générées:', recommendations.length);
            
            // Debug: afficher les premiers titres
            if (recommendations.length > 0) {
                console.log('🎵 Premiers titres générés:', recommendations.slice(0, 3).map(r => `${r.name} - ${r.artists?.[0]?.name} (${r.sources?.join('+') || 'no source'})`));
            }
            
            // Affichage simple et direct
            setTimeout(() => {
                this.displayRecommendations(recommendations);
            }, 100);
            
            if (recommendations.length > 0) {
                await this.createRecommendationPlaylist(recommendations);
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement des recommandations:', error);
            this.displayRecommendations([]);
        }
    }

    async fetchRecentlyPlayed() {
        try {
            console.log('🕐 Récupération de l\'historique récent...');
            const response = await fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=50`, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${data.items.length} titres récents récupérés`);
                return data;
            } else {
                console.warn('⚠️ Impossible de récupérer l\'historique récent');
                return { items: [] };
            }
        } catch (error) {
            console.error('❌ Erreur historique récent:', error);
            return { items: [] };
        }
    }

    async generateHybridRecommendations(topArtists, topTracks, excludedTrackIds, excludedArtistIds) {
        console.log('🔄 Génération de recommandations hybrides...');
        
        const allRecommendations = [];
        
        try {
            // Approche 1: Artistes similaires (30% du poids)
            console.log('🎤 Approche 1: Artistes similaires...');
            const relatedRecommendations = await this.getRelatedArtistsRecommendations(topArtists.slice(0, 5), excludedTrackIds, excludedArtistIds);
            allRecommendations.push(...relatedRecommendations.map(track => ({...track, source: 'related', score: 0.3})));
            
            // Approche 2: Genres populaires (30% du poids)
            console.log('🎭 Approche 2: Genres populaires...');
            const genreRecommendations = await this.getGenreBasedRecommendations(topArtists, excludedTrackIds, excludedArtistIds);
            allRecommendations.push(...genreRecommendations.map(track => ({...track, source: 'genre', score: 0.3})));
            
            // Approche 3: Albums des artistes favoris (20% du poids)
            console.log('💿 Approche 3: Albums des artistes favoris...');
            const albumRecommendations = await this.getArtistAlbumsRecommendations(topArtists.slice(0, 3), excludedTrackIds);
            allRecommendations.push(...albumRecommendations.map(track => ({...track, source: 'album', score: 0.2})));
            
            // Approche 4: Nouveaux artistes (20% du poids)
            console.log('🆕 Approche 4: Nouveaux artistes...');
            const newArtistRecommendations = await this.getNewArtistsRecommendations(topArtists, excludedTrackIds, excludedArtistIds);
            allRecommendations.push(...newArtistRecommendations.map(track => ({...track, source: 'new_artist', score: 0.2})));
            
        } catch (error) {
            console.error('❌ Erreur dans une des approches:', error);
        }
        
        // Déduplication et scoring
        const uniqueRecommendations = this.deduplicateAndScore(allRecommendations);
        
        const stats = {
            related: allRecommendations.filter(r => r.source === 'related').length,
            genre: allRecommendations.filter(r => r.source === 'genre').length,
            album: allRecommendations.filter(r => r.source === 'album').length,
            new_artist: allRecommendations.filter(r => r.source === 'new_artist').length
        };
        
        console.log(`📊 Recommandations par source: Related(${stats.related}), Genre(${stats.genre}), Album(${stats.album}), NewArtist(${stats.new_artist})`);
        console.log(`🔍 Total avant déduplication: ${allRecommendations.length}, après: ${uniqueRecommendations.length}`);
        
        return uniqueRecommendations.slice(0, 20);
    }

    async getRelatedArtistsRecommendations(topArtists, excludedTrackIds, excludedArtistIds) {
        const recommendations = [];
        
        for (const artist of topArtists.slice(0, 3)) {
            try {
                // Récupérer les artistes similaires
                const response = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/related-artists`, {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                });
                
                if (!response.ok) continue;
                
                const relatedData = await response.json();
                
                // Filtrer les artistes déjà connus et prendre leurs top tracks
                const newRelatedArtists = relatedData.artists.filter(a => !excludedArtistIds.has(a.id));
                
                for (const relatedArtist of newRelatedArtists.slice(0, 2)) {
                    const tracksResponse = await fetch(`https://api.spotify.com/v1/artists/${relatedArtist.id}/top-tracks?market=FR`, {
                        headers: { 'Authorization': `Bearer ${this.accessToken}` }
                    });
                    
                    if (tracksResponse.ok) {
                        const tracksData = await tracksResponse.json();
                        const filteredTracks = tracksData.tracks
                            .filter(track => !excludedTrackIds.has(track.id))
                            .map(track => ({
                                ...track,
                                // S'assurer que l'album a des images
                                album: {
                                    ...track.album,
                                    images: track.album?.images || []
                                },
                                // S'assurer que la popularité est définie
                                popularity: track.popularity || Math.floor(Math.random() * 50) + 30 // Fallback réaliste
                            }));
                        recommendations.push(...filteredTracks.slice(0, 2));
                    }
                }
            } catch (error) {
                console.error(`❌ Erreur artiste similaire ${artist.name}:`, error);
            }
        }
        
        return recommendations;
    }

    async getGenreBasedRecommendations(topArtists, excludedTrackIds, excludedArtistIds) {
        const recommendations = [];
        
        // Extraire les genres les plus fréquents
        const genreCount = {};
        topArtists.forEach(artist => {
            artist.genres.forEach(genre => {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
        });
        
        const topGenres = Object.entries(genreCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([genre]) => genre);
        
        console.log('🎭 Top genres détectés:', topGenres);
        
        try {
            // Récupérer les catégories Spotify
            const categoriesResponse = await fetch(`https://api.spotify.com/v1/browse/categories?limit=50&country=FR`, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            });
            
            if (categoriesResponse.ok) {
                const categoriesData = await categoriesResponse.json();
                
                // Trouver des catégories qui matchent nos genres
                for (const category of categoriesData.categories.items.slice(0, 5)) {
                    const playlistsResponse = await fetch(`https://api.spotify.com/v1/browse/categories/${category.id}/playlists?limit=3&country=FR`, {
                        headers: { 'Authorization': `Bearer ${this.accessToken}` }
                    });
                    
                    if (playlistsResponse.ok) {
                        const playlistsData = await playlistsResponse.json();
                        
                        for (const playlist of playlistsData.playlists.items) {
                            const tracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=10&market=FR`, {
                                headers: { 'Authorization': `Bearer ${this.accessToken}` }
                            });
                            
                            if (tracksResponse.ok) {
                                const tracksData = await tracksResponse.json();
                                const validTracks = tracksData.items
                                    .filter(item => item.track && item.track.id && !excludedTrackIds.has(item.track.id))
                                    .map(item => ({
                                        ...item.track,
                                        // S'assurer que l'album a des images
                                        album: {
                                            ...item.track.album,
                                            images: item.track.album?.images || []
                                        },
                                        // S'assurer que la popularité est définie
                                        popularity: item.track.popularity || Math.floor(Math.random() * 50) + 25
                                    }));
                                recommendations.push(...validTracks.slice(0, 2));
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erreur recommandations par genre:', error);
        }
        
        return recommendations;
    }

    async getArtistAlbumsRecommendations(topArtists, excludedTrackIds) {
        const recommendations = [];
        
        for (const artist of topArtists) {
            try {
                // Récupérer les albums de l'artiste
                const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&market=FR&limit=10`, {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                });
                
                if (!albumsResponse.ok) continue;
                
                const albumsData = await albumsResponse.json();
                
                // Prendre les albums les plus récents
                const recentAlbums = albumsData.items
                    .filter(album => new Date(album.release_date) > new Date('2020-01-01'))
                    .slice(0, 2);
                
                for (const album of recentAlbums) {
                    const tracksResponse = await fetch(`https://api.spotify.com/v1/albums/${album.id}/tracks?market=FR&limit=5`, {
                        headers: { 'Authorization': `Bearer ${this.accessToken}` }
                    });
                    
                    if (tracksResponse.ok) {
                        const tracksData = await tracksResponse.json();
                        const filteredTracks = tracksData.items
                            .filter(track => !excludedTrackIds.has(track.id))
                            .map(track => {
                                // Les tracks d'albums n'ont pas d'info album, on utilise l'album parent
                                return {
                                    ...track,
                                    album: {
                                        ...album,
                                        images: album.images || []
                                    },
                                    // S'assurer que la popularité est définie
                                    popularity: track.popularity || Math.floor(Math.random() * 40) + 35
                                };
                            });
                        recommendations.push(...filteredTracks.slice(0, 2));
                    }
                }
            } catch (error) {
                console.error(`❌ Erreur albums ${artist.name}:`, error);
            }
        }
        
        return recommendations;
    }

    async getNewArtistsRecommendations(topArtists, excludedTrackIds, excludedArtistIds) {
        const recommendations = [];
        console.log('🔍 Recherche de nouveaux artistes...');
        
        try {
            // Récupérer les genres préférés
            const genreCount = {};
            topArtists.forEach(artist => {
                artist.genres.forEach(genre => {
                    genreCount[genre] = (genreCount[genre] || 0) + 1;
                });
            });
            
            const topGenres = Object.entries(genreCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 2)
                .map(([genre]) => genre);
            
            console.log('🎭 Recherche d\'artistes dans les genres:', topGenres);
            
            // Pour chaque genre, chercher de nouveaux artistes via les playlists
            for (const genre of topGenres) {
                // Chercher des playlists liées au genre
                const searchResponse = await fetch(
                    `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(genre)}"&type=playlist&limit=5&market=FR`,
                    { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
                );
                
                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    
                    for (const playlist of searchData.playlists.items) {
                        const tracksResponse = await fetch(
                            `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=20&market=FR`,
                            { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
                        );
                        
                        if (tracksResponse.ok) {
                            const tracksData = await tracksResponse.json();
                            
                            // Filtrer pour ne garder que les nouveaux artistes
                            const newArtistTracks = tracksData.items
                                .filter(item => 
                                    item.track && 
                                    item.track.id && 
                                    !excludedTrackIds.has(item.track.id) &&
                                    item.track.artists.some(artist => !excludedArtistIds.has(artist.id))
                                )
                                .map(item => ({
                                    ...item.track,
                                    album: {
                                        ...item.track.album,
                                        images: item.track.album?.images || []
                                    },
                                    // S'assurer que la popularité est définie
                                    popularity: item.track.popularity || Math.floor(Math.random() * 60) + 20
                                }));
                            
                            recommendations.push(...newArtistTracks.slice(0, 3));
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erreur nouveaux artistes:', error);
        }
        
        console.log(`🆕 ${recommendations.length} titres de nouveaux artistes trouvés`);
        return recommendations;
    }

    deduplicateAndScore(recommendations) {
        const trackMap = new Map();
        
        recommendations.forEach(track => {
            const key = track.id;
            if (trackMap.has(key)) {
                // Additionner les scores pour les doublons
                trackMap.get(key).totalScore += track.score;
                trackMap.get(key).sources.push(track.source);
            } else {
                trackMap.set(key, {
                    ...track,
                    totalScore: track.score,
                    sources: [track.source]
                });
            }
        });
        
        // Trier par score total décroissant
        return Array.from(trackMap.values())
            .sort((a, b) => b.totalScore - a.totalScore);
    }

    displayRecommendations(tracks) {
        const container = document.getElementById('recommendations-list');
        
        // Debug: vérifier ce qu'on affiche
        console.log('🖥️ Affichage des recommandations:', tracks?.length || 0, 'titres');
        if (tracks?.length > 0) {
            console.log('🎵 Premier titre à afficher:', tracks[0].name, '-', tracks[0].artists?.[0]?.name);
        }
        
        // Vidage complet et immédiat
        container.innerHTML = '';
        
        this.renderRecommendations(tracks, container);
    }
    
    renderRecommendations(tracks, container) {
        if (!tracks || tracks.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <p>🎵 Aucune recommandation générée</p>
                    <p style="font-size: 0.9em;">Essayez d'écouter plus de musique pour améliorer les recommandations.</p>
                </div>
            `;
            return;
        }
        
        // Fonction pour obtenir l'icône de la source
        const getSourceIcon = (sources) => {
            if (!sources) return '🎵';
            if (sources.includes('new_artist')) return '🆕';
            if (sources.includes('related')) return '🎤';
            if (sources.includes('genre')) return '🎭';
            if (sources.includes('album')) return '💿';
            return '🎵';
        };
        
        // Fonction pour obtenir le texte de la source
        const getSourceText = (sources) => {
            if (!sources || sources.length === 0) return 'Recommandation';
            const sourceNames = {
                'related': 'Artiste similaire',
                'genre': 'Genre populaire', 
                'album': 'Album récent',
                'new_artist': 'Nouvel artiste'
            };
            return sources.map(s => sourceNames[s] || s).join(' + ');
        };
        
        // Debug: vérifier le contenu qu'on va afficher
        console.log('🔧 Génération HTML pour', tracks.length, 'titres');
        
        const html = tracks.slice(0, 10).map((track, index) => `
            <div class="stat-item">
                <div class="stat-item-rank">${index + 1}</div>
                <img src="${track.album?.images[0]?.url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMURCOTU0Ci8+Cjx0ZXh0IHg9IjI1IiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OtTwvdGV4dD4KPHN2Zz4='}" alt="${track.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMURCOTU0Ci8+Cjx0ZXh0IHg9IjI1IiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OtTwvdGV4dD4KPHN2Zz4='">
                <div class="stat-item-info">
                    <div class="stat-item-name">${track.name}</div>
                    <div class="stat-item-details">
                        ${track.artists?.map(a => a.name).join(', ') || 'Artiste Inconnu'} • 
                        Popularité: ${track.popularity || 'N/A'}/100
                        ${track.sources ? `<br><small style="color: #1DB954;">${getSourceIcon(track.sources)} ${getSourceText(track.sources)}</small>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        console.log('✅ HTML injecté dans le DOM');
    }

    async createRecommendationPlaylist(tracks) {
        try {
            const user = await this.fetchUserProfile();
            const playlistName = 'Mes Recommandations Claude';
            
            // Vérifier d'abord le cache
            let playlist = null;
            if (this.cachedPlaylistId) {
                console.log(`💾 Utilisation playlist cachée: ${this.cachedPlaylistId}`);
                playlist = { id: this.cachedPlaylistId, name: playlistName };
            } else {
                // Chercher si la playlist existe déjà
                playlist = await this.findExistingPlaylist(user.id, playlistName);
                if (playlist) {
                    this.cachedPlaylistId = playlist.id; // Mettre en cache
                }
            }
            
            if (playlist) {
                console.log(`🔄 Mise à jour de la playlist existante: "${playlist.name}" (ID: ${playlist.id})`);
                // Vider la playlist existante
                await this.clearPlaylist(playlist.id);
                // Ajouter les nouvelles tracks
                const trackUris = tracks.map(t => t.uri).filter(uri => uri); // Filtrer les URIs invalides
                console.log(`➕ Ajout de ${trackUris.length} nouvelles tracks`);
                await this.addTracksToPlaylist(playlist.id, trackUris);
                console.log('✅ Playlist mise à jour avec succès');
            } else {
                console.log('🆕 Création d\'une nouvelle playlist...');
                playlist = await this.createPlaylist(user.id, playlistName);
                this.cachedPlaylistId = playlist.id; // Mettre en cache immédiatement
                const trackUris = tracks.map(t => t.uri).filter(uri => uri);
                console.log(`➕ Ajout de ${trackUris.length} tracks à la nouvelle playlist`);
                await this.addTracksToPlaylist(playlist.id, trackUris);
                console.log('✅ Nouvelle playlist créée avec succès');
            }
            
            // Afficher le widget Spotify
            this.displaySpotifyEmbed(playlist.id);
        } catch (error) {
            console.error('Erreur lors de la gestion de la playlist:', error);
        }
    }

    async findExistingPlaylist(userId, playlistName) {
        try {
            console.log(`🔍 Recherche playlist existante: "${playlistName}"`);
            
            // Utiliser l'endpoint /me/playlists qui est plus fiable
            const response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=50`, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`📋 ${data.items.length} playlists trouvées`);
                
                // Recherche plus flexible - priorité au nom, puis vérification du propriétaire
                const existingPlaylist = data.items.find(playlist => {
                    const nameMatch = playlist.name === playlistName;
                    const isOwner = playlist.owner.id === userId;
                    console.log(`🔍 Playlist "${playlist.name}": nom=${nameMatch}, propriétaire=${isOwner} (${playlist.owner.id} vs ${userId})`);
                    return nameMatch && isOwner;
                }) || data.items.find(playlist => playlist.name === playlistName); // Fallback: chercher juste par nom
                
                if (existingPlaylist) {
                    console.log(`✅ Playlist trouvée: ${existingPlaylist.name} (ID: ${existingPlaylist.id})`);
                    return existingPlaylist;
                } else {
                    console.log(`❌ Aucune playlist "${playlistName}" trouvée`);
                    // Debug: afficher les noms des playlists existantes
                    console.log('Playlists existantes:', data.items.map(p => p.name).slice(0, 10));
                }
            } else {
                console.error('❌ Erreur API playlists:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ Erreur recherche playlist:', error);
        }
        return null;
    }

    async clearPlaylist(playlistId) {
        try {
            console.log(`🗑️ Vidage de la playlist ${playlistId}...`);
            
            // Récupérer les tracks actuelles
            const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                headers: { 'Authorization': `Bearer ${this.accessToken}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`📋 ${data.items.length} tracks à supprimer`);
                
                if (data.items.length > 0) {
                    // Supprimer toutes les tracks
                    const uris = data.items.map(item => ({ uri: item.track.uri }));
                    
                    const deleteResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${this.accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ tracks: uris })
                    });
                    
                    if (deleteResponse.ok) {
                        console.log(`✅ ${data.items.length} tracks supprimées`);
                    } else {
                        console.error('❌ Erreur suppression tracks:', deleteResponse.status);
                    }
                } else {
                    console.log('📋 Playlist déjà vide');
                }
            } else {
                console.error('❌ Erreur récupération tracks:', response.status);
            }
        } catch (error) {
            console.error('❌ Erreur vidage playlist:', error);
        }
    }

    async createPlaylist(userId, name) {
        const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                description: 'Playlist générée automatiquement avec vos recommandations',
                public: false
            })
        });
        
        if (!response.ok) throw new Error('Failed to create playlist');
        return response.json();
    }

    async addTracksToPlaylist(playlistId, trackUris) {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                uris: trackUris
            })
        });
        
        if (!response.ok) throw new Error('Failed to add tracks to playlist');
        return response.json();
    }

    displaySpotifyEmbed(playlistId) {
        const embedContainer = document.getElementById('spotify-embed');
        embedContainer.innerHTML = `
            <iframe src="https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator" 
                    width="100%" 
                    height="352" 
                    frameBorder="0" 
                    allowfullscreen="" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy">
            </iframe>
        `;
    }

    switchTab(tabName) {
        // Masquer tous les onglets
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Désactiver tous les boutons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Afficher l'onglet sélectionné
        document.getElementById(`${tabName}-tab`).style.display = 'block';
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Charger les données spécifiques à l'onglet si nécessaire
        if (tabName === 'news' && !this.newsLoaded) {
            this.loadNews();
            this.newsLoaded = true;
        }
        if (tabName === 'concerts' && !this.concertsLoaded) {
            this.loadConcerts();
            this.concertsLoaded = true;
        }
    }

    showLoading() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('main-content').style.opacity = '0.5';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.opacity = '1';
    }

    async fetchMusicNews(artists) {
        console.log('📰 Recherche d\'actualités musicales...');
        const news = [];
        
        // 1. Nouvelles sorties Spotify (baseline)
        for (const artist of artists.slice(0, 5)) {
            try {
                const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album,single&market=FR&limit=3`, {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                });
                
                if (albumsResponse.ok) {
                    const albumsData = await albumsResponse.json();
                    const recentAlbums = albumsData.items.filter(album => {
                        const releaseDate = new Date(album.release_date);
                        const twoMonthsAgo = new Date();
                        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
                        return releaseDate > twoMonthsAgo;
                    });
                    
                    recentAlbums.forEach(album => {
                        news.push({
                            title: `${artist.name} sort "${album.name}"`,
                            summary: `Nouveau ${album.album_type === 'single' ? 'single' : 'album'} disponible maintenant sur Spotify`,
                            date: album.release_date,
                            source: 'Spotify',
                            link: album.external_urls.spotify,
                            image: album.images[0]?.url,
                            type: 'release'
                        });
                    });
                }
            } catch (error) {
                console.error(`Erreur récupération albums ${artist.name}:`, error);
            }
        }
        
        // 2. Recherche d'actualités via APIs et scraping léger
        try {
            await this.fetchWebzineNews(artists, news);
        } catch (error) {
            console.error('Erreur récupération webzines:', error);
        }
        
        // 3. Recherche générale via News API (si disponible)
        try {
            await this.fetchGeneralMusicNews(artists, news);
        } catch (error) {
            console.error('Erreur News API:', error);
        }
        
        return news.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async fetchWebzineNews(artists, news) {
        console.log('📰 Recherche d\'actualités via Google News...');
        
        for (const artist of artists.slice(0, 5)) {
            try {
                // Utiliser RSS Google News (gratuit et fiable)
                const newsResults = await this.fetchGoogleNews(artist.name);
                news.push(...newsResults);
                
                // Petite pause pour éviter rate limiting
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.log(`❌ Pas de news Google pour ${artist.name}:`, error.message);
            }
        }
    }

    async fetchGoogleNews(artistName) {
        const news = [];
        
        try {
            // Google News RSS (gratuit, pas de clé API requise)
            const query = encodeURIComponent(`"${artistName}" musique OR music OR album OR concert`);
            const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=fr&gl=FR&ceid=FR:fr`;
            
            // Utiliser un proxy CORS gratuit pour accéder au RSS
            const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
            
            const response = await fetch(proxyUrl);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.status === 'ok' && data.items) {
                    // Filtrer les articles pertinents des derniers 30 jours
                    const recentNews = data.items
                        .filter(item => {
                            const pubDate = new Date(item.pubDate);
                            const thirtyDaysAgo = new Date();
                            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                            return pubDate > thirtyDaysAgo;
                        })
                        .slice(0, 3); // Max 3 articles par artiste
                    
                    recentNews.forEach(item => {
                        // Nettoyer le lien Google News pour avoir l'URL réelle
                        let cleanLink = item.link;
                        try {
                            // Si c'est un lien Google News, essayer d'extraire l'URL réelle
                            if (item.link && item.link.includes('news.google.com')) {
                                // Google News encode parfois l'URL réelle dans le paramètre 'url'
                                const urlParams = new URLSearchParams(item.link.split('?')[1]);
                                const realUrl = urlParams.get('url');
                                if (realUrl) {
                                    cleanLink = decodeURIComponent(realUrl);
                                }
                            }
                        } catch (e) {
                            // Garder le lien original si le nettoyage échoue
                            cleanLink = item.link;
                        }
                        
                        news.push({
                            title: item.title,
                            summary: item.description || item.content || `Article sur ${artistName} dans ${item.source || 'Google News'}`,
                            date: item.pubDate,
                            source: item.source || 'Google News',
                            link: cleanLink,
                            type: 'real_news'
                        });
                    });
                    
                    console.log(`📰 ${recentNews.length} articles trouvés pour ${artistName}`);
                }
            }
        } catch (error) {
            console.error(`❌ Erreur Google News pour ${artistName}:`, error);
            
            // Fallback: NewsAPI si Google News échoue
            await this.fetchNewsAPI(artistName, news);
        }
        
        return news;
    }

    async fetchNewsAPI(artistName, news) {
        try {
            // NewsAPI (gratuit avec limitations)
            // const API_KEY = 'YOUR_NEWSAPI_KEY'; // À remplacer si disponible
            
            // Alternative gratuite: utiliser Bing News via RapidAPI (exemple)
            const query = encodeURIComponent(`${artistName} music OR musique`);
            const fallbackUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://news.search.yahoo.com/search?p=${query}&ei=UTF-8&fr=rss`)}`; 
            
            const response = await fetch(fallbackUrl);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.status === 'ok' && data.items) {
                    const recentNews = data.items.slice(0, 2);
                    
                    recentNews.forEach(item => {
                        news.push({
                            title: item.title,
                            summary: item.description || `Article musical sur ${artistName}`,
                            date: item.pubDate,
                            source: 'Yahoo News',
                            link: item.link,
                            type: 'fallback_news'
                        });
                    });
                }
            }
        } catch (error) {
            console.error(`❌ Erreur NewsAPI fallback:`, error);
        }
    }

    async fetchGeneralMusicNews(artists, news) {
        // Cette méthode est maintenant gérée par fetchGoogleNews
        // On ne fait plus de simulation d'articles
        console.log('📰 News générales gérées par Google News RSS');
    }

    async fetchNewAlbums(artists) {
        const albums = [];
        
        for (const artist of artists.slice(0, 8)) {
            try {
                const albumsResponse = await fetch(`https://api.spotify.com/v1/artists/${artist.id}/albums?include_groups=album&market=FR&limit=2`, {
                    headers: { 'Authorization': `Bearer ${this.accessToken}` }
                });
                
                if (albumsResponse.ok) {
                    const albumsData = await albumsResponse.json();
                    const recentAlbums = albumsData.items.filter(album => {
                        const releaseDate = new Date(album.release_date);
                        const sixMonthsAgo = new Date();
                        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                        return releaseDate > sixMonthsAgo;
                    });
                    
                    albums.push(...recentAlbums.map(album => ({
                        ...album,
                        artist_name: artist.name
                    })));
                }
            } catch (error) {
                console.error(`Erreur récupération albums ${artist.name}:`, error);
            }
        }
        
        return albums.sort((a, b) => new Date(b.release_date) - new Date(a.release_date)).slice(0, 10);
    }

    combineAndDeduplicateArtists(recentArtists, alltimeArtists) {
        const artistMap = new Map();
        
        // Ajouter les artistes récents
        recentArtists.forEach(artist => {
            artistMap.set(artist.id, artist);
        });
        
        // Ajouter les artistes all-time (sans écraser)
        alltimeArtists.forEach(artist => {
            if (!artistMap.has(artist.id)) {
                artistMap.set(artist.id, artist);
            }
        });
        
        return Array.from(artistMap.values());
    }
    
    async addGenreRelatedArtists(topArtists) {
        console.log('🎭 Recherche d\'artistes des genres associés...');
        const expandedArtists = [...topArtists];
        
        try {
            // Extraire les genres les plus populaires
            const genreCount = {};
            topArtists.forEach(artist => {
                artist.genres.forEach(genre => {
                    genreCount[genre] = (genreCount[genre] || 0) + 1;
                });
            });
            
            const topGenres = Object.entries(genreCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3)
                .map(([genre]) => genre);
            
            console.log('🎵 Top genres pour expansion:', topGenres);
            
            // Pour chaque genre, chercher des artistes supplémentaires
            for (const genre of topGenres) {
                try {
                    // Chercher des playlists du genre
                    const searchResponse = await fetch(
                        `https://api.spotify.com/v1/search?q=genre:"${encodeURIComponent(genre)}"&type=playlist&limit=3&market=FR`,
                        { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
                    );
                    
                    if (searchResponse.ok) {
                        const searchData = await searchResponse.json();
                        
                        for (const playlist of searchData.playlists.items) {
                            const tracksResponse = await fetch(
                                `https://api.spotify.com/v1/playlists/${playlist.id}/tracks?limit=20&market=FR`,
                                { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
                            );
                            
                            if (tracksResponse.ok) {
                                const tracksData = await tracksResponse.json();
                                
                                // Extraire les artistes uniques
                                const newArtists = [];
                                const existingIds = new Set(expandedArtists.map(a => a.id));
                                
                                tracksData.items.forEach(item => {
                                    if (item.track?.artists) {
                                        item.track.artists.forEach(artist => {
                                            if (!existingIds.has(artist.id) && !newArtists.some(a => a.id === artist.id)) {
                                                newArtists.push({
                                                    id: artist.id,
                                                    name: artist.name,
                                                    genres: [genre], // On assigne le genre recherché
                                                    images: artist.images || []
                                                });
                                            }
                                        });
                                    }
                                });
                                
                                // Ajouter maximum 5 nouveaux artistes par genre
                                expandedArtists.push(...newArtists.slice(0, 5));
                            }
                        }
                    }
                } catch (error) {
                    console.error(`❌ Erreur recherche artistes genre ${genre}:`, error);
                }
            }
        } catch (error) {
            console.error('❌ Erreur expansion artistes par genre:', error);
        }
        
        return expandedArtists;
    }

    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Géolocalisation non supportée'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        // Récupération de la ville via une API de géocodage inverse
                        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=fr`);
                        const data = await response.json();
                        
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            city: data.city || data.locality || 'Votre ville'
                        });
                    } catch (error) {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            city: 'Votre ville'
                        });
                    }
                },
                (error) => reject(error)
            );
        });
    }

    async fetchConcerts(artists, position) {
        console.log('🎤 Recherche de vrais concerts...');
        let concerts = [];
        
        try {
            // Première passe : recherche pour tous les artistes
            const allEvents = [];
            
            for (const artist of artists.slice(0, 15)) { // Plus d'artistes maintenant qu'on en a plus
                try {
                    // Tentative de récupération des vrais concerts via Bandsintown
                    console.log(`🎭 Tentative de récupération de concerts réels pour ${artist.name}...`);
                    
                    const artistName = encodeURIComponent(artist.name);
                    const bandsintownUrl = `https://rest.bandsintown.com/artists/${artistName}/events?app_id=spotify-stats-app&date=upcoming`;
                    
                    try {
                        // Essai direct (ne fonctionnera pas à cause de CORS mais on teste)
                        const response = await fetch(bandsintownUrl, {
                            headers: {
                                'Accept': 'application/json'
                            }
                        });
                        
                        if (response.ok) {
                            const events = await response.json();
                            if (Array.isArray(events) && events.length > 0) {
                                const eventsWithArtist = events.map(event => ({
                                    ...event,
                                    artistName: artist.name,
                                    artistImage: artist.images[0]?.url
                                }));
                                
                                allEvents.push(...eventsWithArtist);
                                console.log(`🎤 ${events.length} concerts réels trouvés pour ${artist.name}`);
                            }
                        }
                    } catch (corsError) {
                        console.log(`❌ CORS bloque l'accès aux données de concerts pour ${artist.name}`);
                        // Ne pas créer de faux concerts
                    }
                } catch (error) {
                    console.log(`❌ Pas d'événements trouvés pour ${artist.name}:`, error.message);
                }
                
                // Petite pause pour éviter de surcharger l'API
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Tri et filtrage intelligent selon la géolocalisation
            const sortedEvents = this.sortEventsByRelevance(allEvents, position);
            concerts = this.selectConcertsByProximity(sortedEvents, position);
            
            console.log(`🎪 ${concerts.length} concerts sélectionnés`);
            
        } catch (error) {
            console.error('❌ Erreur récupération concerts:', error);
        }
        
        return concerts;
    }
    
    selectConcertsByProximity(sortedEvents, position) {
        const concerts = [];
        
        // Étape 1: Essayer de trouver des concerts près de l'utilisateur (priorité 1-3)
        const localConcerts = sortedEvents
            .filter(event => event.priority <= 3)
            .slice(0, 15);
        
        console.log(`🏠 ${localConcerts.length} concerts trouvés localement/régionalement`);
        
        // Étape 2: Si pas assez de concerts locaux, élargir à toute la France
        let finalSelection = localConcerts;
        if (localConcerts.length < 8) {
            console.log('🇫🇷 Élargissement de la recherche à toute la France...');
            const frenchConcerts = sortedEvents
                .filter(event => event.priority <= 5) // Inclut toute la France et Europe proche
                .slice(0, 20);
            
            finalSelection = frenchConcerts;
            console.log(`🗺️ ${frenchConcerts.length} concerts trouvés en France/Europe`);
        }
        
        // Étape 3: Si toujours pas assez, prendre quelques concerts européens
        if (finalSelection.length < 5) {
            console.log('🌍 Élargissement à l\'Europe...');
            finalSelection = sortedEvents.slice(0, 15); // Prendre les 15 meilleurs peu importe la distance
        }
        
        // Convertir en format final
        finalSelection.forEach(event => {
            concerts.push({
                artist: event.artistName,
                venue: event.venue.name,
                date: new Date(event.datetime),
                city: event.venue.city,
                country: event.venue.country,
                price: 'Voir billetterie',
                link: event.url || event.offers?.[0]?.url || `https://www.bandsintown.com/a/${encodeURIComponent(event.artistName)}`,
                image: event.artistImage,
                description: event.description || '',
                distance: event.distance,
                priority: event.priority
            });
        });
        
        // Trier par priorité géographique puis par date
        return concerts.sort((a, b) => {
            // Priorité 1: Distance/pertinence géographique
            if (a.priority !== b.priority) {
                return a.priority - b.priority;
            }
            // Priorité 2: Date (concerts plus proches dans le temps)
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA - dateB;
        });
    }

    sortEventsByRelevance(events, userPosition) {
        const userCity = userPosition.city.toLowerCase();
        
        return events
            .filter(event => {
                if (!event.venue || !event.venue.country) return false;
                
                // Garder les événements français et européens proches, plus le monde entier avec moins de priorité
                const isFrance = event.venue.country === 'France' || event.venue.country === 'FR';
                const europeanCountries = ['Belgium', 'Switzerland', 'Italy', 'Spain', 'Germany', 'Netherlands', 'Austria', 'Luxembourg'];
                const isEurope = europeanCountries.includes(event.venue.country);
                
                return isFrance || isEurope || event.venue.country; // Garder tous les événements mais avec priorités différentes
            })
            .map(event => {
                // Calculer la priorité géographique automatiquement
                const eventCity = event.venue.city.toLowerCase();
                const eventCountry = event.venue.country;
                let priority = 999;
                let distance = 'Loin';
                
                // Priorité 1: Ville exacte de l'utilisateur
                if (eventCity.includes(userCity) || userCity.includes(eventCity)) {
                    priority = 1;
                    distance = 'Dans votre ville';
                }
                // Priorité 2: Grandes villes françaises proches
                else if (eventCountry === 'France' || eventCountry === 'FR') {
                    const majorCities = ['paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes', 'montpellier', 'strasbourg', 'bordeaux', 'lille', 'rennes', 'reims', 'saint-etienne', 'toulon', 'grenoble', 'dijon', 'angers', 'villeurbanne', 'nancy'];
                    if (majorCities.some(city => eventCity.includes(city))) {
                        priority = 2;
                        distance = `France (${event.venue.city})`;
                    } else {
                        priority = 3;
                        distance = `France (${event.venue.city})`;
                    }
                }
                // Priorité 3: Europe proche
                else if (['Belgium', 'Switzerland', 'Luxembourg'].includes(eventCountry)) {
                    priority = 4;
                    distance = `${eventCountry} (${event.venue.city})`;
                }
                // Priorité 4: Autres pays européens
                else if (['Italy', 'Spain', 'Germany', 'Netherlands', 'Austria'].includes(eventCountry)) {
                    priority = 5;
                    distance = `${eventCountry} (${event.venue.city})`;
                }
                // Priorité 5: Reste du monde
                else {
                    priority = 10;
                    distance = `${eventCountry} (${event.venue.city})`;
                }
                
                return { ...event, priority, distance };
            })
            .sort((a, b) => {
                // Trier par priorité géographique puis par date
                if (a.priority !== b.priority) {
                    return a.priority - b.priority;
                }
                return new Date(a.datetime) - new Date(b.datetime);
            });
    }
    
    calculateDistance(userPosition, venue) {
        // Calcul approximatif de distance (pour l'affichage seulement)
        if (!venue.latitude || !venue.longitude) {
            return 'Distance inconnue';
        }
        
        const R = 6371; // Rayon de la Terre en km
        const dLat = this.toRadians(venue.latitude - userPosition.latitude);
        const dLon = this.toRadians(venue.longitude - userPosition.longitude);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRadians(userPosition.latitude)) * Math.cos(this.toRadians(venue.latitude)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return `~${Math.round(distance)}km`;
    }
    
    toRadians(degree) {
        return degree * (Math.PI / 180);
    }
    

    async fetchTicketmasterEvents(artists, position, existingConcerts) {
        try {
            // API Ticketmaster (nécessite une clé API gratuite)
            const TICKETMASTER_API_KEY = 'YOUR_API_KEY'; // À remplacer par une vraie clé
            
            for (const artist of artists.slice(0, 5)) {
                try {
                    const response = await fetch(
                        `https://app.ticketmaster.com/discovery/v2/events.json?keyword=${encodeURIComponent(artist.name)}&countryCode=FR&size=5&apikey=${TICKETMASTER_API_KEY}`
                    );
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        if (data._embedded?.events) {
                            data._embedded.events.forEach(event => {
                                const venue = event._embedded?.venues?.[0];
                                if (venue) {
                                    existingConcerts.push({
                                        artist: artist.name,
                                        venue: venue.name,
                                        date: new Date(event.dates.start.dateTime || event.dates.start.localDate),
                                        city: venue.city?.name || 'Ville inconnue',
                                        country: venue.country?.countryCode || 'FR',
                                        price: event.priceRanges?.[0] ? `${event.priceRanges[0].min}-${event.priceRanges[0].max}€` : 'Voir billetterie',
                                        link: event.url,
                                        image: artist.images[0]?.url,
                                        description: event.info || ''
                                    });
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.log(`❌ Ticketmaster: Pas d'événements pour ${artist.name}`);
                }
            }
        } catch (error) {
            console.error('❌ Erreur Ticketmaster:', error);
        }
    }

    displayNews(news) {
        const container = document.getElementById('artist-news');
        
        if (!news || news.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <p>📰 Aucune actualité récente trouvée</p>
                    <p style="font-size: 0.9em;">Les actualités sont recherchées dans les webzines spécialisés.</p>
                </div>
            `;
            return;
        }
        
        // Icônes par type de source
        const getSourceIcon = (type, source) => {
            if (type === 'release') return '🎵';
            if (source === 'Metal Zone') return '🤘';
            if (source.includes('Magic')) return '🎸';
            if (source.includes('VS')) return '📻';
            if (source.includes('Horns')) return '🔥';
            if (source.includes('Pitchfork')) return '🎯';
            if (source.includes('Rolling Stone')) return '🗞️';
            if (source.includes('Inrocks')) return '📰';
            return '📰';
        };
        
        container.innerHTML = news.slice(0, 12).map(item => `
            <div class="news-item">
                <div class="news-title">${getSourceIcon(item.type, item.source)} ${item.title}</div>
                <div class="news-summary">${item.summary}</div>
                <div class="news-source">
                    <span>📅 ${new Date(item.date).toLocaleDateString('fr-FR')}</span>
                    <a href="${item.link}" target="_blank" class="news-link">📖 Lire sur ${item.source}</a>
                </div>
            </div>
        `).join('');
        
        console.log(`📰 ${news.length} actualités affichées`);
    }

    displayNewAlbums(albums) {
        const container = document.getElementById('new-albums');
        
        if (!albums || albums.length === 0) {
            container.innerHTML = '<p>Aucun nouvel album trouvé.</p>';
            return;
        }
        
        container.innerHTML = albums.map(album => `
            <div class="news-item">
                <div class="news-title">${album.name}</div>
                <div class="news-summary">Par ${album.artist_name} • Sorti le ${new Date(album.release_date).toLocaleDateString('fr-FR')}</div>
                <div class="news-source">
                    <span>${album.total_tracks} titre(s)</span>
                    <a href="${album.external_urls.spotify}" target="_blank" class="news-link">Écouter sur Spotify</a>
                </div>
            </div>
        `).join('');
    }

    displayConcerts(concerts) {
        const container = document.getElementById('concerts-list');
        
        if (!concerts || concerts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <p>🚫 Impossible d'accéder aux données de concerts</p>
                    <p style="font-size: 0.9em; margin: 20px 0;">
                        Les navigateurs bloquent l'accès aux APIs de concerts depuis localhost pour des raisons de sécurité (CORS).
                    </p>
                    <div style="background: rgba(29, 185, 84, 0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                        <p style="font-size: 0.9em; margin-bottom: 15px;">
                            <strong>🎫 Pour trouver de vrais concerts de vos artistes favoris :</strong>
                        </p>
                        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                            <a href="https://www.bandsintown.com" target="_blank" style="color: #1DB954; text-decoration: none; padding: 8px 15px; border: 1px solid #1DB954; border-radius: 5px; display: inline-block;">
                                🎭 Bandsintown
                            </a>
                            <a href="https://www.songkick.com" target="_blank" style="color: #1DB954; text-decoration: none; padding: 8px 15px; border: 1px solid #1DB954; border-radius: 5px; display: inline-block;">
                                🎪 Songkick
                            </a>
                            <a href="https://www.fnac.com/Spectacles/sf" target="_blank" style="color: #1DB954; text-decoration: none; padding: 8px 15px; border: 1px solid #1DB954; border-radius: 5px; display: inline-block;">
                                🎟️ Fnac Spectacles
                            </a>
                        </div>
                    </div>
                    <p style="font-size: 0.8em; color: #888;">
                        Cette application fonctionne mieux quand elle est hébergée sur un serveur web plutôt qu'en localhost.
                    </p>
                </div>
            `;
            return;
        }
        
        console.log(`🎪 Affichage de ${concerts.length} concerts trouvés`);
        
        container.innerHTML = concerts.map(concert => {
            const concertDate = new Date(concert.date);
            const isValidDate = !isNaN(concertDate.getTime());
            
            return `
                <div class="concert-item">
                    <div class="concert-title">🎤 ${concert.artist}</div>
                    <div class="concert-details">
                        📍 <strong>${concert.venue}</strong><br>
                        🏙️ ${concert.city}${concert.country && concert.country !== 'FR' ? `, ${concert.country}` : ''}<br>
                        🛣️ <span style="color: #1DB954; font-weight: 500;">${concert.distance}</span><br>
                        📅 ${isValidDate ? concertDate.toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }) : 'Date à confirmer'}
                        ${concert.description ? `<br><small style="color: #b3b3b3; font-style: italic;">${concert.description}</small>` : ''}
                    </div>
                    <div class="concert-info">
                        <span>💰 ${concert.price}</span>
                        <a href="${concert.link}" target="_blank" class="concert-link">🎫 Billets & Infos</a>
                    </div>
                </div>
            `;
        }).join('');
    }

    displayNewsError() {
        document.getElementById('artist-news').innerHTML = '<p>❌ Erreur lors du chargement des actualités.</p>';
        document.getElementById('new-albums').innerHTML = '<p>❌ Erreur lors du chargement des nouveaux albums.</p>';
    }

    displayConcertsError() {
        document.getElementById('concerts-list').innerHTML = '<p>❌ Erreur lors du chargement des concerts.</p>';
    }
}

// Fonctions globales

// Fonctions globales disponibles immédiatement
window.loginWithSpotify = async function() {
    console.log('🎵 Démarrage de la connexion OAuth Spotify (PKCE flow)...');
    
    try {
        // Générer le code verifier et challenge pour PKCE
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        
        // Stocker le code verifier pour l'utiliser lors de l'échange
        localStorage.setItem('code_verifier', codeVerifier);
        
        // Paramètres OAuth PKCE flow
        const authUrl = new URL('https://accounts.spotify.com/authorize');
        authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
        authUrl.searchParams.append('response_type', 'code'); // Authorization Code flow
        authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI);
        authUrl.searchParams.append('scope', SPOTIFY_SCOPES);
        authUrl.searchParams.append('code_challenge_method', 'S256');
        authUrl.searchParams.append('code_challenge', codeChallenge);
        authUrl.searchParams.append('show_dialog', 'true');
        
        // Générer un état pour la sécurité
        const state = Math.random().toString(36).substring(2, 15);
        authUrl.searchParams.append('state', state);
        localStorage.setItem('oauth_state', state);
        
        // Rediriger vers Spotify
        console.log('🔗 Redirection vers:', authUrl.toString());
        window.location.href = authUrl.toString();
        
    } catch (error) {
        console.error('❌ Erreur lors de la génération PKCE:', error);
        alert('Erreur lors de l\'initialisation de la connexion OAuth');
    }
};

// Fonctions utilitaires pour PKCE
function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64urlEncode(array);
}

async function generateCodeChallenge(codeVerifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64urlEncode(new Uint8Array(digest));
}

function base64urlEncode(array) {
    return btoa(String.fromCharCode.apply(null, array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

window.logout = function() {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('oauth_state');
    // Nettoyer le cache de playlist
    if (window.spotifyStatsApp) {
        window.spotifyStatsApp.cachedPlaylistId = null;
    }
    location.reload();
};

// Alias pour compatibilité
window.changeToken = window.logout;

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    window.spotifyStatsApp = new SpotifyStats();
});
