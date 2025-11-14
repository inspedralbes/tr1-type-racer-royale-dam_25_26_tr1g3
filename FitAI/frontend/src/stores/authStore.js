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
      // ... (código existente de login)
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
      // ... (código existente de register)
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
      // ... (código existente de logout)
      try {
        await fetch('/api/logout', { method: 'POST' });
      } catch (error) {
        console.error('Error en tancar la sessió al servidor:', error);
      }
      this.user = null; 
    },

    async checkAuth() {
      // ... (código existente de checkAuth)
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
    
    // ===============================================
    // !!! NOU CÀNVI: ACCIÓ PER PUJAR LA FOTO DE PERFIL !!!
    // ===============================================
    async updateProfilePicture(formData) {
      try {
        // L'argument 'formData' conté el fitxer d'imatge.
        // La petició no necessita la capçalera Content-Type, ja que FormData la genera.
        const response = await fetch('/api/profile/picture', { // <-- Assegura't que l'endpoint del teu backend sigui correcte
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al pujar la imatge.");
        }

        const updatedUser = await response.json();
        
        // El backend ha de retornar l'objecte d'usuari actualitzat amb la nova foto_url.
        this.user = updatedUser; 

      } catch (error) {
        console.error('Error al pujar la foto:', error);
        throw error;
      }
    },
    // ===============================================
  },
});