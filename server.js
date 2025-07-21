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
    TEST_UPDATE_INTERVAL: 10000,    // 10 secondes
    GAME_MIN_INTERVAL: 180000,      // 3 minutes FIXES
    GAME_MAX_INTERVAL: 180000,      // 3 minutes FIXES
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
    console.log('🎯 Équipes créées:', Object.values(serverGameState.teams).map(t => t.name));
}

// Calcul de la valeur totale d'une équipe
function calculateTeamValueServer(team) {
    let totalValue = team.points;
    Object.keys(team.portfolio).forEach(stockId => {
        const quantity = team.portfolio[stockId] || 0;
        const stockPrice = serverGameState.stocks[stockId]?.price || 0;
        totalValue += quantity * stockPrice;
    });
    return totalValue;
}

// Mise à jour des prix avec système anti-crash
function updateStockPricesServer() {
    console.log('📈 MAJ cours serveur');
    
    Object.keys(serverGameState.stocks).forEach(stockId => {
        const stock = serverGameState.stocks[stockId];
        stock.previousPrice = stock.price;
        
        const totalInvested = serverGameState.totalInvestments[stockId] || 0;
        
        // SYSTÈME ÉQUILIBRÉ pour le serveur
        const investmentInfluence = Math.min(totalInvested / 500, 0.05);
        const randomBase = Math.random() - 0.5; // Pas de bias positif
        const randomVariation = randomBase * 0.2; // Plus de volatilité
        
        const currentRatio = stock.price / stock.initialPrice;
        let crashProtection = 0;
        
        if (currentRatio < 0.3) {
            crashProtection = 0.05;
        } else if (currentRatio < 0.5) {
            crashProtection = 0.02;
        }
        
        const finalVariation = investmentInfluence + randomVariation + crashProtection;
        
        let newPrice = stock.price * (1 + finalVariation);
        
        const minPrice = stock.initialPrice * 0.2;  // Peut descendre à 20%
        const maxPrice = stock.initialPrice * 5;    // Peut monter à 500%
        
        newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
        
        stock.price = Math.round(newPrice * 100) / 100;
        stock.change = stock.price - stock.previousPrice;
        stock.changePercent = (stock.change / stock.previousPrice) * 100;
    });
    
    addToServerHistory('📊 Cours mis à jour', 'system');
    io.emit('stockUpdate', { stocks: serverGameState.stocks });
    io.emit('gameState', serverGameState);
}

function addToServerHistory(message, type) {
    // ⚠️ CORRECTION FUSEAU HORAIRE SERVEUR
    const timestamp = new Date().toLocaleTimeString('fr-FR', {
        timeZone: 'Europe/Paris'
    });
    
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
    
    console.log(`⏰ Prochaine MAJ serveur dans ${Math.round(delay/1000)}s (${Math.round(delay/60000)}min)`);
}

// Validation et limites pour les transactions
function validateTransaction(teamId, stockId, action, quantity) {
    const team = serverGameState.teams[teamId];
    const stock = serverGameState.stocks[stockId];
    
    if (!team || !stock || quantity <= 0) {
        return { valid: false, message: 'Données invalides' };
    }
    
    const totalCost = stock.price * quantity;
    
    if (action === 'buy') {
        const maxQuantity = Math.floor(team.points / stock.price);
        if (quantity > maxQuantity) {
            return { 
                valid: false, 
                message: `Maximum ${maxQuantity} actions (${team.points.toFixed(2)} pts disponibles)`
            };
        }
        if (team.points < totalCost) {
            return { 
                valid: false, 
                message: `Fonds insuffisants: ${totalCost.toFixed(2)} pts requis`
            };
        }
    } else if (action === 'sell') {
        const owned = team.portfolio[stockId] || 0;
        if (quantity > owned) {
            return { 
                valid: false, 
                message: `Maximum ${owned} actions possédées`
            };
        }
    }
    
    return { valid: true, totalCost };
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
            console.log('🧪 Mode Test activé - MAJ toutes les 10 secondes');
        } else {
            // Mode jeu : interval FIXE de 3 minutes  
            updateInterval = setInterval(updateStockPricesServer, CONFIG.GAME_MIN_INTERVAL);
            console.log('🎮 Mode Jeu activé - MAJ toutes les 3 minutes');
        }
        
        addToServerHistory('🚀 Simulation lancée', 'system');
        io.emit('gameStarted', { startTime: serverGameState.startTime });
        io.emit('gameState', serverGameState);
    });
    
    // Pause
    socket.on('pauseGame', () => {
        console.log('⏸️ Pause serveur');
        serverGameState.isRunning = false;
        clearServerIntervals();
        addToServerHistory('⏸️ Simulation suspendue', 'system');
        io.emit('gamePaused');
        io.emit('gameState', serverGameState);
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
    
    // Mise à jour forcée (seule fonction gardée)
    socket.on('forceUpdate', () => {
        console.log('⚡ Mise à jour forcée demandée');
        updateStockPricesServer();
    });
    
    // Transaction avec validation complète
    socket.on('transaction', (data) => {
        const { teamId, stockId, action, quantity } = data;
        
        console.log(`🔄 Transaction serveur: ${teamId} ${action} ${quantity} ${stockId}`);
        
        // Validation complète
        const validation = validateTransaction(teamId, stockId, action, quantity);
        if (!validation.valid) {
            console.log(`❌ Transaction rejetée: ${validation.message}`);
            socket.emit('transactionError', { message: validation.message });
            return;
        }
        
        const team = serverGameState.teams[teamId];
        const stock = serverGameState.stocks[stockId];
        const totalCost = validation.totalCost;
        
        if (action === 'buy') {
            team.points = Math.round((team.points - totalCost) * 100) / 100;
            team.portfolio[stockId] = (team.portfolio[stockId] || 0) + quantity;
            serverGameState.totalInvestments[stockId] = (serverGameState.totalInvestments[stockId] || 0) + quantity;
            
            addToServerHistory(`🛒 ${team.name} achète ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`, 'buy');
            console.log(`✅ Achat: ${team.name} +${quantity} ${stock.name}`);
            
        } else if (action === 'sell') {
            team.points = Math.round((team.points + totalCost) * 100) / 100;
            team.portfolio[stockId] = Math.max(0, (team.portfolio[stockId] || 0) - quantity);
            serverGameState.totalInvestments[stockId] = Math.max(0, (serverGameState.totalInvestments[stockId] || 0) - quantity);
            
            addToServerHistory(`💰 ${team.name} vend ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`, 'sell');
            console.log(`✅ Vente: ${team.name} -${quantity} ${stock.name}`);
        }
        
        // Confirmer la transaction au client
        socket.emit('transactionSuccess', {
            message: `Transaction réussie: ${action === 'buy' ? 'Achat' : 'Vente'} de ${quantity} ${stock.name}`,
            newBalance: team.points
        });
        
        io.emit('gameState', serverGameState);
    });
    
    // Ajustement points
    socket.on('adjustPoints', (data) => {
        const { teamId, amount } = data;
        const team = serverGameState.teams[teamId];
        
        if (!team) {
            console.log(`❌ Ajustement points échoué: équipe ${teamId} non trouvée`);
            return;
        }
        
        team.points = Math.max(0, team.points + amount);
        const symbol = amount > 0 ? '+' : '';
        addToServerHistory(`🎯 ${team.name}: ${symbol}${amount} points`, 'system');
        
        console.log(`🎯 Ajustement: ${team.name} ${symbol}${amount} pts (nouveau total: ${team.points.toFixed(2)})`);
        
        io.emit('gameState', serverGameState);
    });
    
    // Demande d'état
    socket.on('requestGameState', () => {
        socket.emit('gameState', serverGameState);
    });
    
    // Demande des limites de transaction
    socket.on('getTransactionLimits', (data) => {
        const { teamId, stockId, action } = data;
        const team = serverGameState.teams[teamId];
        const stock = serverGameState.stocks[stockId];
        
        if (!team || !stock) return;
        
        let maxQuantity = 0;
        let infoText = '';
        
        if (action === 'buy') {
            maxQuantity = Math.floor(team.points / stock.price);
            infoText = `💰 Maximum : ${maxQuantity} actions (${team.points.toFixed(2)} pts disponibles)`;
        } else if (action === 'sell') {
            maxQuantity = team.portfolio[stockId] || 0;
            infoText = `📦 Maximum : ${maxQuantity} actions possédées`;
        }
        
        socket.emit('transactionLimits', {
            maxQuantity,
            infoText,
            teamId,
            stockId,
            action
        });
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

// Statistiques serveur (route debug)
app.get('/stats', (req, res) => {
    const stats = {
        isRunning: serverGameState.isRunning,
        startTime: serverGameState.startTime,
        teamsCount: Object.keys(serverGameState.teams).length,
        stocksCount: Object.keys(serverGameState.stocks).length,
        historyCount: serverGameState.history.length,
        isTestMode: serverGameState.isTestMode,
        totalInvestments: serverGameState.totalInvestments,
        teamValues: Object.values(serverGameState.teams).map(team => ({
            name: team.name,
            points: team.points,
            totalValue: calculateTeamValueServer(team),
            tokens: Math.floor(calculateTeamValueServer(team) / 50)
        }))
    };
    res.json(stats);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 ActiBourseScout serveur démarré sur le port ${PORT}`);
    console.log(`🌐 Accès: http://localhost:${PORT}`);
    console.log(`📊 Stats: http://localhost:${PORT}/stats`);
    console.log(`⏱️ Mode Test: 10 secondes | Mode Jeu: 5-30 minutes`);
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