import express from 'express';
import { AuthController } from '../controllers/authController';
import { UserRepository } from '../infrastructure/repositories/UserRepository';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Create dependencies once
const userRepository = new UserRepository();
const authController = new AuthController(userRepository);

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/me', protect, authController.getCurrentUser);

export default router;