const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Configuration du jeu
const CONFIG = {
    INITIAL_POINTS: 500,
    TEAMS_COUNT: 5,
    TEST_UPDATE_INTERVAL: 10000,
    GAME_MIN_INTERVAL: 300000,
    GAME_MAX_INTERVAL: 5400000,
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

// État du jeu côté serveur
let serverGameState = {
    stocks: {},
    teams: {},
    history: [],
    totalInvestments: {},
    isRunning: false,
    isTestMode: true,
    startTime: null,
    updateInterval: null
};

// Initialiser l'état du serveur
function initializeServerGame() {
    console.log('🔧 Initialisation du serveur...');
    
    // Nettoyer les intervals
    if (serverGameState.updateInterval) {
        clearInterval(serverGameState.updateInterval);
        clearTimeout(serverGameState.updateInterval);
        serverGameState.updateInterval = null;
    }
    
    // Initialiser les actions
    serverGameState.stocks = {};
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

    // Initialiser les équipes
    serverGameState.teams = {};
    for (let i = 1; i <= CONFIG.TEAMS_COUNT; i++) {
        const teamId = `equipe${i}`;
        serverGameState.teams[teamId] = {
            id: teamId,
            name: `Équipe ${i}`,
            points: CONFIG.INITIAL_POINTS,
            portfolio: {}
        };
        
        CONFIG.STOCKS.forEach(stock => {
            serverGameState.teams[teamId].portfolio[stock.id] = 0;
        });
    }
    
    serverGameState.history = [];
    serverGameState.isRunning = false;
    serverGameState.startTime = null;
    
    console.log('✅ Serveur initialisé');
}

// Mise à jour des prix côté serveur
function updateStockPricesServer() {
    console.log('📈 Mise à jour des cours (serveur)');
    
    Object.keys(serverGameState.stocks).forEach(stockId => {
        const stock = serverGameState.stocks[stockId];
        stock.previousPrice = stock.price;
        
        // Influence des investissements
        const totalInvested = serverGameState.totalInvestments[stockId] || 0;
        const investmentInfluence = Math.min(totalInvested / 100, 0.15);
        
        // Variation aléatoire
        const randomVariation = (Math.random() - 0.5) * 0.4;
        
        // Effet de retour à la moyenne
        const deviation = (stock.price - stock.initialPrice) / stock.initialPrice;
        const meanReversion = Math.abs(deviation) > 0.3 ? -deviation * 0.2 : 0;
        
        const finalVariation = randomVariation - investmentInfluence + meanReversion;
        
        let newPrice = stock.price * (1 + finalVariation);
        
        // Limites
        const minPrice = stock.initialPrice * 0.2;
        const maxPrice = stock.initialPrice * 5;
        newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
        
        stock.price = Math.round(newPrice * 100) / 100;
        stock.change = stock.price - stock.previousPrice;
        stock.changePercent = stock.previousPrice > 0 ? (stock.change / stock.previousPrice) * 100 : 0;
    });
    
    // Ajouter à l'historique
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    serverGameState.history.unshift({
        time: timestamp,
        message: '📊 Cours mis à jour (serveur)',
        type: 'system'
    });
    
    // Limiter l'historique
    if (serverGameState.history.length > 50) {
        serverGameState.history = serverGameState.history.slice(0, 50);
    }
    
    // Envoyer la mise à jour à tous les clients
    io.emit('stockUpdate', serverGameState);
}

function startServerUpdates() {
    // Nettoyer les intervals existants
    if (serverGameState.updateInterval) {
        clearInterval(serverGameState.updateInterval);
        clearTimeout(serverGameState.updateInterval);
    }
    
    if (serverGameState.isTestMode) {
        console.log('⚡ Démarrage mises à jour serveur - mode TEST');
        serverGameState.updateInterval = setInterval(() => {
            if (serverGameState.isRunning) {
                updateStockPricesServer();
            }
        }, CONFIG.TEST_UPDATE_INTERVAL);
    } else {
        console.log('🎲 Démarrage mises à jour serveur - mode JEU');
        scheduleNextUpdate();
    }
}

function scheduleNextUpdate() {
    const delay = CONFIG.GAME_MIN_INTERVAL + 
        Math.random() * (CONFIG.GAME_MAX_INTERVAL - CONFIG.GAME_MIN_INTERVAL);
    
    serverGameState.updateInterval = setTimeout(() => {
        if (serverGameState.isRunning && !serverGameState.isTestMode) {
            updateStockPricesServer();
            scheduleNextUpdate();
        }
    }, delay);
    
    console.log(`🎲 Prochaine mise à jour serveur dans ${Math.round(delay/1000)} secondes`);
}

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
    console.log('🔗 Nouveau client connecté:', socket.id);
    
    // Envoyer l'état actuel au nouveau client
    socket.emit('gameState', serverGameState);
    
    // Démarrer le jeu
    socket.on('startGame', (data) => {
        console.log('🚀 Démarrage du jeu demandé par', socket.id);
        
        if (!serverGameState.isRunning) {
            serverGameState.isRunning = true;
            serverGameState.isTestMode = data?.isTestMode || true;
            serverGameState.startTime = Date.now();
            
            startServerUpdates();
            
            io.emit('gameStarted');
            
            const timestamp = new Date().toLocaleTimeString('fr-FR');
            const modeText = serverGameState.isTestMode ? 'test' : 'jeu';
            serverGameState.history.unshift({
                time: timestamp,
                message: `🚀 Activité démarrée en mode ${modeText} (serveur)`,
                type: 'system'
            });
            
            io.emit('gameState', serverGameState);
        }
    });
    
    // Mettre en pause
    socket.on('pauseGame', () => {
        console.log('⏸️ Pause demandée par', socket.id);
        
        serverGameState.isRunning = false;
        
        if (serverGameState.updateInterval) {
            clearInterval(serverGameState.updateInterval);
            clearTimeout(serverGameState.updateInterval);
            serverGameState.updateInterval = null;
        }
        
        io.emit('gamePaused');
        
        const timestamp = new Date().toLocaleTimeString('fr-FR');
        serverGameState.history.unshift({
            time: timestamp,
            message: '⏸️ Jeu mis en pause (serveur)',
            type: 'system'
        });
        
        io.emit('gameState', serverGameState);
    });
    
    // Reset du jeu
    socket.on('resetGame', () => {
        console.log('🔄 Reset demandé par', socket.id);
        
        serverGameState.isRunning = false;
        
        if (serverGameState.updateInterval) {
            clearInterval(serverGameState.updateInterval);
            clearTimeout(serverGameState.updateInterval);
            serverGameState.updateInterval = null;
        }
        
        initializeServerGame();
        io.emit('gameState', serverGameState);
    });
    
    // Mise à jour manuelle
    socket.on('manualUpdate', () => {
        console.log('🧪 Mise à jour manuelle demandée par', socket.id);
        updateStockPricesServer();
    });
    
    // Mise à jour forcée
    socket.on('forceUpdate', () => {
        console.log('⚡ Mise à jour forcée demandée par', socket.id);
        
        Object.keys(serverGameState.stocks).forEach(stockId => {
            const stock = serverGameState.stocks[stockId];
            stock.previousPrice = stock.price;
            
            const variation = (Math.random() - 0.5) * 0.6;
            let newPrice = stock.price * (1 + variation);
            
            const minPrice = stock.initialPrice * 0.3;
            const maxPrice = stock.initialPrice * 3;
            newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
            
            stock.price = Math.round(newPrice * 100) / 100;
            stock.change = stock.price - stock.previousPrice;
            stock.changePercent = stock.previousPrice > 0 ? (stock.change / stock.previousPrice) * 100 : 0;
        });
        
        const timestamp = new Date().toLocaleTimeString('fr-FR');
        serverGameState.history.unshift({
            time: timestamp,
            message: '⚡ Mise à jour forcée (serveur)',
            type: 'system'
        });
        
        io.emit('stockUpdate', serverGameState);
    });
    
    // Traitement des transactions
    socket.on('transaction', (data) => {
        console.log('💰 Transaction reçue:', data);
        
        const { teamId, stockId, action, quantity } = data;
        const team = serverGameState.teams[teamId];
        const stock = serverGameState.stocks[stockId];
        
        if (!team || !stock) {
            socket.emit('transactionError', 'Équipe ou action invalide');
            return;
        }
        
        const totalCost = stock.price * quantity;
        
        if (action === 'buy') {
            if (team.points >= totalCost) {
                team.points -= totalCost;
                team.portfolio[stockId] = (team.portfolio[stockId] || 0) + quantity;
                serverGameState.totalInvestments[stockId] += quantity;
                
                const timestamp = new Date().toLocaleTimeString('fr-FR');
                serverGameState.history.unshift({
                    time: timestamp,
                    message: `🛒 ${team.name} achète ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`,
                    type: 'buy'
                });
                
                io.emit('gameState', serverGameState);
            } else {
                socket.emit('transactionError', `Pas assez de points! Coût: ${totalCost.toFixed(2)}, Disponible: ${team.points.toFixed(2)}`);
            }
        } else if (action === 'sell') {
            const owned = team.portfolio[stockId] || 0;
            if (owned >= quantity) {
                team.points += totalCost;
                team.portfolio[stockId] -= quantity;
                serverGameState.totalInvestments[stockId] = Math.max(0, serverGameState.totalInvestments[stockId] - quantity);
                
                const timestamp = new Date().toLocaleTimeString('fr-FR');
                serverGameState.history.unshift({
                    time: timestamp,
                    message: `💰 ${team.name} vend ${quantity} ${stock.name} pour ${totalCost.toFixed(2)} pts`,
                    type: 'sell'
                });
                
                io.emit('gameState', serverGameState);
            } else {
                socket.emit('transactionError', `Pas assez d'actions! Demandé: ${quantity}, Disponible: ${owned}`);
            }
        }
    });
    
    // Déconnexion
    socket.on('disconnect', () => {
        console.log('❌ Client déconnecté:', socket.id);
    });
});

// Route pour obtenir l'adresse IP
app.get('/ip', (req, res) => {
    const networkInterfaces = require('os').networkInterfaces();
    const addresses = [];
    
    for (const interfaceName in networkInterfaces) {
        const networkInterface = networkInterfaces[interfaceName];
        for (const addressInfo of networkInterface) {
            if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
                addresses.push(addressInfo.address);
            }
        }
    }
    
    res.json({ addresses });
});

// Initialiser le serveur
initializeServerGame();

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 ════════════════════════════════════════');
    console.log('🚀 ActiBourseScout Serveur démarré !');
    console.log('🚀 ════════════════════════════════════════');
    console.log(`📱 Accès local: http://localhost:${PORT}`);
    
    // Afficher les adresses IP disponibles
    const networkInterfaces = require('os').networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const networkInterface = networkInterfaces[interfaceName];
        for (const addressInfo of networkInterface) {
            if (addressInfo.family === 'IPv4' && !addressInfo.internal) {
                console.log(`📱 Accès réseau: http://${addressInfo.address}:${PORT}`);
            }
        }
    }
    console.log('🚀 ════════════════════════════════════════');
});

// Gestion des erreurs
process.on('uncaughtException', (error) => {
    console.error('❌ Erreur non gérée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesse rejetée:', reason);
});