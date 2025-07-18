// VERSION ULTRA-SIMPLIFIÉE POUR DEBUG
// Cette version élimine TOUTE complexité pour identifier le problème

const CONFIG = {
    TEST_UPDATE_INTERVAL: 10000, // 10 secondes
    STOCKS: [
        { id: 'montblanc', name: '🏔️ Mont Blanc', initialPrice: 50 },
        { id: 'monster', name: '👹 Monster', initialPrice: 50 },
        { id: 'benco', name: '🍫 Benco', initialPrice: 50 },
        { id: 'opinel', name: '🔪 Opinel', initialPrice: 50 }
    ]
};

// État minimal
let gameState = {
    isRunning: false,
    updateInterval: null,
    stocks: {}
};

// Initialisation ultra-simple
function initMinimal() {
    console.log('🎯 INIT MINIMAL');
    
    // Créer les stocks
    CONFIG.STOCKS.forEach(stock => {
        gameState.stocks[stock.id] = {
            name: stock.name,
            price: stock.initialPrice
        };
    });
    
    updateStocksDisplay();
    console.log('✅ Init terminée');
}

// Mise à jour ultra-simple
function updatePrices() {
    console.log('🔄 MISE À JOUR FORCÉE !');
    
    Object.values(gameState.stocks).forEach(stock => {
        const oldPrice = stock.price;
        const variation = (Math.random() - 0.5) * 0.2; // -10% à +10%
        stock.price = Math.max(10, stock.price * (1 + variation));
        stock.price = Math.round(stock.price * 100) / 100;
        
        console.log(`${stock.name}: ${oldPrice.toFixed(2)} → ${stock.price.toFixed(2)}`);
    });
    
    updateStocksDisplay();
    console.log('✅ Mise à jour terminée');
}

// Affichage ultra-simple
function updateStocksDisplay() {
    const grid = document.getElementById('stocksGrid');
    grid.innerHTML = '';
    
    Object.values(gameState.stocks).forEach(stock => {
        const div = document.createElement('div');
        div.className = 'stock-card';
        div.innerHTML = `
            <div class="stock-name">${stock.name}</div>
            <div class="stock-price">${stock.price.toFixed(2)} pts</div>
        `;
        grid.appendChild(div);
    });
}

// Démarrage ultra-simple
function startMinimal() {
    console.log('🚀 DÉMARRAGE MINIMAL');
    
    if (gameState.updateInterval) {
        console.log('🧹 Nettoyage ancien interval');
        clearInterval(gameState.updateInterval);
    }
    
    gameState.isRunning = true;
    
    console.log('⏰ Création setInterval...');
    gameState.updateInterval = setInterval(() => {
        console.log('⚡ INTERVAL DÉCLENCHÉ !');
        updatePrices();
    }, CONFIG.TEST_UPDATE_INTERVAL);
    
    console.log('📝 Interval créé avec ID:', gameState.updateInterval);
    console.log('✅ Démarrage terminé - les prix devraient changer toutes les 10 secondes');
    
    // Test immédiat
    updatePrices();
}

// Arrêt ultra-simple
function stopMinimal() {
    console.log('⏸️ ARRÊT');
    gameState.isRunning = false;
    
    if (gameState.updateInterval) {
        clearInterval(gameState.updateInterval);
        gameState.updateInterval = null;
        console.log('✅ Interval supprimé');
    }
}

// Test manuel
function testUpdate() {
    console.log('🧪 TEST MANUEL');
    updatePrices();
}

// Diagnostic
function debug() {
    console.log('🔍 DIAGNOSTIC:');
    console.log('- isRunning:', gameState.isRunning);
    console.log('- updateInterval:', gameState.updateInterval);
    console.log('- Stocks:', Object.keys(gameState.stocks));
}

// Exposition des fonctions
window.startMinimal = startMinimal;
window.stopMinimal = stopMinimal;
window.testUpdate = testUpdate;
window.debug = debug;

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM PRÊT - VERSION MINIMALE');
    initMinimal();
    
    // Ajouter les event listeners aux boutons existants
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    
    if (startBtn) {
        startBtn.onclick = startMinimal;
    }
    
    if (pauseBtn) {
        pauseBtn.onclick = stopMinimal;
    }
    
    console.log('✅ VERSION MINIMALE PRÊTE');
    console.log('📖 Commandes disponibles dans la console:');
    console.log('   - startMinimal() : démarrer');
    console.log('   - stopMinimal() : arrêter');
    console.log('   - testUpdate() : test manuel');
    console.log('   - debug() : diagnostic');
});
