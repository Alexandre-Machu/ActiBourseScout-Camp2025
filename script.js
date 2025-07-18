// Configuration de l'application
const CONFIG = {
    INITIAL_POINTS: 500, // 500 points pour plus de flexibilité
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

// État global de l'application
let gameState = {
    isRunning: false,
    startTime: null,
    stocks: {},
    teams: {},
    history: [],
    updateInterval: null,
    timerInterval: null,
    isTestMode: true, // true = mode test, false = mode jeu
    nextUpdateTime: null,
    totalInvestments: {} // Pour tracker les investissements par action
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
    setupEventListeners();
    updateDisplay();
});

function initializeGame() {
    // Initialiser les actions
    CONFIG.STOCKS.forEach(stock => {
        gameState.stocks[stock.id] = {
            ...stock,
            price: stock.initialPrice,
            previousPrice: stock.initialPrice,
            change: 0,
            changePercent: 0
        };
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
        
        // Initialiser le portefeuille avec 0 actions de chaque type
        CONFIG.STOCKS.forEach(stock => {
            gameState.teams[teamId].portfolio[stock.id] = 0;
        });
    }

    // Initialiser le tracker d'investissements
    gameState.totalInvestments = {};
    CONFIG.STOCKS.forEach(stock => {
        gameState.totalInvestments[stock.id] = 0;
    });
}

function setupEventListeners() {
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('resetBtn').addEventListener('click', resetGame);
    document.getElementById('executeBtn').addEventListener('click', executeTransaction);
    document.getElementById('speedSlider').addEventListener('input', updateSpeedMode);
    
    // Initialiser l'affichage du mode
    updateSpeedMode();
}

function startGame() {
    gameState.isRunning = true;
    gameState.startTime = Date.now();
    
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('status').textContent = 'En cours';
    
    // Démarrer les mises à jour selon le mode
    if (gameState.isTestMode) {
        gameState.updateInterval = setInterval(updateStockPrices, CONFIG.TEST_UPDATE_INTERVAL);
    } else {
        scheduleNextUpdate();
    }
    
    // Démarrer le timer
    updateTimer();
    gameState.timerInterval = setInterval(updateTimer, 1000);
    
    const modeText = gameState.isTestMode ? 'mode test' : 'mode jeu';
    addToHistory(`🚀 Activité démarrée en ${modeText}`, 'system');
}

function pauseGame() {
    gameState.isRunning = false;
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('status').textContent = 'En pause';
    
    // Arrêter les mises à jour
    if (gameState.updateInterval) {
        clearInterval(gameState.updateInterval);
        clearTimeout(gameState.updateInterval);
        gameState.updateInterval = null;
    }
    
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    
    addToHistory('⏸️ Activité mise en pause', 'system');
}

function resetGame() {
    // Arrêter le jeu s'il était en cours
    if (gameState.isRunning) {
        pauseGame();
    }
    
    // Réinitialiser complètement
    initializeGame();
    updateDisplay();
    
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('status').textContent = 'Arrêté';
    document.getElementById('timer').textContent = '00:00:00';
    
    addToHistory('🔄 Jeu réinitialisé', 'system');
}

function updateStockPrices() {
    Object.keys(gameState.stocks).forEach(stockId => {
        const stock = gameState.stocks[stockId];
        stock.previousPrice = stock.price;
        
        // Calculer l'influence des investissements (plus d'investissements = tendance à la baisse)
        const totalInvested = gameState.totalInvestments[stockId];
        const investmentInfluence = Math.min(totalInvested / 50, 0.15); // Max -15% d'influence
        
        // Générer une variation de base plus importante (-20% à +20%)
        const baseVariation = (Math.random() - 0.5) * 0.4;
        
        // Appliquer l'influence des investissements (plus d'investissements = baisse)
        const finalVariation = baseVariation - investmentInfluence;
        
        const newPrice = Math.max(10, stock.price * (1 + finalVariation));
        
        stock.price = Math.round(newPrice * 100) / 100; // Arrondir à 2 décimales
        stock.change = stock.price - stock.previousPrice;
        stock.changePercent = (stock.change / stock.previousPrice) * 100;
    });
    
    updateDisplay();
    
    const modeText = gameState.isTestMode ? 'test' : 'jeu';
    addToHistory(`📊 Cours mis à jour (mode ${modeText})`, 'system');
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
        
        // Mettre à jour le tracker d'investissements
        gameState.totalInvestments[stockId] += quantity;
        
        addToHistory(`${team.name} achète ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} points`, 'buy');
    } else { // sell
        if (team.portfolio[stockId] < quantity) {
            alert(`Pas assez d'actions ! Actions disponibles: ${team.portfolio[stockId]}`);
            return;
        }
        
        team.points += totalCost;
        team.portfolio[stockId] -= quantity;
        
        // Mettre à jour le tracker d'investissements
        gameState.totalInvestments[stockId] = Math.max(0, gameState.totalInvestments[stockId] - quantity);
        
        addToHistory(`${team.name} vend ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} points`, 'sell');
    }
    
    // Réinitialiser le formulaire
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
    
    // Garder seulement les 50 dernières entrées
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
        
        // Animation pour les changements de prix
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
    // Mettre à jour le sélecteur d'équipe
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
    
    // Mettre à jour le sélecteur d'action
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
    
    // Créer un tableau avec les équipes et leurs valeurs
    const teamsArray = Object.values(gameState.teams).map(team => ({
        ...team,
        totalValue: calculateTeamValue(team),
        tokens: Math.floor(calculateTeamValue(team) / 50)
    }));
    
    // Trier par valeur totale décroissante
    teamsArray.sort((a, b) => b.totalValue - a.totalValue);
    
    // Générer les lignes du tableau
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

// Sauvegarder/charger l'état du jeu dans le localStorage
function saveGameState() {
    localStorage.setItem('actiBourseScout', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('actiBourseScout');
    if (saved) {
        try {
            const parsedState = JSON.parse(saved);
            // Fusionner avec l'état actuel en gardant les paramètres importants
            gameState.teams = parsedState.teams || gameState.teams;
            gameState.stocks = parsedState.stocks || gameState.stocks;
            gameState.history = parsedState.history || gameState.history;
            gameState.totalInvestments = parsedState.totalInvestments || gameState.totalInvestments;
        } catch (e) {
            console.log('Erreur lors du chargement de la sauvegarde');
        }
    }
}

// Sauvegarder automatiquement toutes les 30 secondes
setInterval(saveGameState, 30000);

// Charger l'état au démarrage
window.addEventListener('load', loadGameState);

function updateSpeedMode() {
    const slider = document.getElementById('speedSlider');
    const display = document.getElementById('speedDisplay');
    
    gameState.isTestMode = slider.value === '1';
    
    if (gameState.isTestMode) {
        display.textContent = 'Mode Test - Variations toutes les 10 secondes';
    } else {
        display.textContent = 'Mode Jeu - Variations aléatoires (1h à 1h30)';
    }
    
    // Si le jeu est en cours, redémarrer avec le nouveau mode
    if (gameState.isRunning) {
        clearInterval(gameState.updateInterval);
        if (gameState.isTestMode) {
            gameState.updateInterval = setInterval(updateStockPrices, CONFIG.TEST_UPDATE_INTERVAL);
        } else {
            scheduleNextUpdate();
        }
    }
}

function scheduleNextUpdate() {
    // Calculer un délai aléatoire entre 1h et 1h30
    const randomDelay = CONFIG.GAME_MIN_INTERVAL + 
        Math.random() * (CONFIG.GAME_MAX_INTERVAL - CONFIG.GAME_MIN_INTERVAL);
    
    gameState.nextUpdateTime = Date.now() + randomDelay;
    
    gameState.updateInterval = setTimeout(() => {
        if (gameState.isRunning) {
            updateStockPrices();
            scheduleNextUpdate(); // Programmer la prochaine mise à jour
        }
    }, randomDelay);
    
    const nextUpdateDate = new Date(gameState.nextUpdateTime);
    addToHistory(`⏰ Prochaine variation programmée à ${nextUpdateDate.toLocaleTimeString('fr-FR')}`, 'system');
}
