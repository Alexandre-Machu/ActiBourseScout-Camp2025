import streamlit as st
import pandas as pd
import time
import random
import json
from datetime import datetime, timedelta
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Configuration de l'application
CONFIG = {
    'INITIAL_POINTS': 500,
    'TEAMS_COUNT': 5,
    'TEST_UPDATE_INTERVAL': 10,  # 10 secondes pour le mode test
    'GAME_MIN_INTERVAL': 300,  # 5 minutes minimum en mode jeu
    'GAME_MAX_INTERVAL': 5400,  # 1h30 maximum en mode jeu
    'STOCKS': [
        {'id': 'montblanc', 'name': '🏔️ Mont Blanc', 'initialPrice': 50},
        {'id': 'monster', 'name': '👹 Monster', 'initialPrice': 50},
        {'id': 'benco', 'name': '🍫 Benco', 'initialPrice': 50},
        {'id': 'opinel', 'name': '🔪 Opinel', 'initialPrice': 50},
        {'id': 'quechua', 'name': '🏕️ Quechua', 'initialPrice': 50},
        {'id': 'redbull', 'name': '🐂 Red Bull', 'initialPrice': 50},
        {'id': 'patagonia', 'name': '🧗 Patagonia', 'initialPrice': 50},
        {'id': 'salomon', 'name': '🥾 Salomon', 'initialPrice': 50}
    ]
}

# Configuration de la page
st.set_page_config(
    page_title="🏕️ ActiBourseScout",
    page_icon="🏕️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Configuration de l'application
CONFIG = {
    'INITIAL_POINTS': 100,
    'TEAMS_COUNT': 5,
    'TEST_UPDATE_INTERVAL': 10,  # 10 secondes pour le mode test
    'GAME_MIN_INTERVAL': 300,  # 5 minutes minimum en mode jeu
    'GAME_MAX_INTERVAL': 5400,  # 1h30 maximum en mode jeu
    'STOCKS': [
        {'id': 'montblanc', 'name': '🏔️ Mont Blanc', 'initialPrice': 100},
        {'id': 'monster', 'name': '👹 Monster', 'initialPrice': 100},
        {'id': 'benco', 'name': '🍫 Benco', 'initialPrice': 100},
        {'id': 'opinel', 'name': '🔪 Opinel', 'initialPrice': 100},
        {'id': 'quechua', 'name': '🏕️ Quechua', 'initialPrice': 100}
    ]
}

# Initialisation des données dans le session state
def initialize_game():
    if 'game_initialized' not in st.session_state:
        st.session_state.game_initialized = True
        st.session_state.is_running = False
        st.session_state.start_time = None
        st.session_state.is_test_mode = True
        st.session_state.next_update_time = None
        
        # Initialiser les actions
        st.session_state.stocks = {}
        for stock in CONFIG['STOCKS']:
            st.session_state.stocks[stock['id']] = {
                **stock,
                'price': stock['initialPrice'],
                'previousPrice': stock['initialPrice'],
                'change': 0,
                'changePercent': 0,
                'history': [stock['initialPrice']]
            }
        
        # Initialiser les équipes
        st.session_state.teams = {}
        for i in range(1, CONFIG['TEAMS_COUNT'] + 1):
            team_id = f'equipe{i}'
            st.session_state.teams[team_id] = {
                'id': team_id,
                'name': f'Équipe {i}',
                'points': CONFIG['INITIAL_POINTS'],
                'portfolio': {stock['id']: 0 for stock in CONFIG['STOCKS']}
            }
        
        # Initialiser le tracker d'investissements
        st.session_state.total_investments = {stock['id']: 0 for stock in CONFIG['STOCKS']}
        
        # Historique des transactions
        st.session_state.history = []

def calculate_team_value(team):
    total_value = team['points']
    for stock_id, quantity in team['portfolio'].items():
        stock_price = st.session_state.stocks[stock_id]['price']
        total_value += quantity * stock_price
    return total_value

def update_stock_prices():
    for stock_id in st.session_state.stocks:
        stock = st.session_state.stocks[stock_id]
        stock['previousPrice'] = stock['price']
        
        # Calculer l'influence des investissements
        total_invested = st.session_state.total_investments[stock_id]
        investment_influence = min(total_invested / 50, 0.15)
        
        # Générer une variation de base (-20% à +20%)
        base_variation = (random.random() - 0.5) * 0.4
        
        # Appliquer l'influence des investissements
        final_variation = base_variation - investment_influence
        
        new_price = max(10, stock['price'] * (1 + final_variation))
        stock['price'] = round(new_price, 2)
        stock['change'] = stock['price'] - stock['previousPrice']
        stock['changePercent'] = (stock['change'] / stock['previousPrice']) * 100
        
        # Ajouter à l'historique des prix
        stock['history'].append(stock['price'])
        if len(stock['history']) > 100:  # Garder seulement les 100 derniers prix
            stock['history'] = stock['history'][-100:]

def add_to_history(message, transaction_type='system'):
    timestamp = datetime.now().strftime('%H:%M:%S')
    st.session_state.history.insert(0, {
        'time': timestamp,
        'message': message,
        'type': transaction_type
    })
    # Garder seulement les 50 dernières entrées
    if len(st.session_state.history) > 50:
        st.session_state.history = st.session_state.history[:50]

def reset_game():
    st.session_state.is_running = False
    st.session_state.start_time = None
    
    # Réinitialiser les actions
    for stock in CONFIG['STOCKS']:
        st.session_state.stocks[stock['id']] = {
            **stock,
            'price': stock['initialPrice'],
            'previousPrice': stock['initialPrice'],
            'change': 0,
            'changePercent': 0,
            'history': [stock['initialPrice']]
        }
    
    # Réinitialiser les équipes
    for i in range(1, CONFIG['TEAMS_COUNT'] + 1):
        team_id = f'equipe{i}'
        st.session_state.teams[team_id] = {
            'id': team_id,
            'name': f'Équipe {i}',
            'points': CONFIG['INITIAL_POINTS'],
            'portfolio': {stock['id']: 0 for stock in CONFIG['STOCKS']}
        }
    
    # Réinitialiser les investissements
    st.session_state.total_investments = {stock['id']: 0 for stock in CONFIG['STOCKS']}
    st.session_state.history = []
    add_to_history('🔄 Jeu réinitialisé', 'system')

# Interface principale
def main():
    initialize_game()
    
    # Titre
    st.title("🏕️ ActiBourseScout")
    st.markdown("**Simulation de bourse pour activité scout**")
    
    # Sidebar pour les contrôles
    with st.sidebar:
        st.header("🎮 Contrôles")
        
        # Mode de jeu
        test_mode = st.toggle("Mode Test (10s)", value=st.session_state.is_test_mode)
        st.session_state.is_test_mode = test_mode
        
        if test_mode:
            st.info("🧪 Mode Test - Variations toutes les 10 secondes")
        else:
            st.info("🎮 Mode Jeu - Variations aléatoires (1h à 1h30)")
        
        # Boutons de contrôle
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("▶️ Démarrer", disabled=st.session_state.is_running, use_container_width=True):
                st.session_state.is_running = True
                st.session_state.start_time = datetime.now()
                mode_text = 'mode test' if st.session_state.is_test_mode else 'mode jeu'
                add_to_history(f'🚀 Activité démarrée en {mode_text}', 'system')
                st.success("Activité démarrée !")
                st.rerun()
        
        with col2:
            if st.button("⏸️ Pause", disabled=not st.session_state.is_running, use_container_width=True):
                st.session_state.is_running = False
                add_to_history('⏸️ Activité mise en pause', 'system')
                st.info("Activité en pause")
                st.rerun()
        
        if st.button("🔄 Reset", use_container_width=True):
            reset_game()
            st.success("Jeu réinitialisé !")
            st.rerun()
        
        # Timer
        if st.session_state.start_time:
            elapsed = datetime.now() - st.session_state.start_time
            hours, remainder = divmod(int(elapsed.total_seconds()), 3600)
            minutes, seconds = divmod(remainder, 60)
            st.metric("⏱️ Temps écoulé", f"{hours:02d}:{minutes:02d}:{seconds:02d}")
        
        # Status
        status = "🟢 En cours" if st.session_state.is_running else "🔴 Arrêté"
        st.metric("📊 Statut", status)
    
    # Mise à jour automatique des prix si en cours
    if st.session_state.is_running:
        if st.session_state.is_test_mode:
            # En mode test, on peut utiliser st.rerun() avec un délai
            time.sleep(0.1)  # Petit délai pour éviter la surcharge
        
        # Simuler une mise à jour des prix (vous pourriez ajouter une logique de timing ici)
        if st.button("🔄 Mettre à jour les cours (Manuel)", key="manual_update"):
            update_stock_prices()
            mode_text = 'test' if st.session_state.is_test_mode else 'jeu'
            add_to_history(f'📊 Cours mis à jour (mode {mode_text})', 'system')
            st.rerun()
    
    # Interface principale en trois colonnes
    col1, col2, col3 = st.columns([2, 2, 1])
    
    with col1:
        # Marché des actions
        st.subheader("📈 Marché des Actions")
        
        for stock_id, stock in st.session_state.stocks.items():
            with st.container():
                col_name, col_price, col_change = st.columns([2, 1, 1])
                
                with col_name:
                    st.write(f"**{stock['name']}**")
                
                with col_price:
                    st.metric("Prix", f"{stock['price']:.2f} pts", f"{stock['change']:.2f}")
                
                with col_change:
                    change_color = "🟢" if stock['change'] > 0 else "🔴" if stock['change'] < 0 else "⚪"
                    st.write(f"{change_color} {stock['changePercent']:.1f}%")
        
        # Graphique des cours
        st.subheader("📊 Évolution des Cours")
        
        fig = go.Figure()
        for stock_id, stock in st.session_state.stocks.items():
            fig.add_trace(go.Scatter(
                y=stock['history'],
                mode='lines+markers',
                name=stock['name'],
                line=dict(width=2)
            ))
        
        fig.update_layout(
            title="Évolution des cours",
            xaxis_title="Temps",
            yaxis_title="Prix (points)",
            height=400
        )
        st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Équipes
        st.subheader("👥 Équipes")
        
        for team_id, team in st.session_state.teams.items():
            total_value = calculate_team_value(team)
            tokens = int(total_value // 10)
            
            with st.expander(f"{team['name']} - {total_value:.2f} pts ({tokens} 🎫)"):
                st.metric("💰 Points disponibles", f"{team['points']:.2f}")
                st.metric("📊 Valeur totale", f"{total_value:.2f}")
                st.metric("🎫 Jetons", tokens)
                
                # Portfolio
                st.write("**Portefeuille:**")
                portfolio_df = []
                for stock_id, quantity in team['portfolio'].items():
                    if quantity > 0:
                        stock_name = st.session_state.stocks[stock_id]['name']
                        stock_price = st.session_state.stocks[stock_id]['price']
                        value = quantity * stock_price
                        portfolio_df.append({
                            'Action': stock_name,
                            'Quantité': quantity,
                            'Valeur': f"{value:.2f} pts"
                        })
                
                if portfolio_df:
                    st.dataframe(pd.DataFrame(portfolio_df), hide_index=True)
                else:
                    st.info("Aucune action")
    
    with col3:
        # Tableau de classement
        st.subheader("🏆 Classement")
        
        teams_data = []
        for team_id, team in st.session_state.teams.items():
            total_value = calculate_team_value(team)
            tokens = int(total_value // 10)
            teams_data.append({
                'Équipe': team['name'],
                'Valeur': total_value,
                'Jetons': tokens
            })
        
        leaderboard_df = pd.DataFrame(teams_data).sort_values('Valeur', ascending=False)
        leaderboard_df['Position'] = range(1, len(leaderboard_df) + 1)
        leaderboard_df['Médaille'] = leaderboard_df['Position'].apply(
            lambda x: '🥇' if x == 1 else '🥈' if x == 2 else '🥉' if x == 3 else f"{x}"
        )
        
        display_df = leaderboard_df[['Médaille', 'Équipe', 'Valeur', 'Jetons']].copy()
        display_df['Valeur'] = display_df['Valeur'].apply(lambda x: f"{x:.2f}")
        
        st.dataframe(display_df, hide_index=True)
    
    # Section des transactions
    st.subheader("💰 Nouvelle Transaction")
    
    col1, col2, col3, col4, col5 = st.columns(5)
    
    with col1:
        selected_team = st.selectbox("Équipe", options=list(st.session_state.teams.keys()), 
                                   format_func=lambda x: st.session_state.teams[x]['name'])
    
    with col2:
        selected_stock = st.selectbox("Action", options=list(st.session_state.stocks.keys()),
                                    format_func=lambda x: f"{st.session_state.stocks[x]['name']} ({st.session_state.stocks[x]['price']:.2f} pts)")
    
    with col3:
        action = st.selectbox("Action", ["Acheter", "Vendre"])
    
    with col4:
        quantity = st.number_input("Quantité", min_value=1, value=1, step=1)
    
    with col5:
        st.write("")  # Spacer
        st.write("")  # Spacer
        if st.button("Exécuter", use_container_width=True):
            if selected_team and selected_stock and quantity > 0:
                team = st.session_state.teams[selected_team]
                stock = st.session_state.stocks[selected_stock]
                total_cost = stock['price'] * quantity
                
                if action == "Acheter":
                    if team['points'] >= total_cost:
                        team['points'] -= total_cost
                        team['portfolio'][selected_stock] += quantity
                        st.session_state.total_investments[selected_stock] += quantity
                        
                        add_to_history(f"{team['name']} achète {quantity} {stock['name']} pour {total_cost:.2f} points", 'buy')
                        st.success(f"Transaction réussie ! {team['name']} a acheté {quantity} {stock['name']}")
                        st.rerun()
                    else:
                        st.error(f"Pas assez de points ! Coût: {total_cost:.2f}, Disponible: {team['points']:.2f}")
                
                else:  # Vendre
                    if team['portfolio'][selected_stock] >= quantity:
                        team['points'] += total_cost
                        team['portfolio'][selected_stock] -= quantity
                        st.session_state.total_investments[selected_stock] = max(0, 
                            st.session_state.total_investments[selected_stock] - quantity)
                        
                        add_to_history(f"{team['name']} vend {quantity} {stock['name']} pour {total_cost:.2f} points", 'sell')
                        st.success(f"Transaction réussie ! {team['name']} a vendu {quantity} {stock['name']}")
                        st.rerun()
                    else:
                        st.error(f"Pas assez d'actions ! Disponible: {team['portfolio'][selected_stock]}")
            else:
                st.error("Veuillez remplir tous les champs")
    
    # Historique des transactions
    st.subheader("📋 Historique des Transactions")
    
    if st.session_state.history:
        history_df = pd.DataFrame(st.session_state.history)
        history_df['Type'] = history_df['type'].apply(
            lambda x: '🛒' if x == 'buy' else '💰' if x == 'sell' else '⚙️'
        )
        display_history = history_df[['Type', 'time', 'message']].copy()
        display_history.columns = ['', 'Heure', 'Transaction']
        
        st.dataframe(display_history, hide_index=True, use_container_width=True)
    else:
        st.info("Aucune transaction pour le moment")
    
    # Dictionnaire/Guide
    st.subheader("📚 Dictionnaire - Guide de l'Activité")
    
    # Créer des colonnes pour le dictionnaire
    col1, col2 = st.columns(2)
    
    with col1:
        with st.expander("💰 Points", expanded=False):
            st.write("""
            **Monnaie virtuelle de l'activité**
            - Chaque équipe commence avec **500 points**
            - Servent à acheter des actions
            - Récupérés lors de la vente d'actions
            """)
        
        with st.expander("📈 Actions", expanded=False):
            st.write("""
            **Parts d'entreprises fictives**
            - 5 entreprises : Mont Blanc 🏔️, Monster 👹, Benco 🍫, Opinel 🔪, Quechua 🏕️
            - Prix initial : **50 points chacune**
            - Les prix fluctuent automatiquement
            """)
        
        with st.expander("🎫 Jetons", expanded=False):
            st.write("""
            **Récompenses pour le jeu du soir**
            - **50 points = 1 jeton**
            - Calculés sur la valeur totale du portefeuille
            - Plus votre portefeuille vaut cher, plus vous gagnez de jetons !
            """)
        
        with st.expander("🏪 Portefeuille", expanded=False):
            st.write("""
            **Patrimoine total d'une équipe**
            - Actions possédées + points restants
            - Sa valeur totale détermine le classement
            - Détermine aussi les jetons gagnés
            """)
    
    with col2:
        with st.expander("📊 Cours/Prix", expanded=False):
            st.write("""
            **Prix actuel d'une action en points**
            - Varie automatiquement selon l'offre/demande
            - Plus une action est achetée, plus elle tend à baisser
            - Variations de -20% à +20% par mise à jour
            """)
        
        with st.expander("🛒 Acheter", expanded=False):
            st.write("""
            **Échanger des points contre des actions**
            - Coût = Prix × Quantité
            - Exemple : 3 actions Mont Blanc à 45 pts = 135 points
            - Réduit vos points disponibles
            """)
        
        with st.expander("💸 Vendre", expanded=False):
            st.write("""
            **Échanger des actions contre des points**
            - Au prix actuel du marché
            - Permet de récupérer des points si le cours a monté
            - Augmente vos points disponibles
            """)
        
        with st.expander("📈📉 Variations", expanded=False):
            st.write("""
            **Fréquence des changements de prix**
            - **Mode Test :** Toutes les 10 secondes
            - **Mode Jeu :** Aléatoirement entre 1h et 1h30
            - Amplitude : -20% à +20% par mise à jour
            """)
    
    # Conseils stratégiques
    st.subheader("💡 Conseils Stratégiques")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.info("""
        **🎯 Stratégies gagnantes :**
        - **Diversification :** Ne mettez pas tous vos points sur une seule action
        - **Timing :** Achetez quand c'est bas, vendez quand c'est haut
        - **Observation :** Surveillez les tendances et l'activité des autres équipes
        """)
    
    with col2:
        st.warning("""
        **⚠️ Points d'attention :**
        - **Patience :** Les cours remontent souvent après une chute
        - **Risque :** Plus vous investissez tôt, plus vous pouvez gagner (ou perdre)
        - **Influence :** Vos achats influencent les prix futurs
        """)
    
    # Exemple concret
    st.subheader("🎯 Exemple Concret")
    
    with st.container():
        st.success("""
        **Situation :** L'équipe 1 a 500 points au départ.
        
        **Action :** "On veut acheter 5 actions Mont Blanc à 50 points"
        
        **Coût :** 5 × 50 = 250 points
        
        **Résultat :** Points restants = 250, Actions = 5 Mont Blanc
        
        **Si Mont Blanc monte à 70 points :**
        
        **Nouvelle valeur :** 250 points + (5 × 70) = 600 points = **12 jetons** 🎫
        """)

    # Auto-refresh si le jeu est en cours
    if st.session_state.is_running and st.session_state.is_test_mode:
        time.sleep(1)
        st.rerun()

if __name__ == "__main__":
    main()
