import express from 'express';
// Importa TOTES les funcions del controlador, inclosa la nova
import { 
  getRanking, 
  getStreak, 
  updateStreak, 
  updateProfilePicture,
  getMe // <-- NUEVA función que agregamos
} from '../controllers/userController.js';

const router = express.Router();

// --- Ruta de rànquing ---
router.get('/ranking', getRanking);

// --- Rutes de ratxa (Streak) ---
router.get('/streak', getStreak);
router.post('/streak', updateStreak);

// --- Endpoint para obtener datos completos del usuario ---
router.get('/me', getMe);  // <-- ESTA es la ruta que el frontend necesita: /api/me

// --- Ruta para subir foto de perfil ---
router.post('/profile/picture', updateProfilePicture);

export default router;
