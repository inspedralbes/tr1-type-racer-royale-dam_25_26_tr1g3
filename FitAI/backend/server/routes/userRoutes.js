import express from 'express';
import { 
  getRanking, 
  getStreak, 
  updateStreak, 
  updateProfilePicture,
  getMe,
  saveSessionStats 
} from '../controllers/userController.js';

const router = express.Router();

router.get('/ranking', getRanking);

router.get('/streak', getStreak);
router.post('/streak', updateStreak);

router.get('/me', getMe);

router.post('/profile/picture', updateProfilePicture);

router.post('/save-session', saveSessionStats); 

export default router;