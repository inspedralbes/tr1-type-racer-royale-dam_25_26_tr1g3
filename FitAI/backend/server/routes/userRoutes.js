import express from 'express';
import { getRanking } from '../controllers/userController.js';

const router = express.Router();

router.get('/ranking', getRanking);

export default router;