# 🏕️ ActiBourseScout

Simulation de bourse interactive pour activité scout - Camp 2025. Le projet propose **deux interfaces** : une application web standalone et une application Streamlit.

## 🌟 Deux Versions Disponibles

### � **Version Web (Recommandée)**
Interface HTML/CSS/JavaScript standalone, plus moderne et responsive.
- **Fichiers** : `index.html`, `script.js`, `style.css`
- **Avantages** : Aucune installation, fonctionne hors ligne, interface moderne
- **Lancement** : Ouvrir `index.html` dans un navigateur

### 🐍 **Version Streamlit** 
Application Python avec interface Streamlit.
- **Fichiers** : `app.py`, `requirements.txt`
- **Avantages** : Graphiques interactifs, backend Python robuste
- **Lancement** : `streamlit run app.py`

## 🚀 Installation et Lancement

### Version Web (Simple)
```bash
# Aucune installation requise !
# Ouvrir directement index.html dans votre navigateur
```

### Version Streamlit (Python)
```bash
# Prérequis : Python 3.8+
pip install -r requirements.txt
streamlit run app.py
# Accessible sur http://localhost:8501
```

## 🎮 Fonctionnalités

### 📊 **Simulation de Marché**
- **8 actions** : Mont Blanc 🏔️, Monster 👹, Benco 🍫, Opinel 🔪, Quechua 🏕️, Red Bull 🐂, Patagonia 🧗, Salomon 🥾
- Prix initial : **50 points** chacune
- Cours fluctuant automatiquement selon le mode choisi
- Variations de -20% à +20% par mise à jour

### 👥 **Gestion d'Équipes**
- **5 équipes** avec **500 points** de départ chacune
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

### 📚 **Guide Intégré**
- Dictionnaire complet des termes financiers
- Conseils stratégiques pour les équipes
- Exemples concrets de transactions
- Interface pédagogique adaptée aux scouts

## 🎯 Utilisation lors de l'Activité

### Préparation
1. **Choisir la version** : Web (recommandée) ou Streamlit
2. **Mode Test** : Vérifier le fonctionnement avec des variations rapides
3. **Formation** : Expliquer les règles aux équipes avec le guide intégré

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

### Version Web
Modifiez les paramètres dans `script.js` :
```javascript
const CONFIG = {
    INITIAL_POINTS: 500,        // Points de départ par équipe
    TEAMS_COUNT: 5,             // Nombre d'équipes
    TEST_UPDATE_INTERVAL: 10000, // Mode test (ms)
    GAME_MIN_INTERVAL: 300000,  // Mode jeu min (ms)
    GAME_MAX_INTERVAL: 5400000, // Mode jeu max (ms)
    STOCKS: [
        { id: 'action', name: '🆕 Nouvelle Action', initialPrice: 50 }
        // Ajoutez vos propres actions
    ]
};
```

### Version Streamlit
Modifiez les paramètres dans `app.py` :
```python
CONFIG = {
    'INITIAL_POINTS': 500,          # Points de départ
    'TEAMS_COUNT': 5,               # Nombre d'équipes
    'TEST_UPDATE_INTERVAL': 10,     # Mode test (secondes)
    'GAME_MIN_INTERVAL': 300,       # Mode jeu min (secondes)
    'GAME_MAX_INTERVAL': 5400,      # Mode jeu max (secondes)
}
```

## 🌐 Déploiement et Hébergement

### Version Web (Simple)
- **Local** : Ouvrir `index.html` directement
- **GitHub Pages** : Push sur GitHub et activer Pages
- **Netlify** : Glisser-déposer le dossier sur netlify.com
- **Aucune configuration serveur** requise !

### Version Streamlit
- **Streamlit Cloud** : Connexion GitHub gratuite
- **Heroku** : Déploiement avec Procfile
- **Railway** : Alternative moderne
- **Render** : Option gratuite avec auto-déploiement

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

## 🛠️ Fonctionnalités Techniques

### Version Web
- **Sauvegarde locale** : Données conservées dans le localStorage
- **Mise à jour temps réel** : Interface réactive en JavaScript
- **Responsive design** : CSS Grid et Flexbox
- **Aucune dépendance** : Fonctionne hors ligne

### Version Streamlit
- **Sauvegarde session** : Données conservées dans la session Streamlit
- **Graphiques interactifs** : Visualisation avec Plotly
- **Mise à jour automatique** : Interface réactive Streamlit
- **Backend Python** : Logique métier robuste

## 📈 Améliorations Possibles

- 📰 **Événements spéciaux** : Nouvelles impactant les cours
- 💎 **Système de dividendes** : Revenus passifs pour les actionnaires
- 📊 **Historique graphique** : Courbes d'évolution des cours
- 📄 **Export PDF** : Rapports de fin d'activité
- 🌐 **Mode multijoueur** : Connexion réseau entre équipes
- 🎲 **Actions bonus** : Actions spéciales avec mécaniques uniques

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
- Guide intégré pour les animateurs
- Contrôles simples et intuitifs
- Modes test et jeu adaptés

### ⚡ **Flexibilité**
- Deux versions au choix selon les contraintes
- Personnalisation facile des paramètres
- Fonctionne sur tous les appareils

---

**Développé avec ❤️ pour le Camp Scout 2025**
