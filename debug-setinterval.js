// VERSION DEBUG ULTRA-SIMPLE POUR IDENTIFIER LE PROBLÈME

console.log('🚀 DEBUG: Script chargé');

let testInterval = null;
let compteur = 0;

// Test 1: setInterval basic
function testBasicInterval() {
    console.log('🧪 TEST 1: setInterval basique');
    
    if (testInterval) {
        clearInterval(testInterval);
    }
    
    testInterval = setInterval(function() {
        compteur++;
        console.log(`✅ TEST INTERVAL FONCTIONNE! Compteur: ${compteur}`);
        
        // Arrêter après 5 fois
        if (compteur >= 5) {
            clearInterval(testInterval);
            console.log('🏁 Test basique terminé - setInterval fonctionne!');
            testGameStateInterval();
        }
    }, 2000); // Toutes les 2 secondes
    
    console.log('📝 setInterval créé avec ID:', testInterval);
}

// Test 2: avec gameState (simulation exacte)
function testGameStateInterval() {
    console.log('🧪 TEST 2: Simulation exacte du code du jeu');
    
    const mockGameState = {
        isRunning: true,
        isTestMode: true,
        updateInterval: null
    };
    
    const mockConfig = {
        TEST_UPDATE_INTERVAL: 5000 // 5 secondes pour le test
    };
    
    console.log('📊 Configuration test:');
    console.log('- isTestMode:', mockGameState.isTestMode);
    console.log('- TEST_UPDATE_INTERVAL:', mockConfig.TEST_UPDATE_INTERVAL);
    
    if (mockGameState.isTestMode) {
        console.log('⚡ CRÉATION DU SETINTERVAL POUR TEST (simulation exacte)');
        
        // COPIE EXACTE du code qui ne marche pas
        mockGameState.updateInterval = setInterval(() => {
            console.log('🎯 INTERVAL DE SIMULATION DÉCLENCHÉ!');
            console.log('- Timestamp:', new Date().toLocaleTimeString());
            console.log('- gameState.isRunning:', mockGameState.isRunning);
            
            // Simuler updateStockPrices()
            console.log('📈 Simulation updateStockPrices()');
            
        }, mockConfig.TEST_UPDATE_INTERVAL);
        
        console.log('📝 setInterval simulation créé avec ID:', mockGameState.updateInterval);
        console.log('📝 Intervalle configuré pour:', mockConfig.TEST_UPDATE_INTERVAL, 'ms');
        
        // Arrêter après 20 secondes
        setTimeout(() => {
            clearInterval(mockGameState.updateInterval);
            console.log('🏁 Test simulation terminé');
            testRealGameCode();
        }, 20000);
    }
}

// Test 3: Code réel du jeu
function testRealGameCode() {
    console.log('🧪 TEST 3: Test avec le vrai gameState');
    
    // Vérifier si gameState existe
    if (typeof gameState === 'undefined') {
        console.error('❌ gameState n\'est pas défini!');
        return;
    }
    
    console.log('📊 gameState réel:', {
        isRunning: gameState.isRunning,
        isTestMode: gameState.isTestMode,
        updateInterval: gameState.updateInterval
    });
    
    // Vérifier CONFIG
    if (typeof CONFIG === 'undefined') {
        console.error('❌ CONFIG n\'est pas défini!');
        return;
    }
    
    console.log('📊 CONFIG réel:', {
        TEST_UPDATE_INTERVAL: CONFIG.TEST_UPDATE_INTERVAL
    });
    
    // Vérifier updateStockPrices
    if (typeof updateStockPrices === 'undefined') {
        console.error('❌ updateStockPrices n\'est pas défini!');
        return;
    }
    
    console.log('✅ Toutes les variables existent');
    
    // Test direct
    console.log('🎯 LANCEMENT TEST DIRECT...');
    
    if (gameState.updateInterval) {
        clearInterval(gameState.updateInterval);
    }
    
    gameState.updateInterval = setInterval(function() {
        console.log('🎊 RÉEL INTERVAL FONCTIONNEL!');
        try {
            updateStockPrices();
            console.log('✅ updateStockPrices() exécuté avec succès');
        } catch (error) {
            console.error('❌ Erreur dans updateStockPrices:', error);
        }
    }, CONFIG.TEST_UPDATE_INTERVAL);
    
    console.log('📝 Réel interval créé:', gameState.updateInterval);
}

// Lancer les tests quand le DOM est prêt
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM prêt - lancement des tests dans 2 secondes...');
    setTimeout(testBasicInterval, 2000);
});

// Fonctions globales pour les tests manuels
window.runDebugTests = testBasicInterval;
window.testGameCode = testRealGameCode;