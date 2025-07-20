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

// Variables globales pour la connexion serveur
let socket = null;
let isConnected = false;

// État global du jeu
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
    console.log('🚀 Initialisation ActiBourseScout avec synchronisation');
    
    // Essayer de se connecter au serveur
    if (typeof io !== 'undefined') {
        try {
            socket = io();
            setupSocketListeners();
            console.log('🌐 Tentative de connexion au serveur...');
        } catch (error) {
            console.log('📱 Mode local - pas de serveur disponible');
        }
    } else {
        console.log('📱 Mode local - Socket.io non disponible');
    }
    
    initializeGame();
    setupEventListeners();
    updateDisplay();
    updateConnectionStatus();
    
    console.log('✅ Application prête !');
});

// Configuration des listeners Socket.IO
function setupSocketListeners() {
    if (!socket) return;
    
    socket.on('connect', () => {
        console.log('✅ Connecté au serveur');
        isConnected = true;
        updateConnectionStatus();
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Déconnecté du serveur');
        isConnected = false;
        updateConnectionStatus();
    });
    
    socket.on('gameState', (data) => {
        console.log('📥 Réception état du serveur');
        gameState.stocks = data.stocks || gameState.stocks;
        gameState.teams = data.teams || gameState.teams;
        gameState.history = data.history || gameState.history;
        gameState.totalInvestments = data.totalInvestments || gameState.totalInvestments;
        gameState.isRunning = data.isRunning || false;
        updateDisplay();
    });
    
    socket.on('stockUpdate', (data) => {
        console.log('📈 Réception mise à jour des prix du serveur');
        gameState.stocks = data.stocks || gameState.stocks;
        gameState.history.unshift({
            time: new Date().toLocaleTimeString('fr-FR'),
            message: '📊 Cours mis à jour (serveur)',
            type: 'system'
        });
        updateDisplay();
    });
    
    socket.on('gameStarted', () => {
        console.log('🚀 Jeu démarré par le serveur');
        gameState.isRunning = true;
        gameState.startTime = Date.now();
        
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('status').textContent = 'En cours';
        
        if (!gameState.timerInterval) {
            gameState.timerInterval = setInterval(updateTimer, 1000);
        }
    });
    
    socket.on('gamePaused', () => {
        console.log('⏸️ Jeu mis en pause par le serveur');
        gameState.isRunning = false;
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('status').textContent = 'En pause';
    });
}

// Mise à jour du statut de connexion
function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        if (isConnected) {
            statusElement.textContent = '🟢 En ligne';
            statusElement.className = 'connection-status online';
        } else {
            statusElement.textContent = '🔴 Hors ligne';
            statusElement.className = 'connection-status offline';
        }
    }
}

// Initialisation du jeu
function initializeGame() {
    console.log('🔧 Initialisation du jeu...');
    
    // Reset de l'état
    gameState.stocks = {};
    gameState.teams = {};
    gameState.totalInvestments = {};
    gameState.history = [];
    gameState.isRunning = false;
    gameState.startTime = null;
    
    // Nettoyer les intervals
    clearAllIntervals();
    
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
        
        CONFIG.STOCKS.forEach(stock => {
            gameState.teams[teamId].portfolio[stock.id] = 0;
        });
    }
    
    console.log('✅ Jeu initialisé');
}

// Nettoyage des intervals
function clearAllIntervals() {
    if (gameState.updateInterval) {
        clearInterval(gameState.updateInterval);
        clearTimeout(gameState.updateInterval);
        gameState.updateInterval = null;
    }
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

// Configuration des événements
function setupEventListeners() {
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    
    document.getElementById('testUpdateBtn').addEventListener('click', function() {
        console.log('🧪 Test manuel');
        if (isConnected && socket) {
            socket.emit('manualUpdate');
        } else {
            updateStockPrices();
        }
    });
    
    document.getElementById('forceUpdateBtn').addEventListener('click', function() {
        console.log('⚡ Mise à jour forcée');
        if (isConnected && socket) {
            socket.emit('forceUpdate');
        } else {
            forceStockUpdate();
        }
    });
    
    document.getElementById('executeBtn').addEventListener('click', executeTransaction);
    document.getElementById('speedSlider').addEventListener('input', updateSpeedMode);
    
    updateSpeedMode();
}

// Démarrage du jeu
function startGame() {
    console.log('🚀 Démarrage du jeu');
    
    if (isConnected && socket) {
        // Mode serveur
        const slider = document.getElementById('speedSlider');
        const isTestMode = slider.value === '1';
        socket.emit('startGame', { isTestMode });
    } else {
        // Mode local
        startGameLocal();
    }
}

function startGameLocal() {
    clearAllIntervals();
    
    const slider = document.getElementById('speedSlider');
    gameState.isTestMode = slider.value === '1';
    gameState.isRunning = true;
    gameState.startTime = Date.now();
    
    console.log(`📊 Mode local: ${gameState.isTestMode ? 'TEST' : 'JEU'}`);
    
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('status').textContent = 'En cours';
    
    if (gameState.isTestMode) {
        startTestMode();
    } else {
        startGameMode();
    }
    
    gameState.timerInterval = setInterval(updateTimer, 1000);
    addToHistory('🚀 Activité démarrée (local)', 'system');
}

function startTestMode() {
    gameState.updateInterval = setInterval(function() {
        if (gameState.isRunning) {
            console.log('🔄 Mise à jour automatique (mode test)');
            updateStockPrices();
        }
    }, CONFIG.TEST_UPDATE_INTERVAL);
    
    console.log('⚡ Mode test activé - mises à jour toutes les 10 secondes');
}

function startGameMode() {
    const delay = CONFIG.GAME_MIN_INTERVAL + 
        Math.random() * (CONFIG.GAME_MAX_INTERVAL - CONFIG.GAME_MIN_INTERVAL);
    
    gameState.updateInterval = setTimeout(function() {
        if (gameState.isRunning && !gameState.isTestMode) {
            console.log('🎲 Mise à jour programmée');
            updateStockPrices();
            startGameMode(); // Reprogrammer la suivante
        }
    }, delay);
    
    console.log(`🎲 Prochaine mise à jour dans ${Math.round(delay/1000)} secondes`);
}

// Pause du jeu
function pauseGame() {
    console.log('⏸️ Pause du jeu');
    
    if (isConnected && socket) {
        socket.emit('pauseGame');
    } else {
        pauseGameLocal();
    }
}

function pauseGameLocal() {
    gameState.isRunning = false;
    clearAllIntervals();
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('status').textContent = 'En pause';
    
    addToHistory('⏸️ Jeu mis en pause (local)', 'system');
}

// Reset du jeu
function resetGame() {
    console.log('🔄 Reset du jeu');
    
    if (isConnected && socket) {
        socket.emit('resetGame');
    } else {
        resetGameLocal();
    }
}

function resetGameLocal() {
    pauseGameLocal();
    initializeGame();
    updateDisplay();
    
    document.getElementById('status').textContent = 'Arrêté';
    document.getElementById('timer').textContent = '00:00:00';
    addToHistory('🔄 Jeu réinitialisé (local)', 'system');
}

// Mise à jour du mode de vitesse
function updateSpeedMode() {
    const slider = document.getElementById('speedSlider');
    const display = document.getElementById('speedDisplay');
    
    gameState.isTestMode = slider.value === '1';
    
    if (gameState.isTestMode) {
        display.textContent = 'Mode Test - Variations toutes les 10 secondes';
        display.className = 'speed-display test-mode';
    } else {
        display.textContent = 'Mode Jeu - Variations aléatoires (5min à 1h30)';
        display.className = 'speed-display game-mode';
    }
    
    // Si le jeu est en cours et en mode local, redémarrer
    if (gameState.isRunning && !isConnected) {
        console.log('🔄 Changement de mode - redémarrage local');
        clearAllIntervals();
        
        if (gameState.isTestMode) {
            startTestMode();
        } else {
            startGameMode();
        }
    }
}

// Mise à jour des prix des actions
function updateStockPrices() {
    console.log('📈 Mise à jour des cours des actions');
    
    Object.keys(gameState.stocks).forEach(stockId => {
        const stock = gameState.stocks[stockId];
        stock.previousPrice = stock.price;
        
        // Influence des investissements
        const totalInvested = gameState.totalInvestments[stockId] || 0;
        const investmentInfluence = Math.min(totalInvested / 100, 0.15);
        
        // Variation aléatoire
        const randomVariation = (Math.random() - 0.5) * 0.4; // -20% à +20%
        
        // Effet de retour à la moyenne
        const deviation = (stock.price - stock.initialPrice) / stock.initialPrice;
        const meanReversion = Math.abs(deviation) > 0.3 ? -deviation * 0.2 : 0;
        
        const finalVariation = randomVariation - investmentInfluence + meanReversion;
        
        let newPrice = stock.price * (1 + finalVariation);
        
        // Limites de prix
        const minPrice = stock.initialPrice * 0.2;
        const maxPrice = stock.initialPrice * 5;
        newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
        
        stock.price = Math.round(newPrice * 100) / 100;
        stock.change = stock.price - stock.previousPrice;
        stock.changePercent = stock.previousPrice > 0 ? (stock.change / stock.previousPrice) * 100 : 0;
        
        console.log(`  ${stock.name}: ${stock.previousPrice.toFixed(2)} → ${stock.price.toFixed(2)} (${stock.changePercent.toFixed(1)}%)`);
    });
    
    updateDisplay();
    addToHistory('📊 Cours des actions mis à jour', 'system');
}

function forceStockUpdate() {
    console.log('⚡ Mise à jour forcée des prix');
    
    Object.keys(gameState.stocks).forEach(stockId => {
        const stock = gameState.stocks[stockId];
        stock.previousPrice = stock.price;
        
        const variation = (Math.random() - 0.5) * 0.6; // -30% à +30%
        let newPrice = stock.price * (1 + variation);
        
        const minPrice = stock.initialPrice * 0.3;
        const maxPrice = stock.initialPrice * 3;
        newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
        
        stock.price = Math.round(newPrice * 100) / 100;
        stock.change = stock.price - stock.previousPrice;
        stock.changePercent = stock.previousPrice > 0 ? (stock.change / stock.previousPrice) * 100 : 0;
    });
    
    updateDisplay();
    addToHistory('⚡ Mise à jour forcée appliquée', 'system');
}

// Exécution des transactions
function executeTransaction() {
    const teamId = document.getElementById('teamSelect').value;
    const stockId = document.getElementById('stockSelect').value;
    const action = document.getElementById('actionSelect').value;
    const quantity = parseInt(document.getElementById('quantityInput').value);
    
    if (!teamId || !stockId || !quantity || quantity <= 0) {
        alert('Veuillez remplir tous les champs avec des valeurs valides.');
        return;
    }
    
    if (isConnected && socket) {
        // Envoyer la transaction au serveur
        socket.emit('transaction', { teamId, stockId, action, quantity });
    } else {
        // Traiter la transaction localement
        executeTransactionLocal(teamId, stockId, action, quantity);
    }
    
    document.getElementById('quantityInput').value = '';
}

function executeTransactionLocal(teamId, stockId, action, quantity) {
    const team = gameState.teams[teamId];
    const stock = gameState.stocks[stockId];
    const totalCost = stock.price * quantity;
    
    if (action === 'buy') {
        if (team.points < totalCost) {
            alert(`❌ Pas assez de points!\nCoût: ${totalCost.toFixed(2)} points\nDisponible: ${team.points.toFixed(2)} points`);
            return;
        }
        
        team.points -= totalCost;
        team.portfolio[stockId] = (team.portfolio[stockId] || 0) + quantity;
        gameState.totalInvestments[stockId] += quantity;
        
        addToHistory(`🛒 ${team.name} achète ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`, 'buy');
        
    } else { // sell
        const owned = team.portfolio[stockId] || 0;
        if (owned < quantity) {
            alert(`❌ Pas assez d'actions!\nDemandé: ${quantity}\nDisponible: ${owned}`);
            return;
        }
        
        team.points += totalCost;
        team.portfolio[stockId] -= quantity;
        gameState.totalInvestments[stockId] = Math.max(0, gameState.totalInvestments[stockId] - quantity);
        
        addToHistory(`💰 ${team.name} vend ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`, 'sell');
    }
    
    updateDisplay();
}

// Fonctions utilitaires
function calculateTeamValue(team) {
    let totalValue = team.points;
    
    Object.keys(team.portfolio).forEach(stockId => {
        const quantity = team.portfolio[stockId] || 0;
        const stockPrice = gameState.stocks[stockId]?.price || 0;
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
    
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = timeString;
    }
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

// Fonctions d'affichage
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
        
        // Animation pour les changements récents
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
        
        let portfolioHTML = '';
        Object.keys(team.portfolio).forEach(stockId => {
            const quantity = team.portfolio[stockId] || 0;
            if (quantity > 0 && gameState.stocks[stockId]) {
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
    
    const teamsArray = Object.values(gameState.teams).map(team => ({
        ...team,
        totalValue: calculateTeamValue(team),
        tokens: Math.floor(calculateTeamValue(team) / 50)
    }));
    
    teamsArray.sort((a, b) => b.totalValue - a.totalValue);
    
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

// Fonctions de debug globales
window.debugGameState = function() {
    console.log('🔍 DIAGNOSTIC ACTIBOURSE:');
    console.log('════════════════════════════');
    console.log('📊 État général:');
    console.log('- Jeu en cours:', gameState.isRunning);
    console.log('- Mode test:', gameState.isTestMode);
    console.log('- Connecté au serveur:', isConnected);
    console.log('- Interval actif:', !!gameState.updateInterval);
    console.log('- Timer actif:', !!gameState.timerInterval);
    
    if (gameState.startTime) {
        const elapsed = Math.round((Date.now() - gameState.startTime) / 1000);
        console.log('- Temps écoulé:', elapsed, 'secondes');
    }
    
    console.log('📈 Actions:', Object.keys(gameState.stocks).length);
    console.log('👥 Équipes:', Object.keys(gameState.teams).length);
    console.log('📝 Historique:', gameState.history.length, 'entrées');
    console.log('════════════════════════════');
};

window.forceUpdate = function() {
    console.log('🧪 Mise à jour forcée manuelle');
    if (isConnected && socket) {
        socket.emit('forceUpdate');
    } else {
        forceStockUpdate();
    }
};

window.resetApp = function() {
    console.log('🔄 Reset complet de l\'application');
    resetGame();
};

window.emergencyStop = function() {
    console.log('🚨 ARRÊT D\'URGENCE');
    gameState.isRunning = false;
    clearAllIntervals();
    
    if (isConnected && socket) {
        socket.emit('pauseGame');
    }
    
    console.log('✅ Tous les processus arrêtés');
};

// Sauvegarde automatique locale
function saveGameState() {
    try {
        const dataToSave = {
            teams: gameState.teams,
            stocks: gameState.stocks,
            history: gameState.history.slice(0, 20),
            totalInvestments: gameState.totalInvestments,
            timestamp: Date.now()
        };
        
        localStorage.setItem('actiBourseScout', JSON.stringify(dataToSave));
        console.log('💾 État sauvegardé localement');
    } catch (error) {
        console.error('❌ Erreur de sauvegarde locale:', error);
    }
}

// Sauvegarde automatique toutes les 30 secondes
setInterval(saveGameState, 30000);

console.log('🚀 ActiBourseScout chargé - Version complète avec synchronisation');
console.log('📖 Commandes debug: debugGameState(), forceUpdate(), resetApp(), emergencyStop()');