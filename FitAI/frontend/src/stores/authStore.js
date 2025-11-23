import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    hasShownStreakPopup: false
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
        this.user = userData.user || userData; 

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
      this.hasShownStreakPopup = false;
    },

    async checkAuth() {
      try {
        const response = await fetch(`/api/user/me?t=${Date.now()}`);
        
        if (!response.ok) {
          this.user = null;
          return;
        }
        const data = await response.json();
        this.user = data.user || data; 
        
      } catch (error) {
        this.user = null;
      }
    },

    async refreshUser() {
      try {
        const response = await fetch(`/api/user/me?t=${Date.now()}`);
        
        if (!response.ok) return;
        const data = await response.json();
        this.user = data.user || data;
        
      } catch (error) {
        console.error('Error refrescando usuario:', error);
      }
    },

    async updateProfilePicture(formData) {
      try {
        const response = await fetch('/api/user/profile/picture', { 
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al pujar la imatge.");
        }

        const data = await response.json();
        this.user = data.user || data;

      } catch (error) {
        console.error('Error al pujar la foto:', error);
        throw error;
      }
    },

    setStreakPopupShown() {
      this.hasShownStreakPopup = true;
    },
  },
});