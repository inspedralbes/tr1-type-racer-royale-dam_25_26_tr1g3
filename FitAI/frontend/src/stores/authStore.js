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
        // Nos aseguramos de coger el usuario correctamente sea cual sea el formato
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

    // ----------------------------
    // CheckAuth: carga usuario completo desde el backend
    // ----------------------------
    async checkAuth() {
      try {
        // CAMBIO CLAVE: Añadimos ?t=Date.now() para romper la caché del navegador
        const response = await fetch(`/api/me?t=${Date.now()}`);
        
        if (!response.ok) {
          this.user = null;
          return;
        }
        const data = await response.json();
        
        // A veces el backend devuelve { user: {...} } y otras veces {...} directo.
        // Esto asegura que siempre cojamos el objeto correcto.
        this.user = data.user || data; 
        
      } catch (error) {
        this.user = null;
      }
    },

    // ----------------------------
    // RefreshUser: actualizar estadísticas después de cambios
    // ----------------------------
    async refreshUser() {
      try {
        // CAMBIO CLAVE: Aquí también rompemos la caché
        const response = await fetch(`/api/me?t=${Date.now()}`);
        
        if (!response.ok) return;
        const data = await response.json();
        
        // Actualización segura
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
        // Actualizamos con la respuesta del servidor que suele traer la URL nueva
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