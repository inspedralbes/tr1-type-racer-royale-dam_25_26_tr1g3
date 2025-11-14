import express from 'express';
// ¡Importa las nuevas funciones del controlador!
import { getRanking, getStreak, updateStreak } from '../controllers/userController.js';

const router = express.Router();

// Ruta de ranking (la que ya tenías)
router.get('/ranking', getRanking);

// ======================================================
// AÑADE ESTAS RUTAS NUEVAS PARA LA RACHA
// ======================================================

// Ruta GET para obtener la racha actual
// (El frontend llama a: GET /api/user/streak)
router.get('/streak', getStreak);

// Ruta POST para actualizar la racha (al iniciar sesión)
// (El frontend llama a: POST /api/user/streak)
router.post('/streak', updateStreak);


export default router;