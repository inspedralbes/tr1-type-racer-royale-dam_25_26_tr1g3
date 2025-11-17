import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {

  state: () => ({
    user: null,
    hasShownStreakPopup: false // <-- 1. AFEGEIX AIXÒ
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    userName: (state) => state.user?.nom || 'Convidat',
  },

  actions: {
    // ... (login, register... tot això queda igual) ...
    async login(email, password) {
      // ... (código existente)
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
      // ... (código existente)
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
      // ... (código existente)
      try {
        await fetch('/api/logout', { method: 'POST' });
      } catch (error) {
        console.error('Error en tancar la sessió al servidor:', error);
      }
      this.user = null; 
      this.hasShownStreakPopup = false; // <-- 2. AFEGEIX AIXÒ (per reiniciar)
    },

    async checkAuth() {
      // ... (código existente)
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
    
    async updateProfilePicture(formData) {
       // ... (el teu codi de pujar foto queda igual) ...
      try {
        const response = await fetch('/api/profile/picture', { 
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al pujar la imatge.");
        }

        const updatedUser = await response.json();
        this.user = updatedUser; 

      } catch (error) {
        console.error('Error al pujar la foto:', error);
        throw error;
      }
    },
    
    // 3. AFEGEIX AQUESTA NOVA ACCIÓ SENCERA
    setStreakPopupShown() {
      this.hasShownStreakPopup = true;
    },
  },
});