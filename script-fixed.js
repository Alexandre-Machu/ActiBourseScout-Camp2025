// Configuration de l'application
const CONFIG = {
    INITIAL_POINTS: 500,
    TEAMS_COUNT: 5,
    TEST_UPDATE_INTERVAL: 10000, // 10 secondes pour le mode test
    GAME_MIN_INTERVAL: 300000, // 5 minutes minimum en mode jeu
    GAME_MAX_INTERVAL: 5400000, // 1h30 maximum en mode jeu
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

// État global de l'application - VERSION SIMPLIFIÉE
let gameState = {
    isRunning: false,
    startTime: null,
    stocks: {},
    teams: {},
    history: [],
    updateInterval: null,
    timerInterval: null,
    isTestMode: true,
    nextUpdateTime: null,
    totalInvestments: {}
};

// INITIALISATION SIMPLE ET DIRECTE
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Initialisation simple...');
    initializeGame();
    setupEventListeners();
    updateDisplay();
    console.log('✅ Application prête !');
});

function initializeGame() {
    console.log('🔧 Initialisation du jeu...');
    
    // Initialiser les actions
    CONFIG.STOCKS.forEach(stock => {
        gameState.stocks[stock.id] = {
            ...stock,
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

    gameState.history = [];
    console.log('✅ Jeu initialisé');
}

function setupEventListeners() {
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    
    // Boutons de test
    document.getElementById('testUpdateBtn').addEventListener('click', function() {
        console.log('🧪 Test manuel déclenché');
        updateStockPrices();
    });
    
    document.getElementById('forceUpdateBtn').addEventListener('click', function() {
        console.log('⚡ Mise à jour forcée');
        Object.keys(gameState.stocks).forEach(stockId => {
            const stock = gameState.stocks[stockId];
            stock.previousPrice = stock.price;
            
            const variation = (Math.random() - 0.5) * 0.5; // -25% à +25%
            stock.price = Math.max(10, stock.price * (1 + variation));
            stock.price = Math.round(stock.price * 100) / 100;
            stock.change = stock.price - stock.previousPrice;
            stock.changePercent = (stock.change / stock.previousPrice) * 100;
        });
        updateDisplay();
        addToHistory('⚡ Mise à jour forcée', 'system');
    });
    
    document.getElementById('executeBtn').addEventListener('click', executeTransaction);
    document.getElementById('speedSlider').addEventListener('input', updateSpeedMode);
    
    // Initialiser le mode
    updateSpeedMode();
}

function startGame() {
    console.log('🚀 DÉMARRAGE DU JEU');
    
    // STOPPER TOUT CE QUI POURRAIT TOURNER
    if (gameState.updateInterval) {
        clearInterval(gameState.updateInterval);
        clearTimeout(gameState.updateInterval);
        gameState.updateInterval = null;
    }
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    // Lire le mode depuis le slider
    const slider = document.getElementById('speedSlider');
    gameState.isTestMode = slider.value === '1';
    
    console.log(`📊 Mode: ${gameState.isTestMode ? 'TEST' : 'JEU'}`);
    console.log(`📊 Slider value: "${slider.value}"`);
    
    // Mettre à jour l'état
    gameState.isRunning = true;
    gameState.startTime = Date.now();
    
    // Interface
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('status').textContent = 'En cours';
    
    // DÉMARRER LES MISES À JOUR
    if (gameState.isTestMode) {
        console.log('⚡ LANCEMENT INTERVAL TEST');
        gameState.updateInterval = setInterval(function() {
            console.log('🔄 INTERVAL TRIGGER!');
            updateStockPrices();
        }, CONFIG.TEST_UPDATE_INTERVAL);
        
        console.log('📝 Interval ID:', gameState.updateInterval);
        
        // Test immédiat pour vérifier
        setTimeout(() => {
            console.log('🧪 VÉRIFICATION POST-DÉMARRAGE:');
            console.log('- gameState.isRunning:', gameState.isRunning);
            console.log('- gameState.updateInterval:', gameState.updateInterval);
            console.log('- CONFIG.TEST_UPDATE_INTERVAL:', CONFIG.TEST_UPDATE_INTERVAL);
        }, 2000);
    } else {
        console.log('🎲 Mode jeu - programmation aléatoire');
        scheduleNextUpdate();
    }
    
    // Timer
    gameState.timerInterval = setInterval(updateTimer, 1000);
    
    addToHistory(`🚀 Activité démarrée`, 'system');
    console.log('✅ JEU DÉMARRÉ AVEC SUCCÈS');
}

function pauseGame() {
    console.log('⏸️ PAUSE DU JEU');
    
    gameState.isRunning = false;
    
    if (gameState.updateInterval) {
        clearInterval(gameState.updateInterval);
        clearTimeout(gameState.updateInterval);
        gameState.updateInterval = null;
    }
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('status').textContent = 'En pause';
    
    addToHistory('⏸️ Jeu mis en pause', 'system');
}

function resetGame() {
    console.log('🔄 RESET DU JEU');
    
    if (gameState.isRunning) {
        pauseGame();
    }
    
    initializeGame();
    updateDisplay();
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('status').textContent = 'Arrêté';
    document.getElementById('timer').textContent = '00:00:00';
    
    addToHistory('🔄 Jeu réinitialisé', 'system');
}

function updateStockPrices() {
    console.log('🔄 MISE À JOUR DES COURS');
    
    let hasChanges = false;
    
    Object.keys(gameState.stocks).forEach(stockId => {
        const stock = gameState.stocks[stockId];
        stock.previousPrice = stock.price;
        
        const totalInvested = gameState.totalInvestments[stockId] || 0;
        const investmentInfluence = Math.min(totalInvested / 50, 0.15);
        const baseVariation = (Math.random() - 0.5) * 0.4; // -20% à +20%
        const finalVariation = baseVariation - investmentInfluence;
        
        const newPrice = Math.max(10, stock.price * (1 + finalVariation));
        stock.price = Math.round(newPrice * 100) / 100;
        stock.change = stock.price - stock.previousPrice;
        stock.changePercent = (stock.change / stock.previousPrice) * 100;
        
        if (Math.abs(stock.change) > 0.01) {
            hasChanges = true;
        }
        
        console.log(`📈 ${stock.name}: ${stock.previousPrice.toFixed(2)} → ${stock.price.toFixed(2)} (${stock.changePercent.toFixed(1)}%)`);
    });
    
    if (hasChanges) {
        updateDisplay();
        const modeText = gameState.isTestMode ? 'test' : 'jeu';
        addToHistory(`📊 Cours mis à jour (${modeText})`, 'system');
        console.log('✅ MISE À JOUR TERMINÉE AVEC SUCCÈS');
    } else {
        console.log('ℹ️ Aucun changement significatif');
    }
}

function updateSpeedMode() {
    const slider = document.getElementById('speedSlider');
    const display = document.getElementById('speedDisplay');
    
    gameState.isTestMode = slider.value === '1';
    
    console.log(`🔧 Mode changé: ${gameState.isTestMode ? 'Test' : 'Jeu'} (slider: "${slider.value}")`);
    
    if (gameState.isTestMode) {
        display.textContent = 'Mode Test - Variations toutes les 10 secondes';
    } else {
        display.textContent = 'Mode Jeu - Variations aléatoires (5min à 1h30)';
    }
    
    // Si le jeu est en cours, redémarrer avec le nouveau mode
    if (gameState.isRunning) {
        console.log('🔄 Redémarrage pour nouveau mode...');
        
        if (gameState.updateInterval) {
            clearInterval(gameState.updateInterval);
            clearTimeout(gameState.updateInterval);
            gameState.updateInterval = null;
        }
        
        if (gameState.isTestMode) {
            gameState.updateInterval = setInterval(function() {
                console.log('🔄 INTERVAL TRIGGER (mode changé)!');
                updateStockPrices();
            }, CONFIG.TEST_UPDATE_INTERVAL);
        } else {
            scheduleNextUpdate();
        }
    }
}

function scheduleNextUpdate() {
    const randomDelay = CONFIG.GAME_MIN_INTERVAL + 
        Math.random() * (CONFIG.GAME_MAX_INTERVAL - CONFIG.GAME_MIN_INTERVAL);
    
    gameState.nextUpdateTime = Date.now() + randomDelay;
    
    console.log(`⏰ Prochaine MAJ dans ${Math.round(randomDelay/1000)} secondes`);
    
    gameState.updateInterval = setTimeout(() => {
        if (gameState.isRunning) {
            updateStockPrices();
            scheduleNextUpdate();
        }
    }, randomDelay);
    
    const nextUpdateDate = new Date(gameState.nextUpdateTime);
    addToHistory(`⏰ Prochaine variation: ${nextUpdateDate.toLocaleTimeString('fr-FR')}`, 'system');
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

// RESTE DES FONCTIONS (inchangées)
function executeTransaction() {
    const teamId = document.getElementById('teamSelect').value;
    const stockId = document.getElementById('stockSelect').value;
    const action = document.getElementById('actionSelect').value;
    const quantity = parseInt(document.getElementById('quantityInput').value);
    
    if (!teamId || !stockId || !quantity || quantity <= 0) {
        alert('Veuillez remplir tous les champs avec des valeurs valides.');
        return;
    }
    
    const team = gameState.teams[teamId];
    const stock = gameState.stocks[stockId];
    const totalCost = stock.price * quantity;
    
    if (action === 'buy') {
        if (team.points < totalCost) {
            alert(`Pas assez de points ! Coût: ${totalCost.toFixed(2)}, Points disponibles: ${team.points.toFixed(2)}`);
            return;
        }
        
        team.points -= totalCost;
        team.portfolio[stockId] += quantity;
        gameState.totalInvestments[stockId] += quantity;
        
        addToHistory(`${team.name} achète ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} points`, 'buy');
    } else {
        if (team.portfolio[stockId] < quantity) {
            alert(`Pas assez d'actions ! Actions disponibles: ${team.portfolio[stockId]}`);
            return;
        }
        
        team.points += totalCost;
        team.portfolio[stockId] -= quantity;
        gameState.totalInvestments[stockId] = Math.max(0, gameState.totalInvestments[stockId] - quantity);
        
        addToHistory(`${team.name} vend ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} points`, 'sell');
    }
    
    document.getElementById('quantityInput').value = '';
    updateDisplay();
}

function calculateTeamValue(team) {
    let totalValue = team.points;
    
    Object.keys(team.portfolio).forEach(stockId => {
        const quantity = team.portfolio[stockId];
        const stockPrice = gameState.stocks[stockId].price;
        totalValue += quantity * stockPrice;
    });
    
    return totalValue;
}

function addToHistory(message, type) {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    gameState.history.unshift({
        time: timestamp,
        message: message,
        type: type
    });
    
    if (gameState.history.length > 50) {
        gameState.history = gameState.history.slice(0, 50);
    }
}

function updateDisplay() {
    updateStocksDisplay();
    updateTeamsDisplay();
    updateSelects();
    updateHistoryDisplay();
    updateLeaderboard();
}

function updateStocksDisplay() {
    const stocksGrid = document.getElementById('stocksGrid');
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
        
        if (stock.change !== 0) {
            stockCard.classList.add('updating');
            setTimeout(() => stockCard.classList.remove('updating'), 500);
        }
    });
}

function updateTeamsDisplay() {
    const teamsGrid = document.getElementById('teamsGrid');
    teamsGrid.innerHTML = '';
    
    Object.values(gameState.teams).forEach(team => {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        
        const totalValue = calculateTeamValue(team);
        
        let portfolioHTML = '';
        Object.keys(team.portfolio).forEach(stockId => {
            const quantity = team.portfolio[stockId];
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
            <div>📊 Valeur totale: <strong>${totalValue.toFixed(2)} points</strong></div>
            <div>🎫 Jetons: <strong>${Math.floor(totalValue / 50)} jetons</strong></div>
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
    const currentTeam = teamSelect.value;
    teamSelect.innerHTML = '<option value="">Sélectionner une équipe</option>';
    
    Object.values(gameState.teams).forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.name;
        if (team.id === currentTeam) option.selected = true;
        teamSelect.appendChild(option);
    });
    
    const stockSelect = document.getElementById('stockSelect');
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

function updateHistoryDisplay() {
    const historyContainer = document.getElementById('history');
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

// FONCTIONS DE DEBUG
window.debugGameState = function() {
    console.log('🔍 DIAGNOSTIC:');
    console.log('- isRunning:', gameState.isRunning);
    console.log('- isTestMode:', gameState.isTestMode);
    console.log('- updateInterval:', gameState.updateInterval);
    console.log('- timerInterval:', gameState.timerInterval);
    
    const slider = document.getElementById('speedSlider');
    console.log('- Slider value:', slider?.value);
    
    if (gameState.isRunning && gameState.isTestMode) {
        console.log('⚡ Mode test - devrait MAJ toutes les', CONFIG.TEST_UPDATE_INTERVAL, 'ms');
    }
};

window.forceTest = function() {
    console.log('🧪 TEST FORCÉ');
    updateStockPrices();
};
