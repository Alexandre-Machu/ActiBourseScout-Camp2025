# 🏕️ ActiBourseScout

Application de simulation de bourse pour activité scout développée avec Streamlit.

## 🚀 Installation et Lancement

### Prérequis
- Python 3.8 ou plus récent
- pip (gestionnaire de packages Python)

### Installation des dépendances

```bash
pip install -r requirements.txt
```

### Lancement de l'application

```bash
streamlit run app.py
```

L'application sera accessible dans votre navigateur à l'adresse : `http://localhost:8501`

## 🎮 Fonctionnalités

### 📊 **Simulation de Marché**
- 5 actions : Mont Blanc 🏔️, Monster 👹, Benco 🍫, Opinel 🔪, Quechua 🏕️
- Cours qui fluctuent automatiquement selon le mode choisi
- Graphiques en temps réel de l'évolution des cours

### 👥 **Gestion d'Équipes**
- 5 équipes avec 100 points de départ chacune
- Calcul automatique de la valeur totale du portefeuille
- Conversion en jetons (10 points = 1 jeton)

### 🎛️ **Modes de Jeu**
- **Mode Test** : Variations toutes les 10 secondes (pour les tests)
- **Mode Jeu** : Variations aléatoires (1h à 1h30 d'intervalle)

### 💰 **Système de Transactions**
- Interface simple pour acheter/vendre des actions
- Vérification automatique des fonds et stocks disponibles
- Historique complet des transactions

### 🏆 **Classement en Temps Réel**
- Tableau de classement avec médailles
- Calcul automatique des jetons gagnés
- Mise à jour en temps réel

## 🌐 Hébergement

### Streamlit Cloud (Gratuit)
1. Créez un compte sur [Streamlit Cloud](https://streamlit.io/cloud)
2. Connectez votre repository GitHub
3. Déployez directement depuis l'interface

### Autres Options
- **Heroku** : Pour un déploiement plus avancé
- **Railway** : Alternative moderne à Heroku
- **Render** : Option gratuite avec builds automatiques

## 🎯 Utilisation lors de l'Activité

1. **Préparation** : Lancez l'application en mode Test pour vérifier le fonctionnement
2. **Début d'activité** : Basculez en mode Jeu et cliquez sur "Démarrer"
3. **Transactions** : Les enfants viennent vous voir, vous saisissez leurs demandes
4. **Suivi** : Le tableau de classement se met à jour automatiquement
5. **Fin d'activité** : Consultez le classement final pour distribuer les jetons

## 🔧 Personnalisation

### Modifier les Paramètres
Éditez les valeurs dans la section `CONFIG` du fichier `app.py` :

```python
CONFIG = {
    'INITIAL_POINTS': 100,          # Points de départ
    'TEAMS_COUNT': 5,               # Nombre d'équipes
    'TEST_UPDATE_INTERVAL': 10,     # Intervalle en mode test (secondes)
    'GAME_MIN_INTERVAL': 3600,      # Intervalle min en mode jeu (secondes)
    'GAME_MAX_INTERVAL': 5400,      # Intervalle max en mode jeu (secondes)
}
```

### Modifier les Actions
Ajoutez ou modifiez les actions dans la liste `STOCKS` :

```python
'STOCKS': [
    {'id': 'nouvelle_action', 'name': '🆕 Nouvelle Action', 'initialPrice': 100},
    # ... autres actions
]
```

## 📱 Interface Mobile

L'application est responsive et fonctionne parfaitement sur :
- 📱 Smartphones
- 📱 Tablettes  
- 💻 Ordinateurs portables
- 🖥️ Ordinateurs de bureau

## 🛠️ Fonctionnalités Techniques

- **Sauvegarde automatique** : Les données sont conservées dans la session
- **Mise à jour en temps réel** : Interface réactive avec Streamlit
- **Graphiques interactifs** : Visualisation avec Plotly
- **Interface intuitive** : Design adapté aux activités jeunesse

## 📈 Améliorations Possibles

- Ajout d'événements spéciaux (nouvelles, catastrophes)
- Système de dividendes
- Historique détaillé des cours
- Export des résultats en PDF
- Mode multijoueur en réseau

## 🎪 Parfait pour les Scouts !

Cette application a été spécialement conçue pour une activité scout, avec :
- Interface colorée et engageante
- Système de jetons pour récompenses
- Gestion simple par l'animateur
- Apprentissage ludique de concepts économiques
