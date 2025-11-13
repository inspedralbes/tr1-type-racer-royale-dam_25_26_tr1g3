import express from 'express';
import { crearSala, unirSala } from '../controllers/salaController.js';

const router = express.Router();

router.post('/crear', crearSala);
router.post('/unir', unirSala);

export default router;