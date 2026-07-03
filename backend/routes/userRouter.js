import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  giveSecondChance
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.get('/users', protect, getAllUsers);
router.post('/users/:id/second-chance', protect, giveSecondChance);

export default router;
