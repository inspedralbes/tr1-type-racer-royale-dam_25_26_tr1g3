import express from 'express';
// Importa TOTES les funcions del controlador
import { 
  getRanking, 
  getStreak, 
  updateStreak, 
  updateProfilePicture,
  getMe,
  saveSessionStats // <--- 1. IMPORTANTE: Añadir esto
} from '../controllers/userController.js';

const router = express.Router();

// --- Ruta de rànquing ---
router.get('/ranking', getRanking);

// --- Rutes de ratxa (Streak) ---
router.get('/streak', getStreak);
router.post('/streak', updateStreak);

// --- Endpoint para obtener datos completos del usuario ---
router.get('/me', getMe);

// --- Ruta para subir foto de perfil ---
router.post('/profile/picture', updateProfilePicture);

// --- 2. IMPORTANTE: Ruta para guardar estadísticas del entrenamiento ---
// Esta ruta responde a: /api/user/save-session
router.post('/save-session', saveSessionStats); 

export default router;