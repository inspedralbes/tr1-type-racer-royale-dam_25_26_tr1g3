import express from 'express';
// Importa TOTES les funcions del controlador, inclosa la nova
import { 
  getRanking, 
  getStreak, 
  updateStreak, 
  updateProfilePicture // <-- AFEGIDA
} from '../controllers/userController.js';

const router = express.Router();

// --- Ruta de rànquing ---
router.get('/ranking', getRanking);

// --- Rutes de ratxa (Streak) ---
router.get('/streak', getStreak);
router.post('/streak', updateStreak);

// ===============================================
// AFEGEIX LA NOVA RUTA PER LA FOTO DE PERFIL
// ===============================================
// (El frontend truca a: POST /api/user/profile/picture)
router.post('/profile/picture', updateProfilePicture);


export default router;