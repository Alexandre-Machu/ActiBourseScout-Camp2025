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

// État global - VERSION SIMPLIFIÉE BASÉE SUR L'ANCIENNE VERSION QUI MARCHAIT
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

// Initialisation au chargement - COPIE DE CE QUI MARCHAIT
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation ActiBourseScout - Version basée sur OldVersion');
    initializeGame();
    setupEventListeners();
    updateDisplay();
    console.log('✅ Application prête !');
});

// INITIALISATION SIMPLE ET DIRECTE (basée sur OldVersion)
function initializeGame() {
    console.log('🔧 Initialisation...');
    
    // Reset propre
    gameState.stocks = {};
    gameState.teams = {};
    gameState.totalInvestments = {};
    gameState.history = [];
    gameState.isRunning = false;
    gameState.startTime = null;
    
    // Nettoyer TOUS les intervals
    clearAllIntervals();
    
    // Initialiser actions
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

    // Initialiser équipes
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
    
    console.log('✅ Initialisation terminée');
}

// NETTOYAGE COMPLET DES INTERVALS (crucial!)
function clearAllIntervals() {
    if (gameState.updateInterval) {
        clearInterval(gameState.updateInterval);
        clearTimeout(gameState.updateInterval);
        gameState.updateInterval = null;
        console.log('🧹 Interval de mise à jour nettoyé');
    }
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
        console.log('🧹 Timer nettoyé');
    }
}

function setupEventListeners() {
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    
    document.getElementById('testUpdateBtn').addEventListener('click', function() {
        console.log('🧪 Test manuel');
        updateStockPrices();
    });
    
    document.getElementById('forceUpdateBtn').addEventListener('click', forceStockUpdate);
    document.getElementById('executeBtn').addEventListener('click', executeTransaction);
    document.getElementById('speedSlider').addEventListener('input', updateSpeedMode);
    
    updateSpeedMode();
}

// DÉMARRAGE SIMPLIFIÉ - BASÉ SUR CE QUI MARCHAIT
function startGame() {
    console.log('🚀 DÉMARRAGE');
    
    // 1. NETTOYER PROPREMENT
    clearAllIntervals();
    
    // 2. CONFIGURER L'ÉTAT
    const slider = document.getElementById('speedSlider');
    gameState.isTestMode = slider.value === '1';
    gameState.isRunning = true;
    gameState.startTime = Date.now();
    
    console.log(`📊 Mode: ${gameState.isTestMode ? 'TEST' : 'JEU'}`);
    
    // 3. INTERFACE
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('status').textContent = 'En cours';
    
    // 4. DÉMARRER LES MISES À JOUR - VERSION SIMPLIFIÉE
    if (gameState.isTestMode) {
        console.log('⚡ Démarrage interval TEST');
        startTestMode();
    } else {
        console.log('🎲 Démarrage mode JEU');
        startGameMode();
    }
    
    // 5. TIMER
    gameState.timerInterval = setInterval(updateTimer, 1000);
    
    addToHistory('🚀 Activité démarrée', 'system');
    console.log('✅ DÉMARRAGE RÉUSSI');
}

// MODE TEST - VERSION ULTRA SIMPLE QUI MARCHE
function startTestMode() {
    gameState.updateInterval = setInterval(function() {
        if (gameState.isRunning) {
            console.log('🔄 UPDATE TEST MODE!');
            updateStockPrices();
        }
    }, CONFIG.TEST_UPDATE_INTERVAL);
    
    console.log('📝 Interval test créé:', gameState.updateInterval);
    console.log('📝 Délai:', CONFIG.TEST_UPDATE_INTERVAL, 'ms');
}

// MODE JEU - VERSION SIMPLE
function startGameMode() {
    const delay = CONFIG.GAME_MIN_INTERVAL + 
        Math.random() * (CONFIG.GAME_MAX_INTERVAL - CONFIG.GAME_MIN_INTERVAL);
    
    gameState.updateInterval = setTimeout(function() {
        if (gameState.isRunning) {
            console.log('🎲 UPDATE GAME MODE!');
            updateStockPrices();
            startGameMode(); // Reprogrammer
        }
    }, delay);
    
    console.log('📝 Timeout jeu créé pour', Math.round(delay/1000), 'secondes');
}

function pauseGame() {
    console.log('⏸️ PAUSE');
    gameState.isRunning = false;
    clearAllIntervals();
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('status').textContent = 'En pause';
    
    addToHistory('⏸️ Pause', 'system');
}

function resetGame() {
    console.log('🔄 RESET');
    pauseGame();
    initializeGame();
    updateDisplay();
    
    document.getElementById('status').textContent = 'Arrêté';
    document.getElementById('timer').textContent = '00:00:00';
    addToHistory('🔄 Reset', 'system');
}

function updateSpeedMode() {
    const slider = document.getElementById('speedSlider');
    const display = document.getElementById('speedDisplay');
    
    gameState.isTestMode = slider.value === '1';
    
    if (gameState.isTestMode) {
        display.textContent = 'Mode Test - Variations toutes les 10 secondes';
    } else {
        display.textContent = 'Mode Jeu - Variations aléatoires (5min à 1h30)';
    }
    
    // Si jeu en cours, redémarrer avec nouveau mode
    if (gameState.isRunning) {
        console.log('🔄 Changement de mode - redémarrage');
        clearAllIntervals();
        
        if (gameState.isTestMode) {
            startTestMode();
        } else {
            startGameMode();
        }
    }
}

// MISE À JOUR DES PRIX - VERSION SIMPLE
function updateStockPrices() {
    console.log('📈 Mise à jour des cours');
    
    Object.keys(gameState.stocks).forEach(stockId => {
        const stock = gameState.stocks[stockId];
        stock.previousPrice = stock.price;
        
        // Calcul simple et efficace
        const totalInvested = gameState.totalInvestments[stockId] || 0;
        const investmentInfluence = Math.min(totalInvested / 100, 0.15);
        const randomVariation = (Math.random() - 0.5) * 0.4; // -20% à +20%
        const finalVariation = randomVariation - investmentInfluence;
        
        let newPrice = stock.price * (1 + finalVariation);
        newPrice = Math.max(10, Math.min(stock.initialPrice * 4, newPrice));
        
        stock.price = Math.round(newPrice * 100) / 100;
        stock.change = stock.price - stock.previousPrice;
        stock.changePercent = (stock.change / stock.previousPrice) * 100;
        
        console.log(`${stock.name}: ${stock.previousPrice.toFixed(2)} → ${stock.price.toFixed(2)}`);
    });
    
    updateDisplay();
    addToHistory('📊 Cours mis à jour', 'system');
    console.log('✅ Mise à jour terminée');
}

function forceStockUpdate() {
    console.log('⚡ Mise à jour forcée');
    
    Object.keys(gameState.stocks).forEach(stockId => {
        const stock = gameState.stocks[stockId];
        stock.previousPrice = stock.price;
        
        const variation = (Math.random() - 0.5) * 0.6; // -30% à +30%
        let newPrice = stock.price * (1 + variation);
        newPrice = Math.max(20, Math.min(stock.initialPrice * 3, newPrice));
        
        stock.price = Math.round(newPrice * 100) / 100;
        stock.change = stock.price - stock.previousPrice;
        stock.changePercent = (stock.change / stock.previousPrice) * 100;
    });
    
    updateDisplay();
    addToHistory('⚡ Mise à jour forcée', 'system');
}

// TRANSACTIONS - VERSION SIMPLE
function executeTransaction() {
    const teamId = document.getElementById('teamSelect').value;
    const stockId = document.getElementById('stockSelect').value;
    const action = document.getElementById('actionSelect').value;
    const quantity = parseInt(document.getElementById('quantityInput').value);
    
    if (!teamId || !stockId || !quantity || quantity <= 0) {
        alert('Veuillez remplir tous les champs correctement.');
        return;
    }
    
    const team = gameState.teams[teamId];
    const stock = gameState.stocks[stockId];
    const totalCost = stock.price * quantity;
    
    if (action === 'buy') {
        if (team.points < totalCost) {
            alert(`Pas assez de points ! Coût: ${totalCost.toFixed(2)}, Disponible: ${team.points.toFixed(2)}`);
            return;
        }
        
        team.points -= totalCost;
        team.portfolio[stockId] += quantity;
        gameState.totalInvestments[stockId] += quantity;
        
        addToHistory(`🛒 ${team.name} achète ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`, 'buy');
    } else {
        const owned = team.portfolio[stockId] || 0;
        if (owned < quantity) {
            alert(`Pas assez d'actions ! Demandé: ${quantity}, Disponible: ${owned}`);
            return;
        }
        
        team.points += totalCost;
        team.portfolio[stockId] -= quantity;
        gameState.totalInvestments[stockId] = Math.max(0, gameState.totalInvestments[stockId] - quantity);
        
        addToHistory(`💰 ${team.name} vend ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`, 'sell');
    }
    
    document.getElementById('quantityInput').value = '';
    updateDisplay();
}

// FONCTIONS UTILITAIRES
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
    gameState.history.unshift({ time: timestamp, message, type });
    if (gameState.history.length > 50) {
        gameState.history = gameState.history.slice(0, 50);
    }
}

// AFFICHAGE - VERSIONS SIMPLIFIÉES
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
            if (quantity > 0) {
                const stock = gameState.stocks[stockId];
                const value = quantity * stock.price;
                portfolioHTML += `
                    <div class="portfolio-item">
                        <span>${stock.name}</span>
                        <span>${quantity}</span>
                        <span>${value.toFixed(2)} pts</span>
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
            <div>📊 Valeur totale: <strong>${totalValue.toFixed(2)} points</strong></div>
            <div>🎫 Jetons: <strong>${tokens} jetons</strong></div>
            <div class="team-portfolio">
                <strong>Portefeuille:</strong>
                ${portfolioHTML}
            </div>
        `;
        
        teamsGrid.appendChild(teamCard);
    });
}

function updateSelects() {
    const teamSelect = document.getElementById('teamSelect');
    const stockSelect = document.getElementById('stockSelect');
    
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
        if (position === 1) positionDisplay = '🥇';
        else if (position === 2) positionDisplay = '🥈';
        else if (position === 3) positionDisplay = '🥉';
        
        row.innerHTML = `
            <td>${positionDisplay}</td>
            <td>${team.name}</td>
            <td>${team.totalValue.toFixed(2)} pts</td>
            <td>${team.tokens} 🎫</td>
        `;
        
        leaderboardBody.appendChild(row);
    });
}

// FONCTIONS DEBUG
window.debugGameState = function() {
    console.log('🔍 DIAGNOSTIC:');
    console.log('- isRunning:', gameState.isRunning);
    console.log('- isTestMode:', gameState.isTestMode);
    console.log('- updateInterval:', gameState.updateInterval);
    console.log('- timerInterval:', gameState.timerInterval);
};

window.forceUpdate = updateStockPrices;
window.resetApp = resetGame;
window.emergencyStop = function() {
    gameState.isRunning = false;
    clearAllIntervals();
    console.log('🚨 Arrêt d\'urgence effectué');
};

console.log('🚀 ActiBourseScout - Version corrigée basée sur OldVersion');
console.log('📖 Commandes debug: debugGameState(), forceUpdate(), resetApp(), emergencyStop()');
