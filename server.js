const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configuration
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

// État global du serveur (SANS INTERVALS)
let serverGameState = {
    isRunning: false,
    startTime: null,
    stocks: {},
    teams: {},
    history: [],
    isTestMode: true,
    totalInvestments: {}
};

// Variables pour les intervals (séparées de gameState)
let updateInterval = null;
let isInitialized = false;

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname)));

// Initialisation du jeu côté serveur
function initializeServerGame() {
    console.log('🔧 Initialisation serveur');
    
    // Reset complet
    serverGameState = {
        isRunning: false,
        startTime: null,
        stocks: {},
        teams: {},
        history: [],
        isTestMode: true,
        totalInvestments: {}
    };
    
    // Créer les actions
    CONFIG.STOCKS.forEach(stock => {
        serverGameState.stocks[stock.id] = {
            id: stock.id,
            name: stock.name,
            initialPrice: stock.initialPrice,
            price: stock.initialPrice,
            previousPrice: stock.initialPrice,
            change: 0,
            changePercent: 0
        };
        serverGameState.totalInvestments[stock.id] = 0;
    });
    
    // Créer les équipes
    CONFIG.TEAMS.forEach(teamConfig => {
        serverGameState.teams[teamConfig.id] = {
            id: teamConfig.id,
            name: teamConfig.name,
            emoji: teamConfig.emoji,
            color: teamConfig.color,
            points: CONFIG.INITIAL_POINTS,
            portfolio: {}
        };
        
        CONFIG.STOCKS.forEach(stock => {
            serverGameState.teams[teamConfig.id].portfolio[stock.id] = 0;
        });
    });
    
    isInitialized = true;
    console.log('✅ Serveur initialisé');
}

function updateStockPricesServer() {
    console.log('📈 MAJ cours serveur');
    
    Object.keys(serverGameState.stocks).forEach(stockId => {
        const stock = serverGameState.stocks[stockId];
        stock.previousPrice = stock.price;
        
        const totalInvested = serverGameState.totalInvestments[stockId] || 0;
        const investmentInfluence = Math.min(totalInvested / 100, 0.15);
        const randomVariation = (Math.random() - 0.5) * 0.4;
        const finalVariation = randomVariation - investmentInfluence;
        
        let newPrice = stock.price * (1 + finalVariation);
        newPrice = Math.max(10, Math.min(stock.initialPrice * 4, newPrice));
        
        stock.price = Math.round(newPrice * 100) / 100;
        stock.change = stock.price - stock.previousPrice;
        stock.changePercent = (stock.change / stock.previousPrice) * 100;
    });
    
    // Diffuser les mises à jour
    io.emit('stockUpdate', { stocks: serverGameState.stocks });
}

function addToServerHistory(message, type) {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    serverGameState.history.unshift({ time: timestamp, message: message, type: type });
    
    if (serverGameState.history.length > 50) {
        serverGameState.history = serverGameState.history.slice(0, 50);
    }
}

function clearServerIntervals() {
    if (updateInterval) {
        clearInterval(updateInterval);
        clearTimeout(updateInterval);
        updateInterval = null;
    }
}

function scheduleNextServerUpdate() {
    const delay = CONFIG.GAME_MIN_INTERVAL + 
        Math.random() * (CONFIG.GAME_MAX_INTERVAL - CONFIG.GAME_MIN_INTERVAL);
    
    updateInterval = setTimeout(() => {
        if (serverGameState.isRunning && !serverGameState.isTestMode) {
            updateStockPricesServer();
            scheduleNextServerUpdate();
        }
    }, delay);
    
    console.log(`⏰ Prochaine MAJ serveur dans ${Math.round(delay/1000)}s`);
}

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
    console.log('👤 Client connecté:', socket.id);
    
    if (!isInitialized) {
        initializeServerGame();
    }
    
    // Envoyer l'état actuel au nouveau client
    socket.emit('gameState', serverGameState);
    
    // Démarrer le jeu
    socket.on('startGame', (data) => {
        console.log('🚀 Démarrage serveur');
        clearServerIntervals();
        
        serverGameState.isRunning = true;
        serverGameState.startTime = Date.now();
        serverGameState.isTestMode = data.isTestMode;
        
        if (serverGameState.isTestMode) {
            updateInterval = setInterval(updateStockPricesServer, CONFIG.TEST_UPDATE_INTERVAL);
        } else {
            scheduleNextServerUpdate();
        }
        
        addToServerHistory('🚀 Simulation lancée', 'system');
        io.emit('gameStarted', { startTime: serverGameState.startTime });
    });
    
    // Pause
    socket.on('pauseGame', () => {
        console.log('⏸️ Pause serveur');
        serverGameState.isRunning = false;
        clearServerIntervals();
        addToServerHistory('⏸️ Simulation suspendue', 'system');
        io.emit('gamePaused');
    });
    
    // Reset
    socket.on('resetGame', () => {
        console.log('🔄 Reset serveur');
        clearServerIntervals();
        initializeServerGame();
        addToServerHistory('🔄 Système réinitialisé', 'system');
        io.emit('gameReset');
        io.emit('gameState', serverGameState);
    });
    
    // Mise à jour manuelle
    socket.on('manualUpdate', () => {
        updateStockPricesServer();
    });
    
    socket.on('forceUpdate', () => {
        updateStockPricesServer();
    });
    
    // Transaction
    socket.on('transaction', (data) => {
        const { teamId, stockId, action, quantity } = data;
        const team = serverGameState.teams[teamId];
        const stock = serverGameState.stocks[stockId];
        
        if (!team || !stock) return;
        
        const totalCost = stock.price * quantity;
        
        if (action === 'buy') {
            if (team.points < totalCost) return;
            
            team.points -= totalCost;
            team.portfolio[stockId] = (team.portfolio[stockId] || 0) + quantity;
            serverGameState.totalInvestments[stockId] += quantity;
            
            addToServerHistory(`🛒 ${team.name} achète ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`, 'buy');
            
        } else {
            const owned = team.portfolio[stockId] || 0;
            if (owned < quantity) return;
            
            team.points += totalCost;
            team.portfolio[stockId] -= quantity;
            serverGameState.totalInvestments[stockId] = Math.max(0, serverGameState.totalInvestments[stockId] - quantity);
            
            addToServerHistory(`💰 ${team.name} vend ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`, 'sell');
        }
        
        io.emit('gameState', serverGameState);
    });
    
    // Ajustement points
    socket.on('adjustPoints', (data) => {
        const { teamId, amount } = data;
        const team = serverGameState.teams[teamId];
        
        if (!team) return;
        
        team.points = Math.max(0, team.points + amount);
        const symbol = amount > 0 ? '+' : '';
        addToServerHistory(`🎯 ${team.name}: ${symbol}${amount} points`, 'system');
        
        io.emit('gameState', serverGameState);
    });
    
    // Demande d'état
    socket.on('requestGameState', () => {
        socket.emit('gameState', serverGameState);
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
        console.log('👤 Client déconnecté:', socket.id);
    });
});

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 ActiBourseScout serveur démarré sur le port ${PORT}`);
    console.log(`🌐 Accès: http://localhost:${PORT}`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur...');
    clearServerIntervals();
    server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
    });
});