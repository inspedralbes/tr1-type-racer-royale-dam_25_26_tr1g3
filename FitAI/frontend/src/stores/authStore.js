import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
    
    // CORRECCIÓ: L'estat inicial intenta carregar l'usuari des de localStorage
    state: () => ({
        user: JSON.parse(localStorage.getItem('user')) || null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.user,
        userName: (state) => state.user?.nom || null, // Canviat 'Convidat' per null
        
        // CORRECCIÓ: Getter per a l'ID numèric que necessitem
        userId: (state) => state.user?.id || null, 
    },

    actions: {
        async login(email, password) {
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Credencials incorrectes');
                }

                const userData = await response.json();
                this.user = userData;
                
                // CORRECCIÓ: Desa l'usuari a localStorage
                localStorage.setItem('user', JSON.stringify(userData));

            } catch (error) {
                this.user = null;
                localStorage.removeItem('user'); // Assegura que s'esborra
                throw error;
            }
        },

        async register(nom, email, password) {
            // ... (El teu 'register' estava bé)
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nom, email, password }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Error en el registre');
                }
            } catch (error) {
                throw error;
            }
        },

        async logout() {
            try {
                await fetch('/api/logout', { method: 'POST' });
            } catch (error) {
                console.error('Error en tancar la sessió al servidor:', error);
            }
            this.user = null;
            // CORRECCIÓ: Esborra l'usuari de localStorage
            localStorage.removeItem('user');
        },

        async checkAuth() {
            // Aquesta funció comprova si la sessió del backend segueix activa
            // És bona idea cridar-la a App.vue o main.js
            try {
                const response = await fetch('/api/me');
                if (!response.ok) {
                    // Si la sessió del backend ha mort, tanquem la del frontend
                    this.logout(); 
                    return;
                }
                this.user = await response.json();
                localStorage.setItem('user', JSON.stringify(this.user));
            } catch (error) {
                this.logout();
            }
        },
    },
});