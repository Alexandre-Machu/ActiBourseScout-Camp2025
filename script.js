/* filepath: c:\Users\alexc\Desktop\ActiBourseScout-Camp2025\script.js */

// Fonction utilitaire pour nettoyer gameState avant envoi
function getCleanGameState() {
    return {
        isRunning: gameState.isRunning,
        startTime: gameState.startTime,
        stocks: gameState.stocks,
        teams: gameState.teams,
        history: gameState.history,
        isTestMode: gameState.isTestMode,
        totalInvestments: gameState.totalInvestments
        // On exclut updateInterval et timerInterval qui causent les références circulaires
    };
}


// Configuration de l'application
const CONFIG = {
    INITIAL_POINTS: 500,
    TEST_UPDATE_INTERVAL: 10000,
    GAME_MIN_INTERVAL: 300000,
    GAME_MAX_INTERVAL: 5400000,
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

// Variables globales
let socket = null;
let isConnected = false;
let stockChart = null;

// État du jeu
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

// ========================
// INITIALISATION
// ========================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initialisation ActiBourseScout');
    
    // Connexion serveur
    connectToServer();
    
    // Initialisation
    initializeGame();
    setupEventListeners();
    initChart();
    updateDisplay();
    updateConnectionStatus();
    
    console.log('✅ Application prête');
    console.log('🎯 Équipes configurées:', CONFIG.TEAMS.map(t => t.name));
});

function connectToServer() {
    try {
        if (typeof io !== 'undefined') {
            console.log('🌐 Connexion au serveur...');
            socket = io();
            setupSocketListeners();
        }
    } catch (error) {
        console.log('📱 Mode hors ligne');
        isConnected = false;
    }
}

function setupSocketListeners() {
    if (!socket) return;
    
    socket.on('connect', () => {
        console.log('✅ Serveur connecté');
        isConnected = true;
        updateConnectionStatus();
        socket.emit('requestGameState');
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Serveur déconnecté');
        isConnected = false;
        updateConnectionStatus();
    });
    
    socket.on('gameState', (data) => {
        console.log('📥 État reçu du serveur');
        // Merger sans écraser les intervals locaux
        gameState.isRunning = data.isRunning || false;
        gameState.startTime = data.startTime || null;
        gameState.stocks = data.stocks || {};
        gameState.teams = data.teams || {};
        gameState.history = data.history || [];
        gameState.isTestMode = data.isTestMode || true;
        gameState.totalInvestments = data.totalInvestments || {};
        
        updateDisplay();
        updateButtons();
        
        // Synchroniser le timer si nécessaire
        if (gameState.isRunning && gameState.startTime && !gameState.timerInterval) {
            startTimer();
        }
    });
    
    socket.on('stockUpdate', (data) => {
        console.log('📈 Mise à jour cours reçue');
        gameState.stocks = data.stocks;
        updateDisplay();
        updateChart();
        addToHistory('📊 Cours mis à jour', 'system');
    });
    
    socket.on('gameStarted', (data) => {
        console.log('🚀 Jeu démarré par le serveur');
        gameState.isRunning = true;
        gameState.startTime = data.startTime;
        startTimer();
        updateButtons();
        addToHistory('🚀 Simulation lancée', 'system');
    });
    
    socket.on('gamePaused', () => {
        console.log('⏸️ Jeu mis en pause par le serveur');
        gameState.isRunning = false;
        stopTimer();
        updateButtons();
        addToHistory('⏸️ Simulation suspendue', 'system');
    });
    
    socket.on('gameReset', () => {
        console.log('🔄 Reset reçu du serveur');
        // Ne pas appeler initializeGame() pour éviter les conflits
        gameState.isRunning = false;
        gameState.startTime = null;
        stopTimer();
        resetTimer();
        updateButtons();
        addToHistory('🔄 Système réinitialisé', 'system');
    });
}

// ========================
// INITIALISATION DU JEU
// ========================

function initializeGame() {
    console.log('🔧 Initialisation du jeu');
    
    // Reset complet
    gameState = {
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
    
    // Créer les actions
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
    
    // Créer les équipes avec les VRAIS noms et couleurs
    CONFIG.TEAMS.forEach(teamConfig => {
        console.log(`✅ Création équipe: ${teamConfig.name} (ID: ${teamConfig.id})`);
        
        gameState.teams[teamConfig.id] = {
            id: teamConfig.id,
            name: teamConfig.name,           // NOM COMPLET avec emoji
            emoji: teamConfig.emoji,         // Emoji seul
            color: teamConfig.color,         // Couleur
            points: CONFIG.INITIAL_POINTS,
            portfolio: {}
        };
        
        // Initialiser les portefeuilles
        CONFIG.STOCKS.forEach(stock => {
            gameState.teams[teamConfig.id].portfolio[stock.id] = 0;
        });
    });
    
    console.log('✅ Jeu initialisé');
    console.log('🎯 Équipes créées:', Object.values(gameState.teams).map(t => t.name));
}

// ========================
// GRAPHIQUE
// ========================

function initChart() {
    const ctx = document.getElementById('stockChart');
    if (!ctx || typeof Chart === 'undefined') {
        console.warn('⚠️ Graphique non disponible (Chart.js manquant ou canvas inexistant)');
        return;
    }
    
    const stockColors = [
        '#3498db', '#f39c12', '#2ecc71', '#9b59b6', 
        '#e74c3c', '#1abc9c', '#f1c40f', '#95a5a6'
    ];
    
    const datasets = CONFIG.STOCKS.map((stock, index) => ({
        label: stock.name,
        data: [],
        borderColor: stockColors[index],
        backgroundColor: stockColors[index] + '20',
        borderWidth: 3,
        fill: false,
        tension: 0.2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBorderWidth: 2,
        pointBorderColor: '#fff',
        pointBackgroundColor: stockColors[index]
    }));
    
    stockChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                title: {
                    display: true,
                    text: 'Évolution des Cours Boursiers',
                    color: '#2d3748',
                    font: { size: 18, weight: 'bold' },
                    padding: 20
                },
                legend: {
                    position: 'top',
                    labels: {
                        color: '#2d3748',
                        font: { size: 12 },
                        padding: 15,
                        usePointStyle: true
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Temps', color: '#4a5568' },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    ticks: { color: '#718096', maxTicksLimit: 10 }
                },
                y: {
                    title: { display: true, text: 'Prix (points)', color: '#4a5568' },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    ticks: { 
                        color: '#718096',
                        callback: function(value) { return value.toFixed(1) + ' pts'; }
                    }
                }
            }
        }
    });
    
    console.log('📊 Graphique initialisé');
}

function updateChart() {
    if (!stockChart) return;
    
    const currentTime = new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    
    stockChart.data.labels.push(currentTime);
    
    CONFIG.STOCKS.forEach((stock, index) => {
        const stockData = gameState.stocks[stock.id];
        if (stockData) {
            stockChart.data.datasets[index].data.push(stockData.price);
        }
    });
    
    // Limiter à 15 points pour la lisibilité
    if (stockChart.data.labels.length > 15) {
        stockChart.data.labels.shift();
        stockChart.data.datasets.forEach(dataset => dataset.data.shift());
    }
    
    stockChart.update('none');
}

// ========================
// TIMER CORRIGÉ
// ========================

function startTimer() {
    console.log('⏰ Démarrage du timer');
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(updateTimer, 1000);
    updateTimer(); // Mise à jour immédiate
}

function stopTimer() {
    console.log('⏰ Arrêt du timer');
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    gameState.startTime = null;
    const timerElement = document.getElementById('timer');
    if (timerElement) timerElement.textContent = '00:00:00';
}

function updateTimer() {
    if (!gameState.startTime) return;
    
    const timerElement = document.getElementById('timer');
    if (!timerElement) {
        console.warn('⚠️ Élément timer non trouvé');
        return;
    }
    
    const elapsed = Date.now() - gameState.startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    timerElement.textContent = timeString;
}

// ========================
// CONTRÔLES DU JEU
// ========================

function startGame() {
    console.log('🚀 Démarrage');
    
    if (isConnected && socket) {
        const slider = document.getElementById('speedSlider');
        const isTestMode = slider.value === '1';
        socket.emit('startGame', { isTestMode });
    } else {
        startGameLocal();
    }
}

function startGameLocal() {
    console.log('🚀 Démarrage local');
    clearAllIntervals();
    
    gameState.isRunning = true;
    gameState.startTime = Date.now();
    gameState.isTestMode = document.getElementById('speedSlider').value === '1';
    
    startTimer();
    updateButtons();
    
    if (gameState.isTestMode) {
        gameState.updateInterval = setInterval(() => {
            updateStockPrices();
            updateChart();
        }, CONFIG.TEST_UPDATE_INTERVAL);
    } else {
        scheduleNextUpdate();
    }
    
    addToHistory('🚀 Simulation lancée (local)', 'system');
}

function pauseGame() {
    console.log('⏸️ Pause');
    
    if (isConnected && socket) {
        socket.emit('pauseGame');
    } else {
        pauseGameLocal();
    }
}

function pauseGameLocal() {
    gameState.isRunning = false;
    clearAllIntervals();
    stopTimer();
    updateButtons();
    addToHistory('⏸️ Simulation suspendue', 'system');
}

function resetGame() {
    console.log('🔄 Reset');
    
    if (isConnected && socket) {
        socket.emit('resetGame');
    } else {
        resetGameLocal();
    }
}

function resetGameLocal() {
    pauseGameLocal();
    initializeGame();
    resetTimer();
    
    // Reset du graphique
    if (stockChart) {
        stockChart.data.labels = [];
        stockChart.data.datasets.forEach(dataset => {
            dataset.data = [];
        });
        stockChart.update();
    }
    
    updateDisplay();
    document.getElementById('status').textContent = 'Arrêté';
    addToHistory('🔄 Système réinitialisé', 'system');
}

// ========================
// GESTION DES PRIX
// ========================

function updateStockPrices() {
    console.log('📈 Mise à jour des cours');
    
    Object.keys(gameState.stocks).forEach(stockId => {
        const stock = gameState.stocks[stockId];
        stock.previousPrice = stock.price;
        
        const totalInvested = gameState.totalInvestments[stockId] || 0;
        const investmentInfluence = Math.min(totalInvested / 100, 0.15);
        const randomVariation = (Math.random() - 0.5) * 0.4;
        
        const finalVariation = randomVariation - investmentInfluence;
        
        let newPrice = stock.price * (1 + finalVariation);
        newPrice = Math.max(10, Math.min(stock.initialPrice * 4, newPrice));
        
        stock.price = Math.round(newPrice * 100) / 100;
        stock.change = stock.price - stock.previousPrice;
        stock.changePercent = (stock.change / stock.previousPrice) * 100;
    });
    
    updateDisplay();
    addToHistory('📊 Cours mis à jour', 'system');
}

function scheduleNextUpdate() {
    const delay = CONFIG.GAME_MIN_INTERVAL + 
        Math.random() * (CONFIG.GAME_MAX_INTERVAL - CONFIG.GAME_MIN_INTERVAL);
    
    gameState.updateInterval = setTimeout(() => {
        if (gameState.isRunning && !gameState.isTestMode) {
            updateStockPrices();
            updateChart();
            scheduleNextUpdate();
        }
    }, delay);
    
    console.log(`⏰ Prochaine MAJ dans ${Math.round(delay/1000)}s`);
}

// ========================
// TRANSACTIONS
// ========================

function executeTransaction() {
    const teamId = document.getElementById('teamSelect').value;
    const stockId = document.getElementById('stockSelect').value;
    const action = document.getElementById('actionSelect').value;
    const quantity = parseInt(document.getElementById('quantityInput').value);
    
    if (!teamId || !stockId || !quantity || quantity <= 0) {
        alert('⚠️ Veuillez compléter tous les champs');
        return;
    }
    
    if (isConnected && socket) {
        socket.emit('transaction', { teamId, stockId, action, quantity });
    } else {
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
            alert(`❌ Fonds insuffisants!\nCoût: ${totalCost.toFixed(2)}\nDisponible: ${team.points.toFixed(2)}`);
            return;
        }
        
        team.points -= totalCost;
        team.portfolio[stockId] = (team.portfolio[stockId] || 0) + quantity;
        gameState.totalInvestments[stockId] += quantity;
        
        addToHistory(`🛒 ${team.name} achète ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`, 'buy');
        
    } else {
        const owned = team.portfolio[stockId] || 0;
        if (owned < quantity) {
            alert(`❌ Quantité insuffisante!\nDemandé: ${quantity}\nDisponible: ${owned}`);
            return;
        }
        
        team.points += totalCost;
        team.portfolio[stockId] -= quantity;
        gameState.totalInvestments[stockId] = Math.max(0, gameState.totalInvestments[stockId] - quantity);
        
        addToHistory(`💰 ${team.name} vend ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`, 'sell');
    }
    
    updateDisplay();
}

function adjustTeamPoints(teamId, amount) {
    if (isConnected && socket) {
        socket.emit('adjustPoints', { teamId, amount });
    } else {
        const team = gameState.teams[teamId];
        if (!team) return;
        
        team.points = Math.max(0, team.points + amount);
        const symbol = amount > 0 ? '+' : '';
        addToHistory(`🎯 ${team.name}: ${symbol}${amount} points`, 'system');
        updateDisplay();
    }
}

// ========================
// UTILITAIRES
// ========================

function calculateTeamValue(team) {
    let totalValue = team.points;
    Object.keys(team.portfolio).forEach(stockId => {
        const quantity = team.portfolio[stockId] || 0;
        const stockPrice = gameState.stocks[stockId]?.price || 0;
        totalValue += quantity * stockPrice;
    });
    return totalValue;
}

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

function updateButtons() {
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const statusElement = document.getElementById('status');
    
    if (gameState.isRunning) {
        if (startBtn) startBtn.disabled = true;
        if (pauseBtn) pauseBtn.disabled = false;
        if (statusElement) statusElement.textContent = 'En cours';
    } else {
        if (startBtn) startBtn.disabled = false;
        if (pauseBtn) pauseBtn.disabled = true;
        if (statusElement) statusElement.textContent = 'Arrêté';
    }
}

function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    const statusElement2 = document.getElementById('connectionStatus2');
    
    const statusText = isConnected ? '🟢 Serveur Connecté' : '🔴 Mode Hors Ligne';
    const statusClass = isConnected ? 'connection-status online' : 'connection-status offline';
    
    if (statusElement) {
        statusElement.textContent = statusText;
        statusElement.className = statusClass;
    }
    
    if (statusElement2) {
        statusElement2.textContent = statusText;
    }
}

function addToHistory(message, type) {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    gameState.history.unshift({ time: timestamp, message: message, type: type });
    
    if (gameState.history.length > 50) {
        gameState.history = gameState.history.slice(0, 50);
    }
    
    updateHistoryDisplay();
}

function updateSpeedMode() {
    const slider = document.getElementById('speedSlider');
    const display = document.getElementById('speedDisplay');
    
    if (!slider || !display) return;
    
    gameState.isTestMode = slider.value === '1';
    
    if (gameState.isTestMode) {
        display.textContent = 'Mode Test - Variations toutes les 10 secondes';
    } else {
        display.textContent = 'Mode Simulation - Variations aléatoires (5min à 1h30)';
    }
}

// ========================
// AFFICHAGE
// ========================

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
        console.log(`🖥️ Affichage équipe: ${team.name} (ID: ${team.id})`);
        
        const teamCard = document.createElement('div');
        teamCard.className = `team-card team-${team.id}`;
        
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
            <div class="team-total">📊 Valeur totale: <strong>${totalValue.toFixed(2)} pts</strong></div>
            <div class="team-tokens">🎫 Jetons: <strong>${tokens}</strong></div>
            
            <div class="team-controls">
                <button class="btn-mini btn-bonus" onclick="adjustTeamPoints('${team.id}', 50)" title="Bonus +50pts">+50</button>
                <button class="btn-mini btn-bonus" onclick="adjustTeamPoints('${team.id}', 10)" title="Bonus +10pts">+10</button>
                <button class="btn-mini btn-malus" onclick="adjustTeamPoints('${team.id}', -10)" title="Malus -10pts">-10</button>
                <button class="btn-mini btn-malus" onclick="adjustTeamPoints('${team.id}', -50)" title="Malus -50pts">-50</button>
            </div>
            
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
            <td>${team.name}</td>
            <td>${team.totalValue.toFixed(2)} pts</td>
            <td>${team.tokens} 🎫</td>
        `;
        
        leaderboardBody.appendChild(row);
    });
}

// ========================
// ÉVÉNEMENTS
// ========================

function setupEventListeners() {
    document.getElementById('startBtn')?.addEventListener('click', startGame);
    document.getElementById('pauseBtn')?.addEventListener('click', pauseGame);
    document.getElementById('resetBtn')?.addEventListener('click', resetGame);
    
    document.getElementById('testUpdateBtn')?.addEventListener('click', () => {
        if (isConnected && socket) {
            socket.emit('manualUpdate');
        } else {
            updateStockPrices();
            updateChart();
        }
    });
    
    document.getElementById('forceUpdateBtn')?.addEventListener('click', () => {
        if (isConnected && socket) {
            socket.emit('forceUpdate');
        } else {
            updateStockPrices();
            updateChart();
        }
    });
    
    document.getElementById('executeBtn')?.addEventListener('click', executeTransaction);
    document.getElementById('speedSlider')?.addEventListener('input', updateSpeedMode);
    
    updateSpeedMode();
}

// Rendre accessible globalement
window.adjustTeamPoints = adjustTeamPoints;

console.log('✅ ActiBourseScout - Version Professionnelle avec Graphique Chargée');