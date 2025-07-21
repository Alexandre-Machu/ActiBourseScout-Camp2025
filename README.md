# 🏕️ ActiBourseScout

Simulation de bourse interactive pour activité scout - Camp 2025. Application web moderne avec support serveur optionnel.

## 🌟 Deux Modes de Fonctionnement

### 🌐 **Mode Local (Simple)**
Interface HTML/CSS/JavaScript standalone, fonctionne directement dans le navigateur.
- **Fichiers** : `index.html`, `script.js`, `style.css`
- **Avantages** : Aucune installation, fonctionne hors ligne, démarrage instantané
- **Lancement** : Ouvrir `index.html` dans un navigateur

### 🚀 **Mode Serveur (Railway)**
Application Node.js avec synchronisation temps réel entre plusieurs clients.
- **Fichiers** : `server.js`, `package.json`, `railway.json`
- **Avantages** : Synchronisation multi-appareils, données centralisées, WebSockets
- **Déploiement** : Automatique sur Railway via GitHub

## 🚀 Installation et Lancement

### Mode Local (Recommandé pour tests)
```bash
# Aucune installation requise !
# Ouvrir directement index.html dans votre navigateur
```

### Mode Serveur (Railway)
```bash
# 1. Cloner le repository
git clone [votre-repo]
cd ActiBourseScout-Camp2025

# 2. Installer les dépendances
npm install

# 3. Démarrer en local
npm start
# Accessible sur http://localhost:3000

# 4. Déployer sur Railway
# - Connecter votre repository GitHub à Railway
# - Le déploiement se fait automatiquement via railway.json
```

## 🎮 Fonctionnalités

### 📊 **Simulation de Marché**
- **8 actions** : Mont Blanc 🏔️, Monster 👹, Benco 🍫, Opinel 🔪, Quechua 🏕️, Red Bull 🐂, Patagonia 🧗, Salomon 🥾
- Prix initial : **50 points** chacune
- Cours fluctuant automatiquement selon le mode choisi
- Variations de -20% à +20% par mise à jour

### 👥 **Gestion d'Équipes**
- **5 équipes** : Alouettes 🦅, Canard 🦆, Panda 🐼, Panthère 🐆, Phaco 🦏
- **500 points** de départ chacune
- Calcul automatique de la valeur totale du portefeuille
- Conversion en jetons : **50 points = 1 jeton**

### 🎛️ **Modes de Jeu**
- **Mode Test** : Variations toutes les **10 secondes** (pour tests et démonstrations)
- **Mode Jeu** : Variations aléatoires entre **5 minutes et 1h30** (pour l'activité réelle)

### 💰 **Système de Transactions**
- Interface intuitive pour acheter/vendre des actions
- Vérification automatique des fonds et stocks disponibles
- Historique complet des transactions avec horodatage
- Calcul automatique des coûts et bénéfices

### 🏆 **Classement en Temps Réel**
- Tableau de classement automatique par valeur de portefeuille
- Calcul automatique des jetons gagnés pour le jeu du soir
- Mise à jour en temps réel des positions

### 📊 **Graphiques Interactifs**
- Évolution des cours en temps réel avec Chart.js
- Interface responsive adaptée à tous les écrans
- Animations et transitions fluides

## 🎯 Utilisation lors de l'Activité

### Préparation
1. **Choisir le mode** : Local (simple) ou Serveur (multi-appareils)
2. **Mode Test** : Vérifier le fonctionnement avec des variations rapides
3. **Formation** : Expliquer les règles aux équipes

### Pendant l'Activité
1. **Démarrage** : Basculer en mode Jeu et cliquer sur "Démarrer l'activité"
2. **Transactions** : Les équipes viennent demander des achats/ventes
3. **Suivi** : Observer l'évolution des cours et des classements
4. **Animation** : Utiliser les variations pour créer du suspense

### Fin d'Activité
1. **Arrêt** : Stopper les variations de cours
2. **Classement final** : Consulter le tableau des jetons
3. **Distribution** : Remettre les jetons selon le classement

## 🔧 Personnalisation

### Configuration Globale
Modifiez les paramètres dans `script.js` et `server.js` :
```javascript
const CONFIG = {
    INITIAL_POINTS: 500,        // Points de départ par équipe
    TEST_UPDATE_INTERVAL: 10000, // Mode test (ms)
    GAME_MIN_INTERVAL: 300000,  // Mode jeu min (ms)
    GAME_MAX_INTERVAL: 5400000, // Mode jeu max (ms)
    TEAMS: [
        { id: 'alouettes', name: '🦅 Alouettes', emoji: '🦅', color: '#3498db' },
        { id: 'canard', name: '🦆 Canard', emoji: '🦆', color: '#f39c12' },
        { id: 'panda', name: '🐼 Panda', emoji: '🐼', color: '#2ecc71' },
        { id: 'panthere', name: '🐆 Panthère', emoji: '🐆', color: '#9b59b6' },
        { id: 'phaco', name: '🦏 Phaco', emoji: '🦏', color: '#e74c3c' }
    ],
    STOCKS: [
        { id: 'montblanc', name: '🏔️ Mont Blanc', initialPrice: 50 },
        { id: 'monster', name: '👹 Monster', initialPrice: 50 },
        { id: 'benco', name: '🍫 Benco', initialPrice: 50 },
        { id: 'opinel', name: '🔪 Opinel', initialPrice: 50 },
        { id: 'quechua', name: '🏕️ Quechua', initialPrice: 50 },
        { id: 'redbull', name: '🐂 Red Bull', initialPrice: 50 },
        { id: 'patagonia', name: '🧗 Patagonia', initialPrice: 50 },
        { id: 'salomon', name: '🥾 Salomon', initialPrice: 50 }
    ]
};
```

## 🌐 Déploiement

### 🚂 **Railway (Recommandé)**
Railway offre un déploiement automatique et gratuit pour ce projet :

#### Configuration automatique
- Le fichier `railway.json` configure le déploiement
- Le fichier `package.json` définit les dépendances Node.js
- Variables d'environnement gérées via l'interface Railway

#### Étapes de déploiement
1. **Créer un compte** sur [railway.app](https://railway.app)
2. **Connecter GitHub** : Lier votre repository
3. **Déployer** : Railway détecte automatiquement Node.js
4. **Configurer** : Le domaine est généré automatiquement
5. **Accéder** : L'application est disponible instantanément

#### Avantages Railway
- ✅ **Gratuit** pour les projets open source
- ✅ **Déploiement automatique** via Git
- ✅ **Domaine HTTPS** inclus
- ✅ **Surveillance** et logs intégrés
- ✅ **Scaling automatique**

### Alternatives de déploiement
- **Local** : `npm start` pour tests en local
- **Render** : Alternative gratuite similaire
- **Vercel** : Utilise le fichier `vercel.json` inclus
- **Heroku** : Support via `package.json`

## 📱 Compatibilité

### Appareils Supportés
- 📱 **Smartphones** : Interface responsive optimisée
- 📱 **Tablettes** : Affichage adaptatif automatique
- 💻 **Ordinateurs portables** : Interface complète
- 🖥️ **Ordinateurs de bureau** : Expérience optimale

### Navigateurs
- ✅ Chrome/Chromium (recommandé)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

## 🛠️ Architecture Technique

### Mode Local
- **Frontend** : HTML5, CSS3, JavaScript ES6+
- **Stockage** : localStorage du navigateur
- **Graphiques** : Chart.js
- **Design** : CSS Grid et Flexbox responsive

### Mode Serveur
- **Backend** : Node.js + Express
- **Communication** : WebSockets avec Socket.IO
- **Synchronisation** : État partagé en temps réel
- **Déploiement** : Railway avec configuration automatique

### Fichiers clés
```
ActiBourseScout-Camp2025/
├── index.html          # Interface principale
├── script.js           # Logique frontend + mode local
├── style.css           # Design responsive
├── server.js           # Serveur Node.js + Socket.IO
├── package.json        # Dépendances Node.js
├── railway.json        # Configuration Railway
├── vercel.json         # Configuration Vercel (alternative)
└── README.md          # Documentation
```

## 🚀 Avantages par Mode

### 🌐 Mode Local
- ✅ **Simplicité** : Aucune installation
- ✅ **Rapidité** : Démarrage instantané
- ✅ **Hors ligne** : Fonctionne sans internet
- ✅ **Sécurité** : Données locales uniquement

### 🚂 Mode Railway
- ✅ **Multi-appareils** : Synchronisation temps réel
- ✅ **Collaboration** : Plusieurs animateurs
- ✅ **Persistance** : Données centralisées
- ✅ **Professionnel** : URL partageable

## 🎪 Parfait pour les Scouts !

Cette application a été spécialement conçue pour une activité scout, avec :

### 🎯 **Pédagogie**
- Apprentissage ludique de concepts économiques
- Prise de décision en équipe
- Gestion du risque et de l'incertitude

### 🎮 **Engagement**
- Interface colorée et attractive
- Système de récompenses (jetons)
- Compétition saine entre équipes

### 👨‍🏫 **Facilité d'Animation**
- Contrôles simples et intuitifs
- Modes test et jeu adaptés
- Interface responsive pour tous appareils

### ⚡ **Flexibilité**
- Mode local pour simplicité ou mode serveur pour collaboration
- Personnalisation facile des paramètres
- Déploiement automatique sur Railway

---

**Développé avec ❤️ pour le Camp Scout 2025**

🚂 **Hébergé gratuitement sur Railway** - Déploiement automatique via GitHub
