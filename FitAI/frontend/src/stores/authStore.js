import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', {
  // === ESTAT (STATE) ===
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
  }),

  // === GETTERS ===
  getters: {
    isLoggedIn: (state) => !!state.user,
    isAuthenticated: (state) => !!state.user,
    userName: (state) => state.user?.nom || 'Invitado',
    userId: (state) => state.user?.id || null,
  },

  // === ACCIONS (ACTIONS) ===
  actions: {
    async login(email, password) {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Credencials incorrectes');
        }

        const userData = await response.json();
        this.user = userData;
        
        localStorage.setItem('user', JSON.stringify(userData));

      } catch (error) {
        this.user = null;
        localStorage.removeItem('user');
        throw error;
      }
    },

    async register(nom, email, password) {
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
      } finally {
        this.user = null;
        localStorage.removeItem('user');
        
        if (this.router) {
          this.router.push({ name: 'Login' });
        } else {
            window.location.href = '/login';
        }
      }
    },

    async checkAuth() {
      if (!this.user) return; 
      
      try {
        const response = await fetch('/api/me');
        if (!response.ok) {
          this.user = null;
          localStorage.removeItem('user');
          return;
        }
        
        const userData = await response.json();
        this.user = userData;
        localStorage.setItem('user', JSON.stringify(userData));

      } catch (error) {
        this.user = null;
        localStorage.removeItem('user');
      }
    },
  },
});