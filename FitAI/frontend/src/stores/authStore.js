import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {

  state: () => ({
    user: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userName: (state) => state.user?.nom || 'Convidat',
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

      } catch (error) {
        this.user = null; 
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
      }
      this.user = null; 
    },

    async checkAuth() {
      try {
        const response = await fetch('/api/me');
        if (!response.ok) {
          this.user = null;
          return;
        }
        this.user = await response.json();
      } catch (error) {
        this.user = null;
      }
    },
  },
});