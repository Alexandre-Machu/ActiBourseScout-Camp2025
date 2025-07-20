// Configuration de l'application
const CONFIG = {
    INITIAL_POINTS: 500,
    TEAMS_COUNT: 5,
    TEST_UPDATE_INTERVAL: 10000, // 10 secondes pour le test
    GAME_MIN_INTERVAL: 300000,   // 5 minutes minimum en mode jeu
    GAME_MAX_INTERVAL: 5400000,  // 1h30 maximum en mode jeu
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

// État global simplifié et robuste
let gameState = {
    isRunning: false,
    startTime: null,
    stocks: {},
    teams: {},
    history: [],
    updateInterval: null,
    timerInterval: null,
    isTestMode: true,
    totalInvestments: {}
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation de ActiBourseScout');
    
    // Nettoyer le localStorage au démarrage pour éviter les conflits
    localStorage.removeItem('actiBourseScout');
    
    // Initialiser le jeu
    initializeGame();
    setupEventListeners();
    updateDisplay();
    
    console.log('✅ Application prête à utiliser!');
});

// ============================================================================
// INITIALISATION DU JEU
// ============================================================================

function initializeGame() {
    console.log('🔧 Initialisation du jeu...');
    
    // Reset de l'état
    gameState.stocks = {};
    gameState.teams = {};
    gameState.totalInvestments = {};
    gameState.history = [];
    gameState.isRunning = false;
    gameState.startTime = null;
    
    // Nettoyer les intervals existants
    if (gameState.updateInterval) {
        clearInterval(gameState.updateInterval);
        clearTimeout(gameState.updateInterval);
        gameState.updateInterval = null;
    }
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Initialiser les actions
    CONFIG.STOCKS.forEach(stock => {
        gameState.stocks[stock.id] = {
            id: stock.id,
            name: stock.name,
            initialPrice: stock.initialPrice,
            price: stock.initialPrice,
            previousPrice: stock.initialPrice,
            change: 0,
            changePercent: 0
        };
        gameState.totalInvestments[stock.id] = 0;
    });

    // Initialiser les équipes
    for (let i = 1; i <= CONFIG.TEAMS_COUNT; i++) {
        const teamId = `equipe${i}`;
        gameState.teams[teamId] = {
            id: teamId,
            name: `Équipe ${i}`,
            points: CONFIG.INITIAL_POINTS,
            portfolio: {}
        };
        
        // Initialiser le portfolio de chaque équipe
        CONFIG.STOCKS.forEach(stock => {
            gameState.teams[teamId].portfolio[stock.id] = 0;
        });
    }
    
    console.log('✅ Jeu initialisé avec succès');
    console.log(`📊 ${CONFIG.STOCKS.length} actions créées`);
    console.log(`👥 ${CONFIG.TEAMS_COUNT} équipes créées`);
}

// ============================================================================
// GESTION DES ÉVÉNEMENTS
// ============================================================================

function setupEventListeners() {
    // Boutons principaux
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    
    // Boutons de test
    document.getElementById('testUpdateBtn').addEventListener('click', function() {
        console.log('🧪 Test manuel de mise à jour');
        updateStockPrices();
    });
    
    document.getElementById('forceUpdateBtn').addEventListener('click', function() {
        console.log('⚡ Mise à jour forcée avec variations importantes');
        forceStockUpdate();
    });
    
    // Transactions
    document.getElementById('executeBtn').addEventListener('click', executeTransaction);
    
    // Contrôle de vitesse
    document.getElementById('speedSlider').addEventListener('input', function() {
        const slider = document.getElementById('speedSlider');
        gameState.isTestMode = slider.value === '1';
        updateSpeedDisplay();
        
        // Si le jeu est en cours, redémarrer avec le nouveau mode
        if (gameState.isRunning) {
            console.log('🔄 Changement de mode détecté - redémarrage...');
            restartWithNewMode();
        }
    });
    
    // Initialiser l'affichage du mode
    updateSpeedDisplay();
}

function updateSpeedDisplay() {
    const display = document.getElementById('speedDisplay');
    const slider = document.getElementById('speedSlider');
    
    gameState.isTestMode = slider.value === '1';
    
    if (gameState.isTestMode) {
        display.textContent = 'Mode Test - Variations toutes les 10 secondes';
        display.className = 'speed-display test-mode';
    } else {
        display.textContent = 'Mode Jeu - Variations aléatoires (5min à 1h30)';
        display.className = 'speed-display game-mode';
    }
}

// ============================================================================
// CONTRÔLES DU JEU
// ============================================================================

function startGame() {
    console.log('🚀 Démarrage du jeu');
    
    // Nettoyer tous les intervals existants
    stopAllIntervals();
    
    // Lire le mode depuis le slider
    const slider = document.getElementById('speedSlider');
    gameState.isTestMode = slider.value === '1';
    
    console.log(`📊 Mode sélectionné: ${gameState.isTestMode ? 'TEST' : 'JEU'}`);
    
    // Mettre à jour l'état
    gameState.isRunning = true;
    gameState.startTime = Date.now();
    
    // Mettre à jour l'interface
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('status').textContent = 'En cours';
    
    // Démarrer les mises à jour automatiques
    startPriceUpdates();
    
    // Démarrer le timer d'affichage
    gameState.timerInterval = setInterval(updateTimer, 1000);
    
    // Ajouter à l'historique
    const modeText = gameState.isTestMode ? 'test' : 'jeu';
    addToHistory(`🚀 Activité démarrée en mode ${modeText}`, 'system');
    
    console.log('✅ Jeu démarré avec succès');
}

function pauseGame() {
    console.log('⏸️ Pause du jeu');
    
    gameState.isRunning = false;
    
    // Arrêter tous les intervals
    stopAllIntervals();
    
    // Mettre à jour l'interface
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('status').textContent = 'En pause';
    
    addToHistory('⏸️ Activité mise en pause', 'system');
    console.log('✅ Jeu mis en pause');
}

function resetGame() {
    console.log('🔄 Reset du jeu');
    
    // Arrêter le jeu si nécessaire
    if (gameState.isRunning) {
        pauseGame();
    }
    
    // Réinitialiser complètement
    initializeGame();
    updateDisplay();
    
    // Remettre l'interface à zéro
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('status').textContent = 'Arrêté';
    document.getElementById('timer').textContent = '00:00:00';
    
    addToHistory('🔄 Jeu réinitialisé', 'system');
    console.log('✅ Jeu réinitialisé');
}

function restartWithNewMode() {
    // Sauvegarder l'état actuel
    const wasRunning = gameState.isRunning;
    
    if (wasRunning) {
        // Arrêter les intervals sans changer l'état
        stopAllIntervals();
        
        // Redémarrer avec le nouveau mode
        startPriceUpdates();
        
        const modeText = gameState.isTestMode ? 'test' : 'jeu';
        addToHistory(`🔧 Mode changé vers ${modeText}`, 'system');
    }
}

// ============================================================================
// SYSTÈME DE MISE À JOUR DES PRIX
// ============================================================================

function startPriceUpdates() {
    // S'assurer qu'aucun interval n'est déjà en cours
    if (gameState.updateInterval) {
        clearInterval(gameState.updateInterval);
        clearTimeout(gameState.updateInterval);
        gameState.updateInterval = null;
    }
    
    if (gameState.isTestMode) {
        console.log('⚡ Démarrage des mises à jour en mode test');
        
        // Mode test: interval régulier
        gameState.updateInterval = setInterval(() => {
            if (gameState.isRunning) {
                console.log('🔄 Mise à jour automatique (mode test)');
                updateStockPrices();
            }
        }, CONFIG.TEST_UPDATE_INTERVAL);
        
        console.log(`📝 Interval créé: mises à jour toutes les ${CONFIG.TEST_UPDATE_INTERVAL/1000} secondes`);
        
    } else {
        console.log('🎲 Démarrage des mises à jour en mode jeu');
        scheduleNextRandomUpdate();
    }
}

function scheduleNextRandomUpdate() {
    // Calculer un délai aléatoire
    const randomDelay = CONFIG.GAME_MIN_INTERVAL + 
        Math.random() * (CONFIG.GAME_MAX_INTERVAL - CONFIG.GAME_MIN_INTERVAL);
    
    console.log(`⏰ Prochaine mise à jour dans ${Math.round(randomDelay/1000)} secondes`);
    
    gameState.updateInterval = setTimeout(() => {
        if (gameState.isRunning && !gameState.isTestMode) {
            console.log('🎲 Mise à jour programmée déclenchée');
            updateStockPrices();
            scheduleNextRandomUpdate(); // Programmer la suivante
        }
    }, randomDelay);
    
    // Ajouter info dans l'historique
    const nextTime = new Date(Date.now() + randomDelay);
    addToHistory(`⏰ Prochaine variation à ${nextTime.toLocaleTimeString('fr-FR')}`, 'system');
}

function stopAllIntervals() {
    if (gameState.updateInterval) {
        clearInterval(gameState.updateInterval);
        clearTimeout(gameState.updateInterval);
        gameState.updateInterval = null;
        console.log('🧹 Intervals de mise à jour arrêtés');
    }
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
        console.log('🧹 Timer d\'affichage arrêté');
    }
}

// ============================================================================
// MISE À JOUR DES PRIX
// ============================================================================

function updateStockPrices() {
    console.log('📈 Mise à jour des cours en cours...');
    
    let changesCount = 0;
    
    Object.keys(gameState.stocks).forEach(stockId => {
        const stock = gameState.stocks[stockId];
        const oldPrice = stock.price;
        
        // Sauvegarder l'ancien prix
        stock.previousPrice = oldPrice;
        
        // Calculer la nouvelle variation
        const newPrice = calculateNewPrice(stock, stockId);
        
        // Appliquer le nouveau prix
        stock.price = Math.round(newPrice * 100) / 100;
        stock.change = stock.price - stock.previousPrice;
        stock.changePercent = (stock.change / stock.previousPrice) * 100;
        
        if (Math.abs(stock.change) > 0.01) {
            changesCount++;
        }
        
        console.log(`  ${stock.name}: ${oldPrice.toFixed(2)} → ${stock.price.toFixed(2)} (${stock.changePercent.toFixed(1)}%)`);
    });
    
    // Mettre à jour l'affichage
    updateDisplay();
    
    // Ajouter à l'historique
    const modeText = gameState.isTestMode ? 'test' : 'jeu';
    addToHistory(`📊 ${changesCount} cours mis à jour (mode ${modeText})`, 'system');
    
    console.log(`✅ Mise à jour terminée: ${changesCount} prix modifiés`);
}

function calculateNewPrice(stock, stockId) {
    const initialPrice = stock.initialPrice;
    const currentPrice = stock.price;
    
    // Facteur de retour à la moyenne
    const deviation = (currentPrice - initialPrice) / initialPrice;
    let meanReversion = 0;
    if (Math.abs(deviation) > 0.2) {
        meanReversion = -deviation * 0.3;
    }
    
    // Influence des investissements
    const totalInvested = gameState.totalInvestments[stockId] || 0;
    const investmentInfluence = Math.min(totalInvested / 100, 0.1);
    
    // Variation aléatoire de base
    const randomVariation = (Math.random() - 0.5) * 0.3; // -15% à +15%
    
    // Variation finale
    const totalVariation = randomVariation + meanReversion - investmentInfluence;
    
    // Calculer le nouveau prix avec limites
    let newPrice = currentPrice * (1 + totalVariation);
    
    // Limites absolues
    const minPrice = initialPrice * 0.1;  // Minimum 10% du prix initial
    const maxPrice = initialPrice * 5.0;  // Maximum 500% du prix initial
    
    return Math.max(minPrice, Math.min(maxPrice, newPrice));
}

function forceStockUpdate() {
    console.log('⚡ Mise à jour forcée avec grandes variations');
    
    Object.keys(gameState.stocks).forEach(stockId => {
        const stock = gameState.stocks[stockId];
        stock.previousPrice = stock.price;
        
        // Variation plus importante pour les tests
        const variation = (Math.random() - 0.5) * 0.6; // -30% à +30%
        let newPrice = stock.price * (1 + variation);
        
        // Limites
        const minPrice = stock.initialPrice * 0.2;
        const maxPrice = stock.initialPrice * 4.0;
        
        stock.price = Math.max(minPrice, Math.min(maxPrice, newPrice));
        stock.price = Math.round(stock.price * 100) / 100;
        stock.change = stock.price - stock.previousPrice;
        stock.changePercent = (stock.change / stock.previousPrice) * 100;
    });
    
    updateDisplay();
    addToHistory('⚡ Mise à jour forcée appliquée', 'system');
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

function executeTransaction() {
    const teamId = document.getElementById('teamSelect').value;
    const stockId = document.getElementById('stockSelect').value;
    const action = document.getElementById('actionSelect').value;
    const quantity = parseInt(document.getElementById('quantityInput').value);
    
    // Validation des données
    if (!teamId || !stockId || !quantity || quantity <= 0) {
        alert('Veuillez remplir tous les champs avec des valeurs valides.');
        return;
    }
    
    const team = gameState.teams[teamId];
    const stock = gameState.stocks[stockId];
    const totalCost = stock.price * quantity;
    
    if (action === 'buy') {
        // Vérifier si l'équipe a assez de points
        if (team.points < totalCost) {
            alert(`❌ Pas assez de points!\nCoût: ${totalCost.toFixed(2)} points\nDisponible: ${team.points.toFixed(2)} points`);
            return;
        }
        
        // Effectuer l'achat
        team.points -= totalCost;
        team.portfolio[stockId] = (team.portfolio[stockId] || 0) + quantity;
        gameState.totalInvestments[stockId] += quantity;
        
        addToHistory(`🛒 ${team.name} achète ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`, 'buy');
        console.log(`✅ Achat effectué: ${team.name} - ${quantity} ${stock.name}`);
        
    } else { // sell
        // Vérifier si l'équipe a assez d'actions
        const owned = team.portfolio[stockId] || 0;
        if (owned < quantity) {
            alert(`❌ Pas assez d'actions!\nDemandé: ${quantity}\nDisponible: ${owned}`);
            return;
        }
        
        // Effectuer la vente
        team.points += totalCost;
        team.portfolio[stockId] -= quantity;
        gameState.totalInvestments[stockId] = Math.max(0, gameState.totalInvestments[stockId] - quantity);
        
        addToHistory(`💰 ${team.name} vend ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`, 'sell');
        console.log(`✅ Vente effectuée: ${team.name} - ${quantity} ${stock.name}`);
    }
    
    // Nettoyer le formulaire
    document.getElementById('quantityInput').value = '';
    
    // Mettre à jour l'affichage
    updateDisplay();
}

// ============================================================================
// CALCULS ET UTILITAIRES
// ============================================================================

function calculateTeamValue(team) {
    let totalValue = team.points;
    
    Object.keys(team.portfolio).forEach(stockId => {
        const quantity = team.portfolio[stockId] || 0;
        const stockPrice = gameState.stocks[stockId].price;
        totalValue += quantity * stockPrice;
    });
    
    return totalValue;
}

function updateTimer() {
    if (!gameState.startTime) return;
    
    const elapsed = Date.now() - gameState.startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer').textContent = timeString;
}

function addToHistory(message, type) {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    gameState.history.unshift({
        time: timestamp,
        message: message,
        type: type
    });
    
    // Limiter l'historique à 50 entrées
    if (gameState.history.length > 50) {
        gameState.history = gameState.history.slice(0, 50);
    }
}

// ============================================================================
// AFFICHAGE ET INTERFACE
// ============================================================================

function updateDisplay() {
    updateStocksDisplay();
    updateTeamsDisplay();
    updateSelects();
    updateHistoryDisplay();
    updateLeaderboard();
}

function updateStocksDisplay() {
    const stocksGrid = document.getElementById('stocksGrid');
    if (!stocksGrid) return;
    
    stocksGrid.innerHTML = '';
    
    Object.values(gameState.stocks).forEach(stock => {
        const stockCard = document.createElement('div');
        stockCard.className = 'stock-card';
        
        const changeClass = stock.change > 0 ? 'positive' : stock.change < 0 ? 'negative' : '';
        const changeSymbol = stock.change > 0 ? '+' : '';
        
        stockCard.innerHTML = `
            <div class="stock-name">${stock.name}</div>
            <div class="stock-price">${stock.price.toFixed(2)} pts</div>
            <div class="stock-change ${changeClass}">
                ${changeSymbol}${stock.change.toFixed(2)} (${changeSymbol}${stock.changePercent.toFixed(1)}%)
            </div>
        `;
        
        stocksGrid.appendChild(stockCard);
        
        // Animation pour les changements
        if (Math.abs(stock.change) > 0.01) {
            stockCard.classList.add('updating');
            setTimeout(() => stockCard.classList.remove('updating'), 1000);
        }
    });
}

function updateTeamsDisplay() {
    const teamsGrid = document.getElementById('teamsGrid');
    if (!teamsGrid) return;
    
    teamsGrid.innerHTML = '';
    
    Object.values(gameState.teams).forEach(team => {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        
        const totalValue = calculateTeamValue(team);
        const tokens = Math.floor(totalValue / 50);
        
        // Générer le HTML du portfolio
        let portfolioHTML = '';
        Object.keys(team.portfolio).forEach(stockId => {
            const quantity = team.portfolio[stockId] || 0;
            if (quantity > 0) {
                const stock = gameState.stocks[stockId];
                const value = quantity * stock.price;
                portfolioHTML += `
                    <div class="portfolio-item">
                        <span class="portfolio-stock">${stock.name}</span>
                        <span class="portfolio-quantity">${quantity}</span>
                        <span class="portfolio-value">${value.toFixed(2)} pts</span>
                    </div>
                `;
            }
        });
        
        if (!portfolioHTML) {
            portfolioHTML = '<div class="portfolio-item">Aucune action</div>';
        }
        
        teamCard.innerHTML = `
            <div class="team-name">${team.name}</div>
            <div class="team-points">💰 ${team.points.toFixed(2)} points</div>
            <div class="team-total">📊 Valeur totale: <strong>${totalValue.toFixed(2)} points</strong></div>
            <div class="team-tokens">🎫 Jetons: <strong>${tokens} jetons</strong></div>
            <div class="team-portfolio">
                <strong>Portefeuille:</strong>
                ${portfolioHTML}
            </div>
        `;
        
        teamsGrid.appendChild(teamCard);
    });
}

function updateSelects() {
    // Sélecteur d'équipe
    const teamSelect = document.getElementById('teamSelect');
    if (teamSelect) {
        const currentTeam = teamSelect.value;
        teamSelect.innerHTML = '<option value="">Sélectionner une équipe</option>';
        
        Object.values(gameState.teams).forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            if (team.id === currentTeam) option.selected = true;
            teamSelect.appendChild(option);
        });
    }
    
    // Sélecteur d'action
    const stockSelect = document.getElementById('stockSelect');
    if (stockSelect) {
        const currentStock = stockSelect.value;
        stockSelect.innerHTML = '<option value="">Sélectionner une action</option>';
        
        Object.values(gameState.stocks).forEach(stock => {
            const option = document.createElement('option');
            option.value = stock.id;
            option.textContent = `${stock.name} (${stock.price.toFixed(2)} pts)`;
            if (stock.id === currentStock) option.selected = true;
            stockSelect.appendChild(option);
        });
    }
}

function updateHistoryDisplay() {
    const historyContainer = document.getElementById('history');
    if (!historyContainer) return;
    
    historyContainer.innerHTML = '';
    
    if (gameState.history.length === 0) {
        historyContainer.innerHTML = '<div class="history-item">Aucune transaction pour le moment</div>';
        return;
    }
    
    gameState.history.forEach(entry => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${entry.type}-transaction`;
        
        historyItem.innerHTML = `
            <div class="history-time">${entry.time}</div>
            <div class="history-details">${entry.message}</div>
        `;
        
        historyContainer.appendChild(historyItem);
    });
}

function updateLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboardBody');
    if (!leaderboardBody) return;
    
    leaderboardBody.innerHTML = '';
    
    // Créer le tableau des équipes avec leurs valeurs
    const teamsArray = Object.values(gameState.teams).map(team => ({
        ...team,
        totalValue: calculateTeamValue(team),
        tokens: Math.floor(calculateTeamValue(team) / 50)
    }));
    
    // Trier par valeur décroissante
    teamsArray.sort((a, b) => b.totalValue - a.totalValue);
    
    // Générer les lignes
    teamsArray.forEach((team, index) => {
        const row = document.createElement('tr');
        const position = index + 1;
        
        let positionDisplay = position;
        let positionClass = '';
        
        if (position === 1) {
            positionDisplay = '🥇';
            positionClass = 'position-1';
        } else if (position === 2) {
            positionDisplay = '🥈';
            positionClass = 'position-2';
        } else if (position === 3) {
            positionDisplay = '🥉';
            positionClass = 'position-3';
        }
        
        row.innerHTML = `
            <td class="position-medal ${positionClass}">${positionDisplay}</td>
            <td class="team-name-cell">${team.name}</td>
            <td class="total-value-cell">${team.totalValue.toFixed(2)} pts</td>
            <td class="tokens-cell">${team.tokens} 🎫</td>
        `;
        
        leaderboardBody.appendChild(row);
    });
}

// ============================================================================
// SAUVEGARDE ET FONCTIONS DEBUG
// ============================================================================

function saveGameState() {
    const dataToSave = {
        teams: gameState.teams,
        stocks: gameState.stocks,
        history: gameState.history,
        totalInvestments: gameState.totalInvestments,
        timestamp: Date.now()
    };
    
    try {
        localStorage.setItem('actiBourseScout', JSON.stringify(dataToSave));
        console.log('💾 État sauvegardé automatiquement');
    } catch (error) {
        console.error('❌ Erreur de sauvegarde:', error);
    }
}

// Sauvegarde automatique toutes les 30 secondes
setInterval(saveGameState, 30000);

// Fonctions debug accessibles globalement
window.debugGameState = function() {
    console.log('🔍 DIAGNOSTIC ACTIBOURSE:');
    console.log('═══════════════════════════════════');
    console.log('📊 État général:');
    console.log('- Jeu en cours:', gameState.isRunning);
    console.log('- Mode test:', gameState.isTestMode);
    console.log('- Interval actif:', !!gameState.updateInterval);
    console.log('- Timer actif:', !!gameState.timerInterval);
    
    if (gameState.startTime) {
        const elapsed = Math.round((Date.now() - gameState.startTime) / 1000);
        console.log('- Temps écoulé:', elapsed, 'secondes');
    }
    
    console.log('📈 Actions:', Object.keys(gameState.stocks).length);
    console.log('👥 Équipes:', Object.keys(gameState.teams).length);
    console.log('📝 Historique:', gameState.history.length, 'entrées');
    console.log('═══════════════════════════════════');
};

window.forceUpdate = function() {
    console.log('🧪 Mise à jour forcée manuelle');
    updateStockPrices();
};

window.resetApp = function() {
    console.log('🔄 Reset complet de l\'application');
    resetGame();
};

// Fonction de nettoyage d'urgence
window.emergencyStop = function() {
    console.log('🚨 ARRÊT D\'URGENCE');
    gameState.isRunning = false;
    stopAllIntervals();
    console.log('✅ Tous les intervals arrêtés');
};

console.log('🚀 ActiBourseScout chargé - Version refonte complète');
console.log('📖 Commandes debug disponibles: debugGameState(), forceUpdate(), resetApp(), emergencyStop()');
